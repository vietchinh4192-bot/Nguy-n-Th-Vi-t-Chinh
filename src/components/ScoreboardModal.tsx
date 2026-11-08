import { Trophy, RotateCcw, Plus, Minus, X, Medal } from 'lucide-react';
import { TeamState } from '../types';

interface ScoreboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  teams: Record<number, TeamState>;
  onResetAllScores: () => void;
  onUpdateScore: (teamId: number, delta: number) => void;
}

export function ScoreboardModal({
  isOpen,
  onClose,
  teams,
  onResetAllScores,
  onUpdateScore,
}: ScoreboardModalProps) {
  if (!isOpen) return null;

  const teamList = [1, 2, 3, 4]
    .map((id) => teams[id])
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  const getRankBadge = (index: number) => {
    if (index === 0) {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-xs font-black">
          <Medal className="w-3.5 h-3.5 text-yellow-400" /> HẠNG 1
        </span>
      );
    }
    if (index === 1) {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/40 text-xs font-bold">
          <Medal className="w-3.5 h-3.5 text-slate-300" /> HẠNG 2
        </span>
      );
    }
    if (index === 2) {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-700/20 text-amber-400 border border-amber-600/40 text-xs font-bold">
          <Medal className="w-3.5 h-3.5 text-amber-500" /> HẠNG 3
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-bold">
        HẠNG 4
      </span>
    );
  };

  const teamBadgeColors = {
    1: 'bg-red-500/15 border-red-500/40 text-red-400',
    2: 'bg-blue-500/15 border-blue-500/40 text-blue-400',
    3: 'bg-amber-500/15 border-amber-500/40 text-amber-400',
    4: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-xl p-6 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col gap-5 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-amber-300">Bảng Xếp Hạng & Điểm Số 4 Nhóm</h3>
              <p className="text-xs text-slate-400">Hệ thống tính điểm thi đấu Đường Lên Đỉnh Olympia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Podium / Team List */}
        <div className="flex flex-col gap-3">
          {teamList.map((team, idx) => {
            return (
              <div
                key={team.id}
                className="flex items-center justify-between p-3.5 bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl transition"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border ${
                      teamBadgeColors[team.id as 1 | 2 | 3 | 4]
                    }`}
                  >
                    N{team.id}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-white">{team.name}</span>
                      {getRankBadge(idx)}
                    </div>
                    <span className="text-xs text-slate-400">
                      Trạng thái: {team.isConnected ? '🟢 Đã kết nối' : '⚪ Chưa quét mã'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onUpdateScore(team.id, -10)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                      title="Trừ 10 điểm"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-20 text-center font-black text-xl text-amber-400 font-mono">
                      {team.score}đ
                    </div>
                    <button
                      onClick={() => onUpdateScore(team.id, 10)}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                      title="Cộng 10 điểm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            onClick={() => {
              if (window.confirm('Thầy/Cô có chắc chắn muốn làm mới (về 0 điểm) cho tất cả 4 nhóm không?')) {
                onResetAllScores();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition"
          >
            <RotateCcw className="w-4 h-4" />
            Làm mới toàn bộ điểm về 0
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
