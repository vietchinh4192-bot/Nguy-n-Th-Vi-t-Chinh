import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { X, Copy, ExternalLink, QrCode, Smartphone } from 'lucide-react';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QRModal({ isOpen, onClose }: QRModalProps) {
  const [selectedTab, setSelectedTab] = useState<'all' | 1 | 2 | 3 | 4>('all');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const getTargetUrl = () => {
    const origin = window.location.origin;
    if (selectedTab === 'all') {
      return `${origin}/?role=student`;
    }
    return `${origin}/?role=student&team=${selectedTab}`;
  };

  const targetUrl = getTargetUrl();

  useEffect(() => {
    if (!isOpen) return;
    QRCode.toDataURL(targetUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR:', err));
  }, [isOpen, targetUrl]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenTab = () => {
    window.open(targetUrl, '_blank');
  };

  const teamColors = {
    1: 'from-red-500 to-rose-600 border-red-500 text-red-400',
    2: 'from-blue-500 to-indigo-600 border-blue-500 text-blue-400',
    3: 'from-amber-500 to-yellow-600 border-amber-500 text-amber-400',
    4: 'from-emerald-500 to-teal-600 border-emerald-500 text-emerald-400',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-lg p-6 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col gap-5 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-cyan-300">Mã QR Kết Nối 4 Nhóm</h3>
              <p className="text-xs text-slate-400">Học sinh dùng điện thoại (Camera / Zalo) quét mã để trả lời</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="grid grid-cols-5 gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setSelectedTab('all')}
            className={`py-2 px-1 rounded-lg transition text-center ${
              selectedTab === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Quét chung
          </button>
          <button
            onClick={() => setSelectedTab(1)}
            className={`py-2 px-1 rounded-lg transition text-center ${
              selectedTab === 1
                ? 'bg-red-500 text-white shadow-md shadow-red-500/30'
                : 'text-slate-400 hover:text-red-400 hover:bg-slate-800/60'
            }`}
          >
            Nhóm 1 (Đỏ)
          </button>
          <button
            onClick={() => setSelectedTab(2)}
            className={`py-2 px-1 rounded-lg transition text-center ${
              selectedTab === 2
                ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                : 'text-slate-400 hover:text-blue-400 hover:bg-slate-800/60'
            }`}
          >
            Nhóm 2 (Lam)
          </button>
          <button
            onClick={() => setSelectedTab(3)}
            className={`py-2 px-1 rounded-lg transition text-center ${
              selectedTab === 3
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-amber-400 hover:bg-slate-800/60'
            }`}
          >
            Nhóm 3 (Vàng)
          </button>
          <button
            onClick={() => setSelectedTab(4)}
            className={`py-2 px-1 rounded-lg transition text-center ${
              selectedTab === 4
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                : 'text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60'
            }`}
          >
            Nhóm 4 (Lục)
          </button>
        </div>

        {/* QR Display Card */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-950/90 rounded-2xl border border-slate-800 gap-4">
          <div className="text-center">
            {selectedTab === 'all' ? (
              <span className="inline-block px-3 py-1 text-xs font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/40 rounded-full">
                MÃ CHUNG • Học sinh quét mã rồi chọn Nhóm 1, 2, 3 hoặc 4
              </span>
            ) : (
              <span
                className={`inline-block px-3 py-1 text-xs font-bold rounded-full border ${teamColors[selectedTab]}`}
              >
                MÃ DÀNH RIÊNG CHO NHÓM {selectedTab} (Vào thẳng nhóm)
              </span>
            )}
          </div>

          <div className="p-3 bg-white rounded-xl shadow-xl border-4 border-slate-200">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="Mã QR kết nối" className="w-56 h-56 object-contain" />
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-slate-500 text-sm">
                Đang tạo mã QR...
              </div>
            )}
          </div>

          <div className="w-full flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono overflow-hidden">
            <span className="truncate flex-1">{targetUrl}</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-sans font-bold bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg transition shrink-0"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Đã chép!' : 'Sao chép'}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={handleOpenTab}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl transition shadow-lg shadow-cyan-600/30"
          >
            <Smartphone className="w-4 h-4" />
            Mở tab làm bài thử nghiệm
            <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
