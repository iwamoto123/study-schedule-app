'use client';

/* =======================================================================
 * ProgressCard ― 1 教材分の「今日の進捗」入力カード
 * ===================================================================== */
import { useState, useEffect, useMemo, useRef } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { clampNumber } from '@/lib/validators';

/* ---------- 型定義 ---------- */
export type UnitType =
  | 'pages' | 'problems' | 'words' | 'chapters' | 'none';

interface ProgressCardProps {
  id:            string;
  unitType:      UnitType;

  /* 計画・総量 */
  plannedStart:  number;
  plannedEnd:    number;
  totalStart:    number;
  totalEnd:      number;

  /* 実績（null = まだ入力していない） */
  doneStart:     number | null;
  doneEnd:       number | null;

  /* Firestore へ保存するコールバック */
  onSave: (p: {
    id: string;
    doneStart: number | null;
    doneEnd:   number | null;
  }) => void;
}

/* ---------- 単位ラベル ---------- */
const unitLabel: Record<UnitType, string> = {
  pages:    'ページ',
  problems: '問題',
  words:    '単語',
  chapters: '章',
  none:     '',
};

/* =======================================================================
 * Component
 * ===================================================================== */
export default function ProgressCard({
  id,
  unitType,

  plannedStart,
  plannedEnd,
  totalStart,
  totalEnd,

  doneStart,
  doneEnd,

  onSave,
}: ProgressCardProps) {
  /* ------------------ state ------------------ */
  const [start, setStart] = useState<number>(
    doneStart ?? plannedStart,
  );
  const [end, setEnd]     = useState<number>(
    doneEnd   ?? plannedEnd,
  );

  /* ------------------ ヘルパ ------------------ */
  const unit = unitLabel[unitType];

  /** 入力が存在するか */
  const hasInput = doneStart !== null && doneEnd !== null;

  /** 「予定どおり完了か」を厳密に判定 */
  const isDone = hasInput &&
    start === plannedStart &&
    end   === plannedEnd;

  /* ------------------ Slider 値域を安全化 ------------------ */
  const safeStart = clampNumber(start, totalStart, totalEnd);
  const safeEnd   = clampNumber(end,   totalStart, totalEnd);

  /* ------------------ Firestore 保存 ------------------ */
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;         // ← 初回は保存しない
      return;
    }
    onSave({
      id,
      doneStart: start,
      doneEnd:   end,
    });
  }, [id, start, end, onSave]);

  /* ------------------ UI ------------------ */
  return (
    <div className="flex flex-col gap-3 rounded-xl border p-4 shadow-sm">
      {/* 進捗バー */}
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          style={{ width: `${((safeEnd - totalStart + 1) /
                               (totalEnd - totalStart + 1)) * 100}%` }}
          className="h-full rounded-full bg-indigo-500 transition-all"
        />
      </div>

      {/* スライダー */}
      <Slider.Root
        className="relative flex h-5 w-full touch-none select-none items-center"
        min={totalStart}
        max={totalEnd}
        value={[safeStart, safeEnd]}
        onValueChange={([s, e]) => {
          setStart(s);
          setEnd(e);
        }}
      >
        <Slider.Track className="relative h-1 w-full grow rounded-full bg-gray-300">
          <Slider.Range className="absolute h-full rounded-full bg-indigo-500" />
        </Slider.Track>
        <Slider.Thumb
          className="block h-4 w-4 rounded-full bg-white shadow-sm"
          aria-label="Start"
        />
        <Slider.Thumb
          className="block h-4 w-4 rounded-full bg-white shadow-sm"
          aria-label="End"
        />
      </Slider.Root>

      {/* 範囲表示 + 完了トグル */}
      <div className="flex items-center justify-between text-sm">
        <span>
          {safeStart.toLocaleString()} – {safeEnd.toLocaleString()} {unit}
        </span>

        <button
          type="button"
          onClick={() => {
            if (isDone) {
              // 未入力へ（範囲を 0 長にしてわかりやすくする）
              setEnd(Math.max(plannedStart - 1, totalStart));
            } else {
              // 予定どおり完了へ
              setStart(plannedStart);
              setEnd(plannedEnd);
            }
          }}
          className={`
            flex h-6 w-6 items-center justify-center rounded-full border
            ${isDone
              ? 'border-indigo-600 bg-indigo-600 text-white'
              : 'border-gray-300 bg-white text-gray-400'}
          `}
          aria-label={isDone ? '未入力に戻す' : '予定どおり完了にする'}
        >
          ✓
        </button>
      </div>
    </div>
  );
}
