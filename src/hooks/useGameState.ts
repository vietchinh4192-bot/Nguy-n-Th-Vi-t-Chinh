import { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, QuestionSet, Question, OptionKey } from '../types';
import { DEFAULT_QUESTION_SETS } from '../data/defaultQuestions';
import { INITIAL_GAME_STATE } from '../data/defaultState';
import { SoundEngine } from '../utils/sound';
import { SyncManager, SyncMessage } from '../utils/syncManager';
import confetti from 'canvas-confetti';

const STORAGE_KEY_SETS = 'OLYMPIA_QUESTION_SETS_V2';
const STORAGE_KEY_STATE = 'OLYMPIA_SAVED_STATE_V2';

export function useGameState(role: 'teacher' | 'student' = 'teacher', roomId: string = '10A6') {
  // Load persisted sets if available
  const [questionSets, setQuestionSets] = useState<QuestionSet[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY_SETS);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch {}
    return DEFAULT_QUESTION_SETS;
  });

  // Always initialize with valid GameState so Netlify/static hosting never hangs!
  const [gameState, setGameState] = useState<GameState>(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(STORAGE_KEY_STATE);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.teams) {
            // Reset running timer on page load
            return {
              ...parsed,
              isTimerRunning: false,
              timerStartTime: null,
            };
          }
        }
      }
    } catch {}
    return INITIAL_GAME_STATE;
  });

  const [isConnected, setIsConnected] = useState(false);
  const syncManagerRef = useRef<SyncManager | null>(null);
  const prevSecondsRef = useRef<number | null>(null);
  const prevRevealedRef = useRef<boolean>(false);
  const prevLockedTeamsRef = useRef<Record<number, boolean>>({});
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger sound & confetti based on state transitions
  const handleStateSideEffects = useCallback(
    (newState: GameState, sets: QuestionSet[]) => {
      // 1. Clock sound during countdown
      if (newState.isTimerRunning) {
        if (prevSecondsRef.current !== newState.timerSecondsRemaining) {
          if (newState.timerSecondsRemaining > 5) {
            SoundEngine.playTick(newState.timerSecondsRemaining % 2 === 0);
          } else if (newState.timerSecondsRemaining > 0) {
            SoundEngine.playWarningTick(newState.timerSecondsRemaining);
          }
        }
      }
      prevSecondsRef.current = newState.timerSecondsRemaining;

      // 2. Sound when a team locks in their answer
      for (const teamId of [1, 2, 3, 4]) {
        const isLockedNow = !!newState.teams[teamId]?.isLocked;
        const wasLocked = !!prevLockedTeamsRef.current[teamId];
        if (isLockedNow && !wasLocked && !newState.isRevealed) {
          SoundEngine.playLockIn();
        }
        prevLockedTeamsRef.current[teamId] = isLockedNow;
      }

      // 3. Sound & Confetti when answers are revealed
      if (newState.isRevealed && !prevRevealedRef.current) {
        SoundEngine.playTimesUp();

        // Check if any team got it right
        const currentSet = sets.find((s) => s.id === newState.currentSetId) || sets[0];
        const currentQ = currentSet?.questions[newState.currentQuestionIdx];
        let anyCorrect = false;

        if (currentQ) {
          for (const teamId of [1, 2, 3, 4]) {
            if (newState.teams[teamId]?.choice === currentQ.correct) {
              anyCorrect = true;
              break;
            }
          }
        }

        setTimeout(() => {
          if (anyCorrect) {
            SoundEngine.playCorrect();
            try {
              confetti({
                particleCount: 110,
                spread: 75,
                origin: { y: 0.6 },
                colors: ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#fbbf24'],
              });
            } catch {}
          } else {
            SoundEngine.playWrong();
          }
        }, 400);
      }
      prevRevealedRef.current = newState.isRevealed;
    },
    []
  );

  // Sync Manager Message Handler
  const handleIncomingMessage = useCallback(
    (msg: SyncMessage) => {
      if (msg.type === 'STATE_UPDATE') {
        if (msg.state) {
          setGameState(msg.state);
          handleStateSideEffects(msg.state, msg.questionSets || questionSets);
        }
        if (msg.questionSets) {
          setQuestionSets(msg.questionSets);
        }
      } else if (msg.type === 'SUBMIT_ANSWER') {
        // Teacher receives student answer submission via WebRTC / BroadcastChannel
        setGameState((prev) => {
          if (prev.isRevealed) return prev;
          const team = prev.teams[msg.teamId];
          if (!team) return prev;

          let elapsed = msg.choiceTime || 0;
          if (!elapsed) {
            if (prev.isTimerRunning && prev.timerStartTime) {
              elapsed = Math.round(((Date.now() - prev.timerStartTime) / 1000) * 10) / 10;
            } else {
              elapsed = Math.round((prev.timerDuration - prev.timerSecondsRemaining) * 10) / 10;
            }
          }

          const updatedState: GameState = {
            ...prev,
            teams: {
              ...prev.teams,
              [msg.teamId]: {
                ...team,
                choice: msg.choice,
                choiceTime: Math.max(0.1, elapsed),
                isLocked: true,
                isConnected: true,
                lastActive: Date.now(),
              },
            },
          };

          // Broadcast updated state to all peers
          syncManagerRef.current?.broadcast({
            type: 'STATE_UPDATE',
            state: updatedState,
            questionSets,
          });

          return updatedState;
        });
      } else if (msg.type === 'PING') {
        setGameState((prev) => {
          const team = prev.teams[msg.teamId];
          if (!team) return prev;
          return {
            ...prev,
            teams: {
              ...prev.teams,
              [msg.teamId]: {
                ...team,
                isConnected: true,
                lastActive: Date.now(),
              },
            },
          };
        });
      }
    },
    [handleStateSideEffects, questionSets]
  );

  // Setup SyncManager
  useEffect(() => {
    const isHost = role === 'teacher';
    const sm = new SyncManager(
      isHost,
      roomId,
      handleIncomingMessage,
      (connected) => setIsConnected(connected)
    );
    syncManagerRef.current = sm;

    return () => {
      sm.destroy();
      syncManagerRef.current = null;
    };
  }, [role, roomId, handleIncomingMessage, handleStateSideEffects]);

  // Continuous multi-device polling sync with server (Cloud Run, Localhost, VPS)
  useEffect(() => {
    let isCancelled = false;
    let pollInterval: NodeJS.Timeout | null = null;

    const pollServerState = async () => {
      try {
        const res = await fetch('/api/state');
        if (!res.ok) return;
        const data = await res.json();
        if (isCancelled || !data || !data.state) return;

        setGameState((prev) => {
          const serverState: GameState = data.state;
          let hasDiff = false;

          // Student role strictly follows teacher / server state
          if (role === 'student') {
            const hasStudentDiff =
              prev.currentQuestionIdx !== serverState.currentQuestionIdx ||
              prev.currentSetId !== serverState.currentSetId ||
              prev.isRevealed !== serverState.isRevealed ||
              prev.isTimerRunning !== serverState.isTimerRunning ||
              Math.abs(prev.timerSecondsRemaining - serverState.timerSecondsRemaining) > 1 ||
              [1, 2, 3, 4].some((tId) => {
                return (
                  prev.teams[tId]?.choice !== serverState.teams[tId]?.choice ||
                  prev.teams[tId]?.score !== serverState.teams[tId]?.score ||
                  prev.teams[tId]?.isLocked !== serverState.teams[tId]?.isLocked
                );
              });

            if (hasStudentDiff) {
              handleStateSideEffects(serverState, data.questionSets || questionSets);
              return serverState;
            }
            return prev;
          }

          // Teacher role: merge student submissions from server
          const mergedTeams = { ...prev.teams };
          for (const tId of [1, 2, 3, 4]) {
            const curTeam = prev.teams[tId];
            const srvTeam = serverState.teams[tId];
            if (srvTeam) {
              if (
                srvTeam.isLocked !== curTeam?.isLocked ||
                srvTeam.choice !== curTeam?.choice ||
                srvTeam.isConnected !== curTeam?.isConnected
              ) {
                mergedTeams[tId] = {
                  ...curTeam,
                  choice: srvTeam.choice,
                  choiceTime: srvTeam.choiceTime,
                  isLocked: srvTeam.isLocked,
                  isConnected: srvTeam.isConnected,
                  lastActive: Math.max(curTeam?.lastActive || 0, srvTeam.lastActive || 0),
                };
                hasDiff = true;
              }
            }
          }

          if (hasDiff) {
            const mergedState: GameState = {
              ...prev,
              teams: mergedTeams,
            };
            handleStateSideEffects(mergedState, data.questionSets || questionSets);
            return mergedState;
          }

          return prev;
        });

        if (data.questionSets && Array.isArray(data.questionSets) && data.questionSets.length > 0) {
          if (role === 'student') {
            setQuestionSets(data.questionSets);
          }
        }
      } catch {
        // Ignored on static hosts
      }
    };

    pollServerState();
    // 600ms polling guarantees near real-time sync across mobile 4G / Wi-Fi
    pollInterval = setInterval(pollServerState, 600);

    return () => {
      isCancelled = true;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [role, handleStateSideEffects, questionSets]);

  // Persist state & sets to localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_SETS, JSON.stringify(questionSets));
      }
    } catch {}
  }, [questionSets]);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY_STATE, JSON.stringify(gameState));
      }
    } catch {}
  }, [gameState]);

  // Broadcast helper
  const broadcastCurrentState = useCallback(
    (newState: GameState, sets = questionSets) => {
      setGameState(newState);
      handleStateSideEffects(newState, sets);
      syncManagerRef.current?.broadcast({
        type: 'STATE_UPDATE',
        state: newState,
        questionSets: sets,
      });

      // Synchronize with server if available
      fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: newState, questionSets: sets }),
      }).catch(() => {});
    },
    [handleStateSideEffects, questionSets]
  );

  // Stop local client timer
  const stopClientTimer = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Reveal answers automatically (Teacher side)
  const revealAnswers = useCallback(() => {
    if (role === 'student') return;
    stopClientTimer();
    setGameState((prev) => {
      const curSet = questionSets.find((s) => s.id === prev.currentSetId) || questionSets[0];
      const curQ = curSet?.questions[prev.currentQuestionIdx];

      const newTeams = { ...prev.teams };
      if (curQ) {
        for (const tId of [1, 2, 3, 4]) {
          const team = newTeams[tId];
          if (team && team.choice === curQ.correct) {
            newTeams[tId] = {
              ...team,
              score: team.score + 100,
            };
          }
        }
      }

      const updatedState: GameState = {
        ...prev,
        isTimerRunning: false,
        timerSecondsRemaining: 0,
        isRevealed: true,
        teams: newTeams,
      };

      handleStateSideEffects(updatedState, questionSets);

      // Broadcast
      syncManagerRef.current?.broadcast({
        type: 'STATE_UPDATE',
        state: updatedState,
        questionSets,
      });

      // Also notify backend if present
      fetch('/api/teacher/reveal', { method: 'POST' }).catch(() => {});

      return updatedState;
    });
  }, [stopClientTimer, questionSets, handleStateSideEffects, role]);

  // Start timer (Teacher side)
  const startTimer = useCallback(
    (duration?: number) => {
      if (role === 'student') return;
      SoundEngine.init();
      stopClientTimer();

      const curSet = questionSets.find((s) => s.id === gameState.currentSetId) || questionSets[0];
      const curQ = curSet?.questions[gameState.currentQuestionIdx];
      const dur = duration || curQ?.duration || gameState.timerDuration || 30;

      const updatedState: GameState = {
        ...gameState,
        timerDuration: dur,
        timerSecondsRemaining: dur,
        isTimerRunning: true,
        timerStartTime: Date.now(),
        isRevealed: false,
      };

      broadcastCurrentState(updatedState);

      // Client-side timer interval (works in Netlify without server!)
      timerIntervalRef.current = setInterval(() => {
        setGameState((prev) => {
          if (!prev.isTimerRunning) return prev;
          const nextSec = prev.timerSecondsRemaining - 1;

          if (nextSec <= 0) {
            // AUTOMATIC REVEAL ON TIME UP!
            clearInterval(timerIntervalRef.current!);
            timerIntervalRef.current = null;
            setTimeout(() => {
              revealAnswers();
            }, 100);
            return {
              ...prev,
              timerSecondsRemaining: 0,
            };
          }

          const tickState = {
            ...prev,
            timerSecondsRemaining: nextSec,
          };
          handleStateSideEffects(tickState, questionSets);

          syncManagerRef.current?.broadcast({
            type: 'STATE_UPDATE',
            state: tickState,
            questionSets,
          });

          return tickState;
        });
      }, 1000);

      // Send to server if running
      fetch('/api/teacher/start-timer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration: dur }),
      }).catch(() => {});
    },
    [broadcastCurrentState, gameState, handleStateSideEffects, questionSets, revealAnswers, stopClientTimer, role]
  );

  // Pause timer
  const pauseTimer = useCallback(() => {
    if (role === 'student') return;
    stopClientTimer();
    const updatedState: GameState = {
      ...gameState,
      isTimerRunning: false,
    };
    broadcastCurrentState(updatedState);
    fetch('/api/teacher/pause-timer', { method: 'POST' }).catch(() => {});
  }, [broadcastCurrentState, gameState, stopClientTimer, role]);

  // Reset current question
  const resetQuestion = useCallback(() => {
    if (role === 'student') return;
    stopClientTimer();
    SoundEngine.playPop();

    const curSet = questionSets.find((s) => s.id === gameState.currentSetId) || questionSets[0];
    const curQ = curSet?.questions[gameState.currentQuestionIdx];
    const dur = curQ?.duration || 30;

    const clearedTeams = { ...gameState.teams };
    for (const tId of [1, 2, 3, 4]) {
      if (clearedTeams[tId]) {
        clearedTeams[tId] = {
          ...clearedTeams[tId],
          choice: null,
          choiceTime: null,
          isLocked: false,
        };
      }
    }

    const updatedState: GameState = {
      ...gameState,
      timerDuration: dur,
      timerSecondsRemaining: dur,
      isTimerRunning: false,
      timerStartTime: null,
      isRevealed: false,
      teams: clearedTeams,
    };

    broadcastCurrentState(updatedState);
    fetch('/api/teacher/reset-question', { method: 'POST' }).catch(() => {});
  }, [broadcastCurrentState, gameState, questionSets, stopClientTimer]);

  // Next question
  const nextQuestion = useCallback(() => {
    if (role === 'student') return;
    const curSet = questionSets.find((s) => s.id === gameState.currentSetId) || questionSets[0];
    if (gameState.currentQuestionIdx < curSet.questions.length - 1) {
      stopClientTimer();
      SoundEngine.playPop();
      const nextIdx = gameState.currentQuestionIdx + 1;
      const nextQ = curSet.questions[nextIdx];
      const dur = nextQ?.duration || 30;

      const clearedTeams = { ...gameState.teams };
      for (const tId of [1, 2, 3, 4]) {
        if (clearedTeams[tId]) {
          clearedTeams[tId] = {
            ...clearedTeams[tId],
            choice: null,
            choiceTime: null,
            isLocked: false,
          };
        }
      }

      const updatedState: GameState = {
        ...gameState,
        currentQuestionIdx: nextIdx,
        timerDuration: dur,
        timerSecondsRemaining: dur,
        isTimerRunning: false,
        timerStartTime: null,
        isRevealed: false,
        teams: clearedTeams,
      };

      broadcastCurrentState(updatedState);
      fetch('/api/teacher/next-question', { method: 'POST' }).catch(() => {});
    }
  }, [broadcastCurrentState, gameState, questionSets, stopClientTimer, role]);

  // Prev question
  const prevQuestion = useCallback(() => {
    if (role === 'student') return;
    if (gameState.currentQuestionIdx > 0) {
      stopClientTimer();
      SoundEngine.playPop();
      const prevIdx = gameState.currentQuestionIdx - 1;
      const curSet = questionSets.find((s) => s.id === gameState.currentSetId) || questionSets[0];
      const prevQ = curSet.questions[prevIdx];
      const dur = prevQ?.duration || 30;

      const clearedTeams = { ...gameState.teams };
      for (const tId of [1, 2, 3, 4]) {
        if (clearedTeams[tId]) {
          clearedTeams[tId] = {
            ...clearedTeams[tId],
            choice: null,
            choiceTime: null,
            isLocked: false,
          };
        }
      }

      const updatedState: GameState = {
        ...gameState,
        currentQuestionIdx: prevIdx,
        timerDuration: dur,
        timerSecondsRemaining: dur,
        isTimerRunning: false,
        timerStartTime: null,
        isRevealed: false,
        teams: clearedTeams,
      };

      broadcastCurrentState(updatedState);
      fetch('/api/teacher/prev-question', { method: 'POST' }).catch(() => {});
    }
  }, [broadcastCurrentState, gameState, questionSets, stopClientTimer, role]);

  // Submit answer (from student or manual override)
  const submitAnswer = useCallback(
    (teamId: number, choice: OptionKey) => {
      SoundEngine.playPop();

      let elapsed = 0;
      if (gameState.isTimerRunning && gameState.timerStartTime) {
        elapsed = Math.round(((Date.now() - gameState.timerStartTime) / 1000) * 10) / 10;
      } else {
        elapsed = Math.round((gameState.timerDuration - gameState.timerSecondsRemaining) * 10) / 10;
      }

      const team = gameState.teams[teamId];
      if (!team) return;

      const updatedState: GameState = {
        ...gameState,
        teams: {
          ...gameState.teams,
          [teamId]: {
            ...team,
            choice,
            choiceTime: Math.max(0.1, elapsed),
            isLocked: true,
            isConnected: true,
            lastActive: Date.now(),
          },
        },
      };

      if (role === 'student') {
        // Optimistic local update so student sees instant feedback
        setGameState(updatedState);

        // Notify teacher host via WebRTC / BroadcastChannel
        syncManagerRef.current?.broadcast({
          type: 'SUBMIT_ANSWER',
          teamId,
          choice,
          choiceTime: Math.max(0.1, elapsed || 1.0),
        });

        // Submit to server via REST HTTP
        fetch('/api/team/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teamId,
            choice,
            choiceTime: Math.max(0.1, elapsed || 1.0),
          }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data && data.state) {
              setGameState(data.state);
            }
          })
          .catch(() => {});
      } else {
        // Teacher manual lock-in or override
        broadcastCurrentState(updatedState);

        fetch('/api/team/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teamId,
            choice,
            choiceTime: Math.max(0.1, elapsed || 1.0),
          }),
        }).catch(() => {});
      }
    },
    [broadcastCurrentState, gameState, role]
  );

  // Update team score
  const updateTeamScore = useCallback(
    (teamId: number, delta: number) => {
      SoundEngine.playPop();
      const team = gameState.teams[teamId];
      if (!team) return;

      const updatedState: GameState = {
        ...gameState,
        teams: {
          ...gameState.teams,
          [teamId]: {
            ...team,
            score: Math.max(0, team.score + delta),
          },
        },
      };

      broadcastCurrentState(updatedState);
      fetch('/api/teacher/update-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId, delta }),
      }).catch(() => {});
    },
    [broadcastCurrentState, gameState]
  );

  // Reset all scores
  const resetAllScores = useCallback(() => {
    const clearedTeams = { ...gameState.teams };
    for (const tId of [1, 2, 3, 4]) {
      if (clearedTeams[tId]) {
        clearedTeams[tId] = {
          ...clearedTeams[tId],
          score: 0,
        };
      }
    }
    const updatedState: GameState = {
      ...gameState,
      teams: clearedTeams,
    };
    broadcastCurrentState(updatedState);
    fetch('/api/teacher/reset-scores', { method: 'POST' }).catch(() => {});
  }, [broadcastCurrentState, gameState]);

  // Set current question set
  const setCurrentSet = useCallback(
    (setId: string) => {
      const targetSet = questionSets.find((s) => s.id === setId);
      if (targetSet) {
        stopClientTimer();
        const dur = targetSet.questions[0]?.duration || 30;

        const clearedTeams = { ...gameState.teams };
        for (const tId of [1, 2, 3, 4]) {
          if (clearedTeams[tId]) {
            clearedTeams[tId] = {
              ...clearedTeams[tId],
              choice: null,
              choiceTime: null,
              isLocked: false,
            };
          }
        }

        const updatedState: GameState = {
          ...gameState,
          currentSetId: setId,
          currentQuestionIdx: 0,
          timerDuration: dur,
          timerSecondsRemaining: dur,
          isTimerRunning: false,
          timerStartTime: null,
          isRevealed: false,
          teams: clearedTeams,
        };

        broadcastCurrentState(updatedState);
        fetch('/api/teacher/set-set-id', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ setId }),
        }).catch(() => {});
      }
    },
    [broadcastCurrentState, gameState, questionSets, stopClientTimer]
  );

  // Save edited question
  const saveQuestion = useCallback(
    (question: Question) => {
      const newSets = questionSets.map((s) => {
        if (s.id === gameState.currentSetId) {
          const newQuestions = s.questions.map((q) => (q.id === question.id ? question : q));
          return { ...s, questions: newQuestions };
        }
        return s;
      });

      setQuestionSets(newSets);

      const updatedState: GameState = {
        ...gameState,
        timerDuration: question.duration || gameState.timerDuration,
        timerSecondsRemaining: question.duration || gameState.timerSecondsRemaining,
      };

      broadcastCurrentState(updatedState, newSets);

      fetch('/api/teacher/save-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      }).catch(() => {});
    },
    [broadcastCurrentState, gameState, questionSets]
  );

  // Import question set
  const importSet = useCallback(
    async (title: string, questions: Question[]) => {
      const newId = 'set-' + Date.now();
      const newSet: QuestionSet = {
        id: newId,
        title,
        questions,
      };

      const newSets = [...questionSets, newSet];
      setQuestionSets(newSets);

      const dur = questions[0]?.duration || 30;
      const clearedTeams = { ...gameState.teams };
      for (const tId of [1, 2, 3, 4]) {
        if (clearedTeams[tId]) {
          clearedTeams[tId] = {
            ...clearedTeams[tId],
            choice: null,
            choiceTime: null,
            isLocked: false,
          };
        }
      }

      const updatedState: GameState = {
        ...gameState,
        currentSetId: newId,
        currentQuestionIdx: 0,
        timerDuration: dur,
        timerSecondsRemaining: dur,
        isTimerRunning: false,
        timerStartTime: null,
        isRevealed: false,
        teams: clearedTeams,
      };

      broadcastCurrentState(updatedState, newSets);

      fetch('/api/teacher/import-set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ set: { title, questions } }),
      }).catch(() => {});

      return { success: true, setId: newId };
    },
    [broadcastCurrentState, gameState, questionSets]
  );

  // Ping team presence
  const pingTeam = useCallback(
    (teamId: number) => {
      syncManagerRef.current?.broadcast({ type: 'PING', teamId });
      fetch('/api/team/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId }),
      }).catch(() => {});
    },
    []
  );

  return {
    gameState,
    questionSets,
    isConnected,
    submitAnswer,
    startTimer,
    pauseTimer,
    revealAnswers,
    nextQuestion,
    prevQuestion,
    resetQuestion,
    resetAllScores,
    updateTeamScore,
    setCurrentSet,
    saveQuestion,
    importSet,
    pingTeam,
  };
}
