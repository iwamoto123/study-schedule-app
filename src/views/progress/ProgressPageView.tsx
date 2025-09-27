'use client';

import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import InputSingle from '@/components/InputSingle';
import ProgressSummary from '@/components/ProgressSummary';
import TomorrowPlan from '@/components/TomorrowPlan';
import RangeSlider from '@/components/RangeSlider';
import { subjectLabel, unitLabel } from '@/components/StudyMaterialCard';
import type { ProgressCardData, TomorrowPlanCard } from '@/src/models/progress/cardGenerators';

export interface ProgressPageViewProps {
  todayDisplay: string;
  cards: ProgressCardData[];
  tomorrowCards: TomorrowPlanCard[];
  isLoading: boolean;
  onSave: (payload: {
    materialId: string;
    newStart: number;
    newEnd: number;
    prevStart: number | null;
    prevEnd: number | null;
  }) => Promise<void>;
}

const flipVariants = {
  initial: { rotateX: 90, opacity: 0 },
  animate: {
    rotateX: 0,
    opacity: 1,
    transition: { duration: 0.1, ease: [0.4, 0.0, 0.2, 1] },
  },
  exit: {
    rotateX: -90,
    opacity: 0,
    transition: { duration: 0.1, ease: [0.4, 0.0, 0.2, 1] },
  },
} as const;

interface MaterialCardProps {
  card: ProgressCardData;
  todayDisplay: string;
  onSave: ProgressPageViewProps['onSave'];
}

function MaterialCard({ card, todayDisplay, onSave }: MaterialCardProps) {
  const {
    id,
    title,
    subject,
    unitType,
    totalStart,
    totalEnd,
    plannedStart,
    plannedEnd,
    doneStart,
    doneEnd,
    prevStart,
    prevEnd,
  } = card;

  const unit = unitLabel[unitType as keyof typeof unitLabel];
  const isDone = doneStart !== null && doneEnd !== null;

  const [editing, setEditing] = useState(!isDone);
  const [start, setStart] = useState(doneStart ?? plannedStart);
  const [end, setEnd] = useState(doneEnd ?? plannedEnd);

  const clamp = useCallback((value: number, min: number, max: number) => Math.min(Math.max(value, min), max), []);

  const handleStartChange = useCallback((value: number) => {
    if (Number.isInteger(value)) setStart(clamp(value, totalStart, end));
  }, [clamp, end, totalStart]);

  const handleEndChange = useCallback((value: number) => {
    if (Number.isInteger(value)) setEnd(clamp(value, start, totalEnd));
  }, [clamp, start, totalEnd]);

  const handleSave = useCallback(async () => {
    await onSave({
      materialId: id,
      newStart: start,
      newEnd: end,
      prevStart,
      prevEnd,
    });
    setEditing(false);
  }, [end, id, onSave, prevEnd, prevStart, start]);

  return (
    <AnimatePresence mode="wait">
      {isDone && !editing && (
        <motion.section
          key="done"
          variants={flipVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ transformStyle: 'preserve-3d' }}
          className="relative cursor-pointer space-y-2 rounded-lg border bg-emerald-50 p-3 shadow-sm hover:bg-emerald-100"
          onClick={() => setEditing(true)}
        >
          <span className="absolute right-2 top-2 select-none text-lg">✅</span>

          <p className="text-center text-xs font-medium text-indigo-600">
            {subjectLabel[subject as keyof typeof subjectLabel]}
          </p>
          <h3 className="break-words text-center text-lg font-bold text-gray-900">
            {title}
          </h3>

          <p className="text-center text-sm font-semibold text-gray-700">
            入力済み
          </p>
          <p className="text-center text-sm text-gray-700">
            {todayDisplay}{' '}
            {doneStart === doneEnd
              ? `${doneStart}${unit}`
              : `${doneStart}〜${doneEnd}${unit}`}
          </p>

          <p className="text-center text-xs text-gray-500">（タップして再編集）</p>
        </motion.section>
      )}

      {(!isDone || editing) && (
        <motion.section
          key="edit"
          variants={flipVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ transformStyle: 'preserve-3d' }}
          className="space-y-2 rounded-lg border bg-white p-3 shadow-sm"
        >
          <p className="text-center text-xs font-medium text-indigo-600">
            {subjectLabel[subject as keyof typeof subjectLabel]}
          </p>

          <div className="flex items-start justify-between">
            <h3 className="break-words text-lg font-bold text-gray-900">
              {title}
            </h3>
            <span className="text-sm text-gray-700">
              今日のノルマ：{plannedEnd - plannedStart + 1} {unit}
            </span>
          </div>

          <p className="text-xs text-gray-600">
            合計 {totalEnd} {unit} ｜ 今日の予定：
            {plannedStart === plannedEnd
              ? `${plannedStart}${unit}`
              : `${plannedStart} ～ ${plannedEnd} ${unit}`}
          </p>

          <div className="flex items-center gap-2 text-sm">
            <span className="text-xs text-gray-500">今日やった範囲：</span>
            <InputSingle value={start} onChange={handleStartChange} className="w-12 text-center" />
            <span>～</span>
            <InputSingle value={end} onChange={handleEndChange} className="w-12 text-center" />
            <span>{unit}</span>
          </div>

          <div className="mt-1">
            <RangeSlider
              min={totalStart}
              max={totalEnd}
              value={{ start, end }}
              onChange={({ start: startValue, end: endValue }) => {
                if (startValue !== start) setStart(startValue);
                if (endValue !== end) setEnd(endValue);
              }}
              color="bg-indigo-500"
            />
          </div>

          <div className="mt-2 flex justify-end">
            <button
              onClick={handleSave}
              className="rounded bg-indigo-600 px-3 py-1 text-sm text-white"
            >
              保存
            </button>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

export function ProgressPageView({ todayDisplay, cards, tomorrowCards, isLoading, onSave }: ProgressPageViewProps) {
  return (
    <main className="mx-auto w-full max-w-none flex flex-col gap-4 p-4 sm:max-w-lg">
      <h1 className="mb-4 text-2xl font-bold">今日の進捗入力 {todayDisplay}</h1>

      {isLoading && <p className="text-sm text-gray-500">読み込み中...</p>}

      {cards.map(card => (
        <MaterialCard key={card.id} card={card} todayDisplay={todayDisplay} onSave={onSave} />
      ))}

      <ProgressSummary items={cards} />
      <TomorrowPlan items={tomorrowCards} />

      {!isLoading && cards.length === 0 && (
        <p className="text-center text-sm text-gray-500">登録された教材がありません</p>
      )}
    </main>
  );
}
