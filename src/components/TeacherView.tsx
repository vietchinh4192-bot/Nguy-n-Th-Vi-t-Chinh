import { useState, useEffect } from 'react';
import {
  Flame,
  GraduationCap,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  QrCode,
  Trophy,
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Edit,
  PlusCircle,
  HelpCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Lock,
  ZoomIn,
  X,
} from 'lucide-react';
import { GameState, QuestionSet, OptionKey, Question } from '../types';
import { SoundEngine } from '../utils/sound';
import { resolveImageUrl } from '../utils/imageHelper';
import { QRModal } from './QRModal';
import { ScoreboardModal } from './ScoreboardModal';
import { EditQuestionModal } from './EditQuestionModal';
import { ImportSetModal } from './ImportSetModal';

interface TeacherViewProps {
  gameState: GameState;
  questionSets: QuestionSet[];
  onStartTimer: (duration?: number) => void;
  onPauseTimer: () => void;
  onRevealAnswers: () => void;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
  onResetQuestion: () => void;
  onResetAllScores: () => void;
  onUpdateScore: (teamId: number, delta: number) => void;
  onSetCurrentSet: (setId: string) => void;
  onSaveQuestion: (question: Question) => void;
  onImportSet: (title: string, questions: Question[]) => Promise<{ error?: string; success?: boolean }>;
  onSubmitAnswerForTeam: (teamId: number, choice: OptionKey) => void;
  onOpenStudentTab: () => void;
}

export function TeacherView({
  gameState,
  questionSets,
  onStartTimer,
  onPauseTimer,
  onRevealAnswers,
  onNextQuestion,
  onPrevQuestion,
  onResetQuestion,
  onResetAllScores,
  onUpdateScore,
  onSetCurrentSet,
  onSaveQuestion,
  onImportSet,
  onSubmitAnswerForTeam,
  onOpenStudentTab,
}: TeacherViewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [customTimeInput, setCustomTimeInput] = useState<string>('30');
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Fullscreen listener
  useEffect(() => {
    const handleFSChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFSChange);
    return () => document.removeEventListener('fullscreenchange', handleFSChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  };

  const toggleSound = () => {
    const next = SoundEngine.toggle();
    setSoundEnabled(next);
  };

  // Current question data
  const currentSet = questionSets.find((s) => s.id === gameState.currentSetId) || questionSets[0];
  const questions = currentSet?.questions || [];
  const currentQ = questions[gameState.currentQuestionIdx] || null;

  // Sync explanation auto-show when revealed
  useEffect(() => {
    if (gameState.isRevealed) {
      setShowExplanation(true);
    }
  }, [gameState.isRevealed]);

  // Keyboard shortcuts: Space = Reveal, ArrowRight = Next, ArrowLeft = Prev, F = Fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.code === 'Space') {
        e.preventDefault();
        if (!gameState.isRevealed) {
          onRevealAnswers();
        }
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onNextQuestion();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onPrevQuestion();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.isRevealed, onNextQuestion, onPrevQuestion, onRevealAnswers]);

  const teamColors = {
    1: {
      name: 'Nhóm 1',
      border: 'border-red-500/70',
      glow: 'shadow-red-500/20',
      badgeBg: 'bg-red-500',
      text: 'text-red-400',
      activeBg: 'bg-red-950/40',
      pill: 'bg-red-500 text-white border-red-400',
    },
    2: {
      name: 'Nhóm 2',
      border: 'border-blue-500/70',
      glow: 'shadow-blue-500/20',
      badgeBg: 'bg-blue-500',
      text: 'text-blue-400',
      activeBg: 'bg-blue-950/40',
      pill: 'bg-blue-500 text-white border-blue-400',
    },
    3: {
      name: 'Nhóm 3',
      border: 'border-amber-500/70',
      glow: 'shadow-amber-500/20',
      badgeBg: 'bg-amber-500',
      text: 'text-amber-400',
      activeBg: 'bg-amber-950/40',
      pill: 'bg-amber-500 text-slate-950 border-amber-400',
    },
    4: {
      name: 'Nhóm 4',
      border: 'border-emerald-500/70',
      glow: 'shadow-emerald-500/20',
      badgeBg: 'bg-emerald-500',
      text: 'text-emerald-400',
      activeBg: 'bg-emerald-950/40',
      pill: 'bg-emerald-500 text-white border-emerald-400',
    },
  };

  // Find teams that picked a specific letter
  const getTeamsForLetter = (letter: OptionKey) => {
    return [1, 2, 3, 4].filter((tId) => gameState.teams[tId]?.choice === letter);
  };

  const resolvedImageUrl = currentQ?.image ? resolveImageUrl(currentQ.image) : '';

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col bg-slate-950 text-slate-100 select-none">
      {/* 1. TOP HEADER */}
      <header className="h-14 px-4 bg-slate-900/95 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between shrink-0 z-30">
        {/* Left: Branding & Teacher Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Flame className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-wider uppercase bg-gradient-to-r from-cyan-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
                Đấu Trường Tri Thức
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wide">
                ĐƯỜNG LÊN ĐỈNH OLYMPIA • 4 NHÓM THI ĐẤU
              </p>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Teacher Badge (Requirement 2: Nguyễn Thị Việt Chinh) */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold shadow-sm">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Giáo viên: {gameState.teacherName}</span>
          </div>
        </div>

        {/* Right: Controls & Navigation */}
        <div className="flex items-center gap-2">
          {/* Question Set Selector */}
          <div className="hidden md:flex items-center gap-1.5">
            <select
              value={gameState.currentSetId}
              onChange={(e) => onSetCurrentSet(e.target.value)}
              className="py-1 px-2.5 bg-slate-800/90 border border-slate-700 rounded-lg text-cyan-300 text-xs font-bold focus:outline-none focus:border-cyan-500 max-w-[200px] truncate"
            >
              {questionSets.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.questions.length} câu)
                </option>
              ))}
            </select>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="p-1 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800 transition"
              title="Nạp bộ đề mới từ Word/Text"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>

          {/* QR Code Button */}
          <button
            onClick={() => setIsQRModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 text-xs font-bold transition shadow-sm hover:shadow-cyan-500/20"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Mã QR 4 Nhóm</span>
          </button>

          {/* Scoreboard Button */}
          <button
            onClick={() => setIsScoreModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold transition"
            title="Xem Sổ Điểm 4 Nhóm"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sổ điểm</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className={`p-1.5 rounded-lg border transition ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-cyan-400'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-sm shadow-purple-600/30"
            title="Trình chiếu toàn màn hình (Phím tắt: F)"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isFullscreen ? 'Thu nhỏ' : 'Trình chiếu'}</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN PRESENTATION AREA (Centered, 1-screen fit without scrolling) */}
      <main className="flex-1 flex flex-col justify-between p-3 gap-2 overflow-hidden max-w-[1550px] w-full mx-auto">
        {/* UPPER SECTION: QUESTION CARD (NỀN SÁNG - HIGH CONTRAST) */}
        <div className="bg-gradient-to-br from-white via-slate-50 to-amber-50/40 border-2 border-amber-300/80 rounded-2xl p-3.5 md:p-4 shadow-xl shadow-cyan-950/20 flex flex-col shrink-0 text-slate-900">
          {/* Question Subheader: Set badge, Index pill, Edit button & Timer */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-blue-600 text-white font-black text-xs shadow-sm">
                CÂU HỎI {gameState.currentQuestionIdx + 1} / {questions.length || 1}
              </span>
              <span className="text-xs font-bold text-slate-600 px-2 py-0.5 rounded-md bg-slate-200/80">
                {currentSet?.title || 'Bộ câu hỏi'}
              </span>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-slate-700 hover:text-blue-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition shadow-2xs"
                title="Chỉnh sửa câu hỏi & các phương án A, B, C, D"
              >
                <Edit className="w-3 h-3 text-blue-600" />
                <span>Sửa câu</span>
              </button>
            </div>

            {/* OLYMPIA TIMER PILL */}
            <div className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full font-black text-lg font-mono transition-all duration-300 border shadow-sm ${
                  gameState.timerSecondsRemaining <= 5 && gameState.isTimerRunning
                    ? 'bg-red-500 text-white border-red-600 animate-pulse scale-105 shadow-md shadow-red-500/40'
                    : gameState.isTimerRunning
                    ? 'bg-blue-600 text-white border-blue-700 shadow-md shadow-blue-500/20'
                    : gameState.timerSecondsRemaining === 0
                    ? 'bg-rose-900 text-rose-100 border-rose-950'
                    : 'bg-slate-800 text-slate-100 border-slate-900'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>
                  {gameState.timerSecondsRemaining > 0
                    ? `${gameState.timerSecondsRemaining}s`
                    : '0s (HẾT GIỜ)'}
                </span>
              </div>
            </div>
          </div>

          {/* Question Title & Content - Sharp, High-Contrast Typography on Light Background */}
          <div className="py-2.5 flex items-center justify-between gap-4">
            <h2 className="text-base md:text-lg lg:text-xl font-extrabold text-slate-950 leading-relaxed tracking-tight flex-1">
              {currentQ?.title || 'Chưa có câu hỏi nào.'}
            </h2>

            {/* If question has image/diagram: clean high-contrast preview */}
            {resolvedImageUrl && (
              <div className="relative group shrink-0">
                <div
                  onClick={() => setZoomedImage(resolvedImageUrl)}
                  className="flex items-center justify-center p-1.5 bg-white rounded-xl border-2 border-slate-300 shadow-md hover:border-blue-500 cursor-pointer transition max-h-[130px] max-w-[280px]"
                >
                  <img
                    src={resolvedImageUrl}
                    alt="Hình minh họa"
                    className="max-h-[110px] max-w-[260px] object-contain rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-blue-600/10 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <span className="flex items-center gap-1 px-2 py-1 bg-slate-900/80 text-white text-[11px] font-bold rounded-lg backdrop-blur">
                      <ZoomIn className="w-3.5 h-3.5" /> Phóng to
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE SECTION: 4 OPTIONS (PHẦN CHỌN ĐÁP ÁN A, B, C, D - Distinct & Clear) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 my-1">
          {(['A', 'B', 'C', 'D'] as OptionKey[]).map((letter) => {
            const isCorrect = currentQ?.correct === letter;
            const isRevealed = gameState.isRevealed;
            const teamsPickedThisLetter = getTeamsForLetter(letter);

            const letterBadgeColors = {
              A: 'bg-rose-500 text-white border-rose-400',
              B: 'bg-blue-500 text-white border-blue-400',
              C: 'bg-amber-500 text-slate-950 border-amber-400',
              D: 'bg-emerald-500 text-white border-emerald-400',
            };

            return (
              <div
                key={letter}
                className={`relative flex items-center justify-between p-3 rounded-2xl border-2 transition-all duration-200 ${
                  isRevealed && isCorrect
                    ? 'bg-emerald-500/25 border-emerald-400 shadow-xl shadow-emerald-500/30 ring-2 ring-emerald-400/60 scale-[1.01]'
                    : isRevealed
                    ? 'bg-slate-900/60 border-slate-800/80 opacity-50'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 shadow-md'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-base shrink-0 border shadow-sm ${
                      isRevealed && isCorrect
                        ? 'bg-emerald-500 text-slate-950 border-white font-black'
                        : letterBadgeColors[letter]
                    }`}
                  >
                    {letter}
                  </div>
                  <span
                    className={`text-sm md:text-base leading-snug font-bold ${
                      isRevealed && isCorrect ? 'text-white font-extrabold' : 'text-slate-200'
                    }`}
                  >
                    {currentQ?.options[letter] || ''}
                  </span>
                </div>

                {/* Right badges on option card */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Correct badge */}
                  {isRevealed && isCorrect && (
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs shadow-md">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ĐÚNG</span>
                    </div>
                  )}

                  {/* 
                    REQUIREMENT 1: "phần các nhóm chọn đáp án chỉ hiển thị khi thời gian kết thúc"
                    Show which teams picked this option ONLY when isRevealed is true!
                    While !isRevealed: completely hidden!
                  */}
                  {isRevealed && teamsPickedThisLetter.length > 0 && (
                    <div className="flex items-center gap-1 animate-in zoom-in-90 duration-300">
                      {teamsPickedThisLetter.map((tId) => (
                        <span
                          key={tId}
                          className={`px-2 py-0.5 rounded-md text-xs font-black shadow border ${
                            teamColors[tId as 1 | 2 | 3 | 4].pill
                          }`}
                        >
                          Nhóm {tId}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Explanation Box (Auto-Shown after reveal) */}
        {gameState.isRevealed && currentQ?.explanation && (
          <div className="bg-slate-900/90 border border-blue-500/40 p-2.5 rounded-xl flex items-start gap-2.5 text-xs text-slate-200 animate-in fade-in duration-300">
            <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-cyan-300">Giải thích chi tiết: </span>
              <span className="leading-relaxed">{currentQ.explanation}</span>
            </div>
          </div>
        )}

        {/* 3. OLYMPIA 4-TEAM PODIUMS */}
        <div className="shrink-0">
          <div className="flex items-center justify-between mb-1 px-1">
            <span className="text-xs font-black tracking-wider text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              ĐÁP ÁN 4 NHÓM THI ĐẤU (OLYMPIA)
            </span>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="italic text-cyan-400">Hết giờ sẽ TỰ ĐỘNG hiện đáp án của các nhóm</span>
              <button
                onClick={onOpenStudentTab}
                className="text-cyan-400 hover:underline font-bold text-xs"
              >
                + Mở tab giả lập điện thoại
              </button>
            </div>
          </div>

          {/* 4 Teams Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {[1, 2, 3, 4].map((teamId) => {
              const team = gameState.teams[teamId];
              const styles = teamColors[teamId as 1 | 2 | 3 | 4];
              const isLocked = team?.isLocked;
              const isRevealed = gameState.isRevealed;
              const choice = team?.choice;
              const isCorrect = isRevealed && currentQ && choice === currentQ.correct;
              const isWrong = isRevealed && choice && currentQ && choice !== currentQ.correct;

              return (
                <div
                  key={teamId}
                  className={`p-3 rounded-2xl border-2 transition-all duration-300 flex flex-col justify-between shadow-lg ${
                    isCorrect
                      ? 'bg-emerald-950/50 border-emerald-400 shadow-emerald-500/25 ring-2 ring-emerald-400/50 scale-[1.02]'
                      : isWrong
                      ? 'bg-rose-950/30 border-rose-500/60 shadow-rose-500/10'
                      : isLocked && !isRevealed
                      ? `${styles.activeBg} ${styles.border} ${styles.glow} shadow-md`
                      : `bg-slate-900/85 border-slate-800/90`
                  }`}
                >
                  {/* Team Card Top: Avatar, Name, Online status, Score */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white shadow ${styles.badgeBg}`}
                      >
                        {teamId}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-sm text-white">{team?.name}</span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              team?.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                            }`}
                            title={team?.isConnected ? 'Đang online' : 'Chưa quét mã'}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {team?.isConnected ? 'Đã kết nối' : 'Chưa quét mã'}
                        </span>
                      </div>
                    </div>

                    {/* Team Score */}
                    <div className="flex items-center gap-1">
                      <span className="text-base font-black text-amber-400 font-mono">
                        {team?.score || 0}đ
                      </span>
                    </div>
                  </div>

                  {/* 
                    Team Card Center: Olympia Answer Reveal Area
                    REQUIREMENT 1:
                    - While !isRevealed: ONLY show "ĐÃ CHỐT ĐÁP ÁN 🔒" (letter is strictly hidden)
                    - When isRevealed: REVEAL the chosen letter [ A ], [ B ], [ C ], or [ D ]!
                  */}
                  <div className="py-2 flex flex-col items-center justify-center min-h-[58px]">
                    {!isRevealed ? (
                      isLocked ? (
                        <div className="flex flex-col items-center gap-1 animate-in zoom-in-95 duration-200">
                          <div
                            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border shadow ${styles.pill}`}
                          >
                            <Lock className="w-3.5 h-3.5" />
                            <span>ĐÃ CHỐT ĐÁP ÁN</span>
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono font-bold">
                            ⏱️ Sau {team.choiceTime || '0.0'}s
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <span className="w-2 h-2 rounded-full bg-slate-600 animate-ping" />
                          <span>Đang suy nghĩ...</span>
                        </div>
                      )
                    ) : (
                      /* AFTER TIME'S UP (AUTOMATIC REVEAL): Reveal exact letter! */
                      <div className="flex items-center gap-3 animate-in fade-in zoom-in-90 duration-300">
                        {choice ? (
                          <>
                            <div
                              className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-2xl shadow-xl border-2 ${
                                isCorrect
                                  ? 'bg-emerald-500 text-slate-950 border-white ring-2 ring-emerald-300'
                                  : 'bg-rose-500 text-white border-rose-300'
                              }`}
                            >
                              {choice}
                            </div>
                            <div className="flex flex-col">
                              {isCorrect ? (
                                <span className="text-xs font-black text-emerald-400 flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" /> ĐÚNG (+100đ)
                                </span>
                              ) : (
                                <span className="text-xs font-black text-rose-400 flex items-center gap-1">
                                  <XCircle className="w-4 h-4" /> SAI (0đ)
                                </span>
                              )}
                              <span className="text-[10px] text-slate-400 font-mono">
                                Thời gian: {team?.choiceTime || '0.0'}s
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center text-xs text-slate-500 font-bold">
                            Không trả lời (0đ)
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Team Card Bottom: Manual Score Adjust Quick Buttons */}
                  <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Điểm nhóm:</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onUpdateScore(teamId, -10)}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition font-bold"
                        title="Trừ 10đ"
                      >
                        -10
                      </button>
                      <button
                        onClick={() => onUpdateScore(teamId, 10)}
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition font-bold"
                        title="Cộng 10đ"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. BOTTOM ACTION CONTROL BAR */}
        <div className="h-14 px-3 bg-slate-900/95 border border-slate-800 rounded-2xl flex items-center justify-between shrink-0 gap-2 shadow-2xl">
          {/* Navigation Controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onPrevQuestion}
              disabled={gameState.currentQuestionIdx === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200 text-xs font-bold transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Câu trước</span>
            </button>
            <button
              onClick={onNextQuestion}
              disabled={gameState.currentQuestionIdx >= questions.length - 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-200 text-xs font-bold transition"
            >
              <span>Câu tiếp</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={onResetQuestion}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition ml-1"
              title="Đặt lại trạng thái làm bài câu này"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Làm lại</span>
            </button>
          </div>

          {/* Center Giant Action Button: REVEAL ANSWERS */}
          <button
            onClick={onRevealAnswers}
            disabled={gameState.isRevealed}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-black tracking-wide uppercase transition-all duration-200 shadow-xl ${
              gameState.isRevealed
                ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 border-2 border-emerald-300 shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98]'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {gameState.isRevealed ? '✓ ĐÃ CÔNG BỐ ĐÁP ÁN' : '🎉 CÔNG BỐ ĐÁP ÁN & TÍNH ĐIỂM'}
            </span>
          </button>

          {/* Right: Timer Controls */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 pl-1.5 hidden sm:inline">⏱️ Giờ:</span>

            {/* -5s button */}
            <button
              onClick={() => onStartTimer(Math.max(5, gameState.timerSecondsRemaining - 5))}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold transition"
              title="Giảm 5 giây"
            >
              -5s
            </button>

            {/* Duration selector */}
            <select
              value={customTimeInput}
              onChange={(e) => {
                setCustomTimeInput(e.target.value);
                const val = parseInt(e.target.value);
                if (val) {
                  onStartTimer(val);
                }
              }}
              className="py-1 px-1.5 bg-slate-900 border border-slate-700 rounded text-cyan-300 text-xs font-bold focus:outline-none"
            >
              <option value="15">15s</option>
              <option value="20">20s</option>
              <option value="30">30s</option>
              <option value="45">45s</option>
              <option value="60">60s (1p)</option>
              <option value="90">90s</option>
              <option value="120">120s (2p)</option>
            </select>

            {/* +5s button */}
            <button
              onClick={() => onStartTimer(Math.min(300, gameState.timerSecondsRemaining + 5))}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold transition"
              title="Tăng 5 giây"
            >
              +5s
            </button>

            {/* Start / Pause button */}
            <button
              onClick={() => {
                if (gameState.isTimerRunning) {
                  onPauseTimer();
                } else {
                  onStartTimer(gameState.timerSecondsRemaining || 30);
                }
              }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black transition shadow ${
                gameState.isTimerRunning
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
              }`}
            >
              {gameState.isTimerRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Tạm dừng</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Bắt đầu ({gameState.timerSecondsRemaining || 30}s)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* LIGHTBOX MODAL FOR ZOOMED IMAGE */}
      {zoomedImage && (
        <div
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4 bg-white rounded-2xl shadow-2xl">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-3 -right-3 p-1.5 rounded-full bg-slate-900 text-white hover:bg-rose-600 transition shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <img src={zoomedImage} alt="Hình phóng to" className="max-h-[80vh] max-w-full object-contain rounded-lg" />
          </div>
        </div>
      )}

      {/* MODALS */}
      <QRModal isOpen={isQRModalOpen} onClose={() => setIsQRModalOpen(false)} />
      <ScoreboardModal
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        teams={gameState.teams}
        onResetAllScores={onResetAllScores}
        onUpdateScore={onUpdateScore}
      />
      <EditQuestionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        question={currentQ}
        onSave={onSaveQuestion}
      />
      <ImportSetModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={onImportSet}
      />
    </div>
  );
}
