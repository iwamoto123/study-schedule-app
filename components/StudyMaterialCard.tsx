// components/StudyMaterialCard.tsx
'use client';

import { Pencil, Trash } from 'lucide-react';
import { useState, useMemo } from 'react';
import InputSingle from '@/components/InputSingle';

export type UnitType =
  | 'pages'     // ページ
  | 'problems'  // 問題
  | 'words'     // 単語
  | 'chapters'  // 章(ユニット)
  | 'none';     // 単位なし

export type Subject =
  | 'math' | 'english' | 'japanese' | 'chemistry' | 'physics'
  | 'biology' | 'geology' | 'social' | 'informatics';

const subjectLabel: Record<Subject, string> = {
  math: '数学',
  english: '英語',
  japanese: '国語',
  chemistry: '化学',
  physics: '物理',
  biology: '生物',
  geology: '地学',
  social: '社会',
  informatics: '情報',
};


interface StudyMaterialCardProps {
  id: string;
  /* 表示用 */
  title: string;
  subject: Subject;
  unitType: UnitType;
  totalCount: number;
  planCount: number;              // 1日あたり
  startDate?: string;             // YYYY-MM-DD
  deadline?: string;              // YYYY-MM-DD
  done?: number;                  // 進捗入力画面で加算するとき用
  /* 編集モード (数値入力＋保存ボタン) が必要なら true */
  editable?: boolean;
  onSave?:   (p: { id: string; doneCount: number }) => void;
  /* カード右上アイコン用 */
  onEdit?:   (id: string) => void;
  onDelete?: (id: string) => void;

  className?: string;
}

export default function StudyMaterialCard({
  id,
  title,
  subject,
  unitType,
  totalCount,
  planCount,
  startDate,
  deadline,
  done = 0,
  editable = false,
  onSave,
  onEdit,
  onDelete,
  className = '',
}: StudyMaterialCardProps) {
  /* ---------- editable 用のローカル state ---------- */
  const [doneCount, setDoneCount] = useState(0);
  const canSave = editable && doneCount > 0;

  const label = unitType === 'pages' ? 'ページ' : '問題';

  /* 進捗率（％）を算出して 0–100 でクリップ */
  const progressPct = useMemo(() => {
    if (!totalCount) return 0;
    const pct = Math.min(100, Math.round(((done ?? 0) / totalCount) * 100));
    return pct;
  }, [done, totalCount]);

  /* ---------- 画面 ---------- */
  return (
    <div
      className={`space-y-2 rounded-xl border border-gray-200 bg-white p-4 shadow-sm ${className}`}
    >
      {/* 1行目：タイトル + 1日あたり */}
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
         {/* ★ ここに科目ラベルを追加 */}
    <p className="mt-0.5 text-xs font-medium text-indigo-600">
      {subjectLabel[subject]}
    </p>

        <span className="shrink-0 text-sm font-medium text-gray-700">
          {planCount.toLocaleString()} {label}/日
        </span>
      </div>

      {/* 2行目：メタ情報 */}
      <p className="text-xs text-gray-600">
        合計 {totalCount.toLocaleString()} {label}
        {startDate && (
          <>
            {' ｜ '}開始 {startDate}
          </>
        )}
        {deadline && (
          <>
            {' ｜ '}目標 {deadline}
          </>
        )}
      </p>

      {/* 進捗バー */}
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          style={{ width: `${progressPct}%` }}
          className="h-full rounded-full bg-indigo-500 transition-all"
        />
      </div>

      {/* editable モードの入力行 or アイコン列 */}
      {editable ? (
        <div className="flex items-center justify-end gap-2 pt-1">
          <InputSingle value={doneCount} onChange={setDoneCount} />
          <span className="text-xs text-gray-600">{label}</span>

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
        /* 右上アイコン（編集／削除）が欲しい場合だけ表示 */
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
