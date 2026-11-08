import { useState, useEffect } from 'react';
import { GameState, QuestionSet, OptionKey } from '../types';
import { resolveImageUrl } from '../utils/imageHelper';
import { Smartphone, CheckCircle, XCircle, Clock, Check, Users, ZoomIn, X, Lock } from 'lucide-react';

interface StudentViewProps {
  gameState: GameState;
  questionSets: QuestionSet[];
  initialTeamId?: number;
  onSubmitAnswer: (teamId: number, choice: OptionKey) => void;
  onPingTeam: (teamId: number) => void;
  onSwitchToHost: () => void;
}

export function StudentView({
  gameState,
  questionSets,
  initialTeamId = 1,
  onSubmitAnswer,
  onPingTeam,
  onSwitchToHost,
}: StudentViewProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<number>(initialTeamId);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Ping team as online
  useEffect(() => {
    onPingTeam(selectedTeamId);
    const interval = setInterval(() => {
      onPingTeam(selectedTeamId);
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedTeamId, onPingTeam]);

  const currentSet = questionSets.find((s) => s.id === gameState.currentSetId) || questionSets[0];
  const questions = currentSet?.questions || [];
  const currentQ = questions[gameState.currentQuestionIdx] || null;

  const myTeam = gameState.teams[selectedTeamId];
  const myChoice = myTeam?.choice || null;
  const isRevealed = gameState.isRevealed;
  const isCorrect = isRevealed && currentQ && myChoice === currentQ.correct;
  const isWrong = isRevealed && myChoice && currentQ && myChoice !== currentQ.correct;

  const teamColors = {
    1: {
      bg: 'bg-red-500',
      border: 'border-red-500',
      text: 'text-red-400',
      gradient: 'from-red-600 to-rose-700',
    },
    2: {
      bg: 'bg-blue-500',
      border: 'border-blue-500',
      text: 'text-blue-400',
      gradient: 'from-blue-600 to-indigo-700',
    },
    3: {
      bg: 'bg-amber-500',
      border: 'border-amber-500',
      text: 'text-amber-400',
      gradient: 'from-amber-600 to-yellow-700',
    },
    4: {
      bg: 'bg-emerald-500',
      border: 'border-emerald-500',
      text: 'text-emerald-400',
      gradient: 'from-emerald-600 to-teal-700',
    },
  };

  const currentTheme = teamColors[selectedTeamId as 1 | 2 | 3 | 4] || teamColors[1];

  const handleSelectChoice = (choice: OptionKey) => {
    if (isRevealed) return;
    onSubmitAnswer(selectedTeamId, choice);
  };

  const resolvedImageUrl = currentQ?.image ? resolveImageUrl(currentQ.image) : '';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-3.5 max-w-md mx-auto select-none">
      {/* Top Bar: Team selector and Status */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-2xl shadow-lg">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-base shadow ${currentTheme.bg}`}
            >
              N{selectedTeamId}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base text-white">{myTeam?.name}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-amber-400 font-mono font-bold">
                  {myTeam?.score || 0}đ
                </span>
              </div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>GV: {gameState.teacherName}</span>
              </div>
            </div>
          </div>

          {/* Switch team dropdown */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1.5 rounded-xl border border-slate-800">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-cyan-300 focus:outline-none"
            >
              <option value="1">Nhóm 1 (Đỏ)</option>
              <option value="2">Nhóm 2 (Lam)</option>
              <option value="3">Nhóm 3 (Vàng)</option>
              <option value="4">Nhóm 4 (Lục)</option>
            </select>
          </div>
        </div>

        {/* 
          QUESTION CARD ON PHONE (NỀN SÁNG - HIGH CONTRAST)
          Requirement: "hiện trên nền sáng để phân biệt với phần chọn đáp án"
        */}
        <div className="bg-gradient-to-br from-white via-slate-50 to-amber-50/50 border-2 border-amber-300/80 rounded-2xl p-3.5 shadow-xl text-slate-900">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white font-black text-xs shadow-xs">
              CÂU {gameState.currentQuestionIdx + 1} / {questions.length}
            </span>
            <div
              className={`flex items-center gap-1 px-3 py-0.5 rounded-full font-mono font-black text-xs border ${
                gameState.timerSecondsRemaining <= 5 && gameState.isTimerRunning
                  ? 'bg-red-500 text-white border-red-600 animate-pulse'
                  : gameState.isTimerRunning
                  ? 'bg-blue-600 text-white border-blue-700'
                  : 'bg-slate-800 text-slate-200 border-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                {gameState.timerSecondsRemaining > 0
                  ? `${gameState.timerSecondsRemaining}s`
                  : 'HẾT GIỜ'}
              </span>
            </div>
          </div>

          {/* Question title in clear, bold text */}
          <h2 className="text-sm font-black text-slate-950 leading-snug">
            {currentQ?.title || 'Đang chờ câu hỏi từ giáo viên...'}
          </h2>

          {/* 
            QUESTION IMAGE ON PHONE:
            Requirement: "Chữa lỗi không hiển thị hình ảnh trên điện thoại"
          */}
          {resolvedImageUrl && (
            <div className="mt-2.5 flex flex-col items-center">
              <div
                onClick={() => setZoomedImage(resolvedImageUrl)}
                className="relative w-full flex items-center justify-center bg-white p-2 rounded-xl border border-slate-300 shadow-sm cursor-pointer hover:border-blue-400 transition"
              >
                <img
                  src={resolvedImageUrl}
                  alt="Minh họa câu hỏi"
                  className="max-h-40 w-auto object-contain rounded"
                  onError={(e) => {
                    console.error('Image load failed on mobile');
                    (e.target as HTMLImageElement).alt = 'Không thể tải hình ảnh';
                  }}
                />
                <span className="absolute bottom-1 right-1 flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900/80 text-white text-[10px] font-bold">
                  <ZoomIn className="w-3 h-3" /> Chạm để phóng to
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center: Live Status Notification */}
      <div className="my-2.5">
        {isRevealed ? (
          <div
            className={`p-3 rounded-2xl border-2 flex items-center gap-3 text-center justify-center shadow-xl animate-in zoom-in-95 duration-200 ${
              isCorrect
                ? 'bg-emerald-950/70 border-emerald-400 text-emerald-300'
                : isWrong
                ? 'bg-rose-950/70 border-rose-500 text-rose-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            {isCorrect ? (
              <>
                <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <div className="font-black text-sm text-emerald-300">XUẤT SẮC! ĐÁP ÁN ĐÚNG</div>
                  <div className="text-xs text-emerald-400/80">Nhóm bạn được cộng +100 điểm!</div>
                </div>
              </>
            ) : isWrong ? (
              <>
                <XCircle className="w-6 h-6 text-rose-400 shrink-0" />
                <div className="text-left">
                  <div className="font-black text-sm text-rose-300">RẤT TIẾC! ĐÁP ÁN CHƯA ĐÚNG</div>
                  <div className="text-xs text-rose-400/80">Đáp án đúng của câu này là: [{currentQ?.correct}]</div>
                </div>
              </>
            ) : (
              <div className="text-xs font-bold text-slate-400">
                Đã hết thời gian! Đáp án đúng là: [{currentQ?.correct}]
              </div>
            )}
          </div>
        ) : myChoice ? (
          <div className="p-3 bg-emerald-950/70 border border-emerald-500/60 rounded-2xl flex items-center justify-between text-emerald-300 shadow-md animate-in zoom-in-95">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-black text-sm text-white">✓ ĐÃ GỬI ĐÁP ÁN: [{myChoice}]</span>
                <span className="block text-[11px] text-emerald-300 font-mono">
                  Đã chốt lúc {myTeam?.choiceTime || '0.0'}s • Đồng bộ lên màn hình lớn
                </span>
              </div>
            </div>
            <span className="text-[10px] px-2 py-1 rounded-md bg-emerald-900/80 font-bold border border-emerald-500/40 text-emerald-200">
              Đổi được
            </span>
          </div>
        ) : (
          <div className="p-2.5 text-center text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            👉 Chạm vào 1 trong 4 phương án bên dưới để chốt đáp án:
          </div>
        )}
      </div>

      {/* Bottom: 4 Giant Choice Buttons [ A ], [ B ], [ C ], [ D ] */}
      <div className="grid grid-cols-2 gap-3 mb-2">
        {(['A', 'B', 'C', 'D'] as OptionKey[]).map((letter) => {
          const isSelected = myChoice === letter;
          const isCorrectLetter = isRevealed && currentQ?.correct === letter;

          return (
            <button
              key={letter}
              onClick={() => handleSelectChoice(letter)}
              disabled={isRevealed}
              className={`h-24 rounded-2xl font-black text-3xl flex flex-col items-center justify-center transition-all duration-150 border-3 shadow-xl active:scale-95 disabled:active:scale-100 ${
                isRevealed && isCorrectLetter
                  ? 'bg-emerald-500 text-slate-950 border-white ring-4 ring-emerald-400/50 scale-[1.02]'
                  : isSelected
                  ? `${currentTheme.bg} text-white border-white ring-4 ring-cyan-400/50 shadow-2xl scale-[1.02]`
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700/80'
              }`}
            >
              <span>{letter}</span>
              <span className="text-[11px] font-sans font-bold opacity-80 max-w-[130px] truncate px-1">
                {currentQ?.options[letter] || ''}
              </span>
            </button>
          );
        })}
      </div>

      {/* Switch to Teacher Screen Link */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs text-slate-500">
        <button
          onClick={onSwitchToHost}
          className="hover:text-cyan-400 transition underline underline-offset-4"
        >
          💻 Chuyển sang Màn hình Giáo viên
        </button>
        <span className="flex items-center gap-1">
          <Smartphone className="w-3.5 h-3.5" />
          <span>Tay cầm Nhóm {selectedTeamId}</span>
        </span>
      </div>

      {/* LIGHTBOX MODAL FOR MOBILE IMAGE ZOOM */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-md cursor-pointer"
        >
          <div className="relative max-w-full max-h-[85vh] p-3 bg-white rounded-2xl shadow-2xl">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-3 -right-3 p-1.5 rounded-full bg-slate-900 text-white hover:bg-rose-600 transition shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={zoomedImage} alt="Hình phóng to" className="max-h-[75vh] w-auto object-contain rounded-lg" />
          </div>
        </div>
      )}
    </div>
  );
}
