'use client';

import { useState, useMemo } from 'react';
import InputSingle from '@/components/InputSingle';

export type UnitType = 'pages' | 'problems';

interface StudyMaterialCardProps {
  id: string;
  title: string;
  unitType: UnitType;
  planCount: number;                       // 今日やる予定の数
  editable?: boolean;                      // true=入力モード
  onSave?: (data: { id: string; doneCount: number }) => void;
  className?: string;
}

export default function StudyMaterialCard({
  id,
  title,
  unitType,
  planCount,
  editable = false,
  onSave,
  className = '',
}: StudyMaterialCardProps) {
  const [done, setDone] = useState(0);

  const label = unitType === 'pages' ? 'ページ' : '問題';
  const canSave = editable && done > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave?.({ id, doneCount: done });
    setDone(0); // 送信後クリアしても OK
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-lg bg-white shadow-sm ring-1 ring-gray-200 px-4 py-3 ${className}`.trim()}
    >
      {/* 参考書名 */}
      <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900">
        {title}
      </p>

      {/* 数値入力 or 予定表示 */}
      {editable ? (
        <InputSingle value={done} onChange={setDone} className="text-center" />
      ) : (
        <span className="whitespace-nowrap text-sm text-gray-700">
          {planCount} {label}
        </span>
      )}

      {/* 単位ラベル（editable モードのみ） */}
      {editable && <span className="text-xs text-gray-600">{label}</span>}

      {/* 保存ボタン */}
      {editable && (
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="rounded-md bg-indigo-600 px-3 py-1 text-sm font-semibold text-white disabled:opacity-40"
        >
          ✓
        </button>
      )}
    </div>
  );
}
