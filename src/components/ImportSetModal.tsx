import React, { useState } from 'react';
import { X, FileText, Check, AlertCircle } from 'lucide-react';
import { Question, OptionKey } from '../types';

interface ImportSetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (title: string, questions: Question[]) => Promise<{ error?: string; success?: boolean }>;
}

export function ImportSetModal({ isOpen, onClose, onImport }: ImportSetModalProps) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleParseAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tên bộ đề!');
      return;
    }

    if (!text.trim()) {
      setErrorMsg('Vui lòng dán nội dung các câu hỏi!');
      return;
    }

    // Parse simple question format:
    // Câu 1: ...
    // A. ...
    // B. ...
    // C. ...
    // D. ...
    // Đáp án: A
    try {
      setIsSubmitting(true);
      const rawBlocks = text.split(/(?=Câu\s+\d+[:.])/i).filter((b) => b.trim().length > 0);
      const parsedQuestions: Question[] = [];

      let qId = 1;
      for (const block of rawBlocks) {
        const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
        if (lines.length < 5) continue;

        let qTitle = lines[0];
        let optA = '';
        let optB = '';
        let optC = '';
        let optD = '';
        let correct: OptionKey = 'A';
        let explanation = '';

        for (const line of lines.slice(1)) {
          if (/^A[.:\)]\s*/i.test(line)) {
            optA = line.replace(/^A[.:\)]\s*/i, '');
          } else if (/^B[.:\)]\s*/i.test(line)) {
            optB = line.replace(/^B[.:\)]\s*/i, '');
          } else if (/^C[.:\)]\s*/i.test(line)) {
            optC = line.replace(/^C[.:\)]\s*/i, '');
          } else if (/^D[.:\)]\s*/i.test(line)) {
            optD = line.replace(/^D[.:\)]\s*/i, '');
          } else if (/^(Đáp\s*án|Key)[:\s]+([ABCD])/i.test(line)) {
            const match = line.match(/^(Đáp\s*án|Key)[:\s]+([ABCD])/i);
            if (match && match[2]) {
              correct = match[2].toUpperCase() as OptionKey;
            }
          } else if (/^Giải\s*thích[:\s]+/i.test(line)) {
            explanation = line.replace(/^Giải\s*thích[:\s]+/i, '');
          } else if (!optA) {
            qTitle += ' ' + line;
          }
        }

        if (optA && optB && optC && optD) {
          parsedQuestions.push({
            id: qId++,
            title: qTitle,
            options: { A: optA, B: optB, C: optC, D: optD },
            correct,
            duration: 30,
            explanation,
          });
        }
      }

      if (parsedQuestions.length === 0) {
        setErrorMsg('Không tìm thấy câu hỏi hợp lệ theo mẫu (Câu 1:... A.... B.... C.... D.... Đáp án: A).');
        setIsSubmitting(false);
        return;
      }

      const res = await onImport(title.trim(), parsedQuestions);
      if (res && res.error) {
        setErrorMsg(res.error);
      } else {
        onClose();
      }
    } catch {
      setErrorMsg('Lỗi phân tích cú pháp bộ đề!');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-2xl p-6 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col gap-4 text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-indigo-300">Nạp Bộ Câu Hỏi Mới</h3>
              <p className="text-xs text-slate-400">Dán trực tiếp từ Word hoặc văn bản trắc nghiệm</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 text-xs font-bold text-rose-300 bg-rose-950/50 border border-rose-500/40 rounded-xl">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleParseAndSave} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1.5">
              Tên bộ đề / Chủ đề câu hỏi:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Kiểm tra trắc nghiệm 15 phút, Ôn tập giữa kì..."
              required
              className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Dán nội dung câu hỏi:
              </label>
              <span className="text-[11px] text-slate-500">Định dạng: Câu X: ... A. ... B. ... C. ... D. ... Đáp án: A</span>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={9}
              required
              placeholder={`Câu 1: Thủ đô của Việt Nam là gì?\nA. Hà Nội\nB. TP. Hồ Chí Minh\nC. Đà Nẵng\nD. Hải Phòng\nĐáp án: A\nGiải thích: Hà Nội là thủ đô của nước CHXHCN Việt Nam.\n\nCâu 2: Số nguyên tố chẵn duy nhất là:\nA. 0\nB. 1\nC. 2\nD. 4\nĐáp án: C`}
              className="w-full p-3 bg-slate-950/80 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
            />
          </div>

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
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {isSubmitting ? 'Đang phân tích...' : 'Phân Tích & Lưu Bộ Đề'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
