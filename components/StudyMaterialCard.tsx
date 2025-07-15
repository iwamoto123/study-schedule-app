// components/StudyMaterialCard.tsx
'use client';

import { Pencil, Trash } from 'lucide-react';
import { useState, useMemo } from 'react';
import InputSingle from '@/components/InputSingle';

/* =======================================================================
 * 型定義 & ラベル
 * ===================================================================== */
export type UnitType =
  | 'pages' | 'problems' | 'words' | 'chapters' | 'none';

export type Subject =
  | 'math' | 'english' | 'japanese' | 'chemistry' | 'physics'
  | 'biology' | 'geology' | 'social' | 'informatics';

export const subjectLabel: Record<Subject, string> = {
  math: '数学', english: '英語', japanese: '国語', chemistry: '化学',
  physics: '物理', biology: '生物', geology: '地学',
  social: '社会', informatics: '情報',
};

export const unitLabel: Record<UnitType, string> = {
  pages: 'ページ', problems: '問題', words: '単語', chapters: '章', none: '',
};

/* =======================================================================
 * Props
 * ===================================================================== */
interface StudyMaterialCardProps {
  id: string;
  title: string;
  subject: Subject;
  unitType: UnitType;
  totalCount: number;
  /* 1 日あたりの初期計画量 */
  planCount: number;
  startDate?: string;
  deadline?: string;
  /* 累積完了数（Progress 画面から渡す） */
  done?: number;

  /* 操作用 */
  editable?: boolean;
  onSave?: (p: { id: string; doneCount: number }) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;

  className?: string;
}

/* =======================================================================
 * Component
 * ===================================================================== */
export default function StudyMaterialCard({
  id, title, subject, unitType, totalCount,
  planCount, startDate, deadline,
  done = 0,
  editable = false,
  onSave, onEdit, onDelete,
  className = '',
}: StudyMaterialCardProps) {
  /* ------------------ editable モード用 state ------------------ */
  const [doneCount, setDoneCount] = useState(0);
  const canSave = editable && doneCount > 0;

  /* ------------------ ラベル計算 ------------------ */
  const unit = unitLabel[unitType];

  /* 進捗率（％） */
  const progressPct = useMemo(() => {
    if (!totalCount) return 0;
    return Math.min(100, Math.round(((done ?? 0) / totalCount) * 100));
  }, [done, totalCount]);

  /* ------------------ 画面 ------------------ */
  return (
    <div
      className={`
        flex flex-col gap-2
        rounded-xl border border-gray-200 bg-white p-4 shadow-sm
        ${className}
      `}
    >
      {/* ---------- 科目ラベル ---------- */}
      <p className="mx-auto text-xs font-semibold text-indigo-600">
        {subjectLabel[subject]}
      </p>

      {/* ---------- タイトル + 初期計画 ---------- */}
      <div className="flex items-start justify-between gap-4">
        <h3 className="break-words text-base font-semibold text-gray-900">
          {title}
        </h3>

        <span className="shrink-0 text-sm font-medium text-gray-700">
          <span className="ml-1 text-xs text-gray-500">最初の計画　</span>
          {planCount.toLocaleString()}
          {unit && ` ${unit}`}/日
        </span>
      </div>

      {/* ---------- メタ情報 ---------- */}
      <p className="text-xs text-gray-600">
        合計 {totalCount.toLocaleString()} {unit}
        {startDate && <> ｜ 開始 {startDate}</>}
        {deadline && <> ｜ 目標 {deadline}</>}
      </p>

      {/* ---------- 進捗率表示 ---------- */}
      <p className="text-right text-xs font-medium text-gray-700">進捗率 {progressPct}%</p>

      {/* ---------- 進捗バー ---------- */}
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          style={{ width: `${progressPct}%` }}
          className="h-full rounded-full bg-indigo-500 transition-all"
        />
      </div>

      {/* ---------- editable 行 or アイコン行 ---------- */}
      {editable ? (
        <div className="flex items-center justify-end gap-2 pt-1">
          <InputSingle value={doneCount} onChange={setDoneCount} />
          {unit && <span className="text-xs text-gray-600">{unit}</span>}

          <button
            disabled={!canSave}
            onClick={() => {
              if (!canSave) return;
              onSave?.({ id, doneCount });
              setDoneCount(0);
            }}
            className="rounded-md bg-indigo-600 px-3 py-1 text-sm font-semibold text-white disabled:opacity-40"
          >
            ✓
          </button>
        </div>
      ) : (
        (onEdit || onDelete) && (
          <div className="flex justify-end gap-2 pt-1">
            {onEdit && (
              <button
                onClick={() => onEdit(id)}
                className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-indigo-600"
              >
                <Pencil size={16} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(id)}
                className="rounded-md p-1 text-red-500 hover:bg-red-50 hover:text-red-600"
              >
                <Trash size={16} />
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
}
