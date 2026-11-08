import { Peer, DataConnection } from 'peerjs';
import { GameState, QuestionSet, OptionKey } from '../types';

export type SyncMessage =
  | { type: 'STATE_UPDATE'; state: GameState; questionSets?: QuestionSet[] }
  | { type: 'SUBMIT_ANSWER'; teamId: number; choice: OptionKey; choiceTime?: number }
  | { type: 'PING'; teamId: number }
  | { type: 'START_TIMER'; duration?: number }
  | { type: 'PAUSE_TIMER' }
  | { type: 'REVEAL_ANSWERS' }
  | { type: 'RESET_QUESTION' }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREV_QUESTION' };

export class SyncManager {
  private peer: Peer | null = null;
  private connections: DataConnection[] = [];
  private hostConnection: DataConnection | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private ws: WebSocket | null = null;
  private isHost: boolean = false;
  private roomId: string = '10A6';
  private onMessageCallback: (msg: SyncMessage) => void = () => {};
  private onConnectionChangeCallback: (connected: boolean) => void = () => {};

  constructor(
    isHost: boolean,
    roomId: string,
    onMessage: (msg: SyncMessage) => void,
    onConnectionChange: (connected: boolean) => void
  ) {
    this.isHost = isHost;
    this.roomId = roomId || '10A6';
    this.onMessageCallback = onMessage;
    this.onConnectionChangeCallback = onConnectionChange;

    this.initBroadcastChannel();
    this.initWebSocket();
    this.initPeerJS();
  }

  // 1. BroadcastChannel for same-device multi-tab testing
  private initBroadcastChannel() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel(`olympia_room_${this.roomId}`);
        this.broadcastChannel.onmessage = (event) => {
          if (event.data) {
            this.onMessageCallback(event.data);
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported or restricted:', e);
    }
  }

  // 2. WebSocket for container / Express backend (if running)
  private initWebSocket() {
    try {
      if (typeof window === 'undefined') return;
      // Do not attempt WS to same domain on static CDNs like Netlify, Vercel, GitHub Pages
      const hostname = window.location.hostname;
      const isStaticCdn =
        hostname.includes('netlify.app') ||
        hostname.includes('vercel.app') ||
        hostname.includes('github.io') ||
        hostname.includes('firebaseapp.com');
      if (isStaticCdn) return;

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;

      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      ws.onopen = () => {
        this.onConnectionChangeCallback(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.state) {
            this.onMessageCallback({
              type: 'STATE_UPDATE',
              state: data.state,
              questionSets: data.questionSets,
            });
          }
        } catch {}
      };

      ws.onerror = () => {
        // Silently catch WebSocket errors
      };

      ws.onclose = () => {
        this.ws = null;
        if (!this.isDestroyed) {
          setTimeout(() => {
            if (!this.isDestroyed) {
              this.initWebSocket();
            }
          }, 3000);
        }
      };
    } catch {}
  }

  // 3. WebRTC PeerJS for serverless cross-device connection (Netlify, Vercel, WiFi)
  private retryPeerCount: number = 0;
  private isDestroyed: boolean = false;

  private initPeerJS() {
    try {
      if (typeof window === 'undefined' || this.isDestroyed) return;

      const cleanRoomId = (this.roomId || '10A6').toLowerCase().replace(/[^a-z0-9]/g, '');
      const hostPeerId = `olympia-room-${cleanRoomId}-host`;

      const peerOptions = {
        debug: 0,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun.cloudflare.com:3478' },
          ],
        },
      };

      if (this.isHost) {
        // Teacher / Host Peer
        const peer = new Peer(hostPeerId, peerOptions);
        this.peer = peer;

        peer.on('open', () => {
          this.retryPeerCount = 0;
          this.onConnectionChangeCallback(true);
        });

        peer.on('connection', (conn) => {
          this.connections.push(conn);
          this.onConnectionChangeCallback(true);

          conn.on('data', (data: unknown) => {
            if (data && typeof data === 'object') {
              this.onMessageCallback(data as SyncMessage);
            }
          });

          conn.on('close', () => {
            this.connections = this.connections.filter((c) => c !== conn);
          });
        });

        peer.on('error', () => {
          // Fallback gracefully without aggressive reconnect loops
        });
      } else {
        // Student / Mobile Peer
        const studentPeerId = `olympia-client-${Math.random().toString(36).substring(2, 9)}`;
        const peer = new Peer(studentPeerId, peerOptions);
        this.peer = peer;

        peer.on('open', () => {
          this.connectToHost(hostPeerId);
        });

        peer.on('error', () => {
          // Quietly handle errors
        });
      }
    } catch (e) {
      console.warn('PeerJS init failed:', e);
    }
  }

  private connectToHost(hostPeerId: string) {
    if (!this.peer || this.peer.destroyed) return;
    try {
      const conn = this.peer.connect(hostPeerId, {
        reliable: true,
      });

      conn.on('open', () => {
        this.hostConnection = conn;
        this.onConnectionChangeCallback(true);
      });

      conn.on('data', (data: unknown) => {
        if (data && typeof data === 'object') {
          this.onMessageCallback(data as SyncMessage);
        }
      });

      conn.on('close', () => {
        this.hostConnection = null;
        this.onConnectionChangeCallback(false);
      });

      conn.on('error', () => {
        this.hostConnection = null;
      });
    } catch {}
  }

  // Broadcast to all peers, broadcastChannel, and WebSocket
  public broadcast(msg: SyncMessage) {
    // 1. BroadcastChannel (same browser tabs)
    try {
      this.broadcastChannel?.postMessage(msg);
    } catch {}

    // 2. PeerJS WebRTC
    if (this.isHost) {
      // Send to all connected student phones
      this.connections.forEach((conn) => {
        if (conn.open) {
          try {
            conn.send(msg);
          } catch {}
        }
      });
    } else {
      // Send to host teacher screen
      if (this.hostConnection && this.hostConnection.open) {
        try {
          this.hostConnection.send(msg);
        } catch {}
      }
    }

    // 3. WebSocket (if connected to Node server)
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(msg));
      } catch {}
    }
  }

  public destroy() {
    this.isDestroyed = true;
    try {
      this.broadcastChannel?.close();
      this.ws?.close();
      this.connections.forEach((c) => c.close());
      this.hostConnection?.close();
      this.peer?.destroy();
    } catch {}
  }
}
