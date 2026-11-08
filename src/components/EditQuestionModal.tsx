import React, { useState, useEffect } from 'react';
import { X, Check, Edit3, Clock } from 'lucide-react';
import { Question, OptionKey } from '../types';

interface EditQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: Question | null;
  onSave: (updated: Question) => void;
}

export function EditQuestionModal({ isOpen, onClose, question, onSave }: EditQuestionModalProps) {
  const [title, setTitle] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correct, setCorrect] = useState<OptionKey>('A');
  const [duration, setDuration] = useState<number>(30);
  const [explanation, setExplanation] = useState('');

  useEffect(() => {
    if (question) {
      setTitle(question.title || '');
      setOptA(question.options?.A || '');
      setOptB(question.options?.B || '');
      setOptC(question.options?.C || '');
      setOptD(question.options?.D || '');
      setCorrect(question.correct || 'A');
      setDuration(question.duration || 30);
      setExplanation(question.explanation || '');
    }
  }, [question]);

  if (!isOpen || !question) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...question,
      title: title.trim(),
      options: {
        A: optA.trim(),
        B: optB.trim(),
        C: optC.trim(),
        D: optD.trim(),
      },
      correct,
      duration: Math.max(5, duration || 30),
      explanation: explanation.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col gap-4 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-cyan-300">Chỉnh Sửa Câu Hỏi & Phương Án</h3>
              <p className="text-xs text-slate-400">Thay đổi câu hỏi linh hoạt cho mọi môn học và bài học</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Question Title */}
          <div>
            <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-1.5">
              Nội dung câu hỏi:
            </label>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={3}
              required
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition resize-none"
              placeholder="Nhập nội dung câu hỏi..."
            />
          </div>

          {/* 4 Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Phương án A:</label>
              <input
                type="text"
                value={optA}
                onChange={(e) => setOptA(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Phương án B:</label>
              <input
                type="text"
                value={optB}
                onChange={(e) => setOptB(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Phương án C:</label>
              <input
                type="text"
                value={optC}
                onChange={(e) => setOptC(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Phương án D:</label>
              <input
                type="text"
                value={optD}
                onChange={(e) => setOptD(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Correct answer & duration */}
          <div className="flex flex-wrap items-center gap-6 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2.5">
              <label className="text-xs font-bold text-emerald-400">Đáp án đúng:</label>
              <select
                value={correct}
                onChange={(e) => setCorrect(e.target.value as OptionKey)}
                className="px-3 py-1.5 bg-slate-900 border border-emerald-500/50 rounded-lg text-emerald-300 font-black text-sm focus:outline-none"
              >
                <option value="A">Phương án A</option>
                <option value="B">Phương án B</option>
                <option value="C">Phương án C</option>
                <option value="D">Phương án D</option>
              </select>
            </div>

            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-cyan-400" />
              <label className="text-xs font-bold text-cyan-400">Thời gian suy nghĩ:</label>
              <input
                type="number"
                min="5"
                max="300"
                step="5"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                className="w-20 px-2 py-1 bg-slate-900 border border-cyan-500/50 rounded-lg text-cyan-300 font-bold text-sm text-center focus:outline-none"
              />
              <span className="text-xs text-slate-400">giây</span>
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1">Giải thích chi tiết (Barem đáp án):</label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 resize-none"
              placeholder="Nhập giải thích chi tiết khi công bố đáp án..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition shadow-lg shadow-emerald-400/25"
            >
              <Check className="w-4 h-4" />
              Lưu Thay Đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
