// /app/progress/page.tsx
'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import 'dayjs/locale/ja';
dayjs.locale('ja');

import { db } from '@/lib/firebase';
import { saveProgress } from '@/lib/saveProgress';

import RangeSlider from '@/components/RangeSlider';
import InputSingle from '@/components/InputSingle';
import type { Material } from '@/types/material';
import type { TodoItem } from '@/types/todo';
import { subjectLabel, unitLabel } from '@/components/StudyMaterialCard';

/* ------------------------------------------------------------------ */
/** 各教材 1 枚分のカード  */
type CardData = {
  id: string;
  title: string;
  subject: string;
  unitType: string;
  totalStart: number;
  totalEnd: number;
  plannedStart: number;
  plannedEnd: number;
  doneStart: number | null;
  doneEnd: number | null;
  prevStart: number | null;
  prevEnd: number | null;
};

/* ------------------------------------------------------------------ */
/** 1 教材ぶんの UI（RangeSlider + 保存ボタン） */
function MaterialCard({
  data,
  onSave,
}: {
  data: CardData;
  onSave: (args: {
    id: string;
    doneStart: number | null;
    doneEnd: number | null;
    prevStart: number | null;
    prevEnd: number | null;
  }) => void;
}) {
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
  } = data;

  const unit = unitLabel[unitType as keyof typeof unitLabel];

  const [start, setStart] = useState(doneStart ?? plannedStart);
  const [end, setEnd] = useState(doneEnd ?? plannedEnd);

  /* 手入力ハンドラ（バリデーション付き） */
  const handleStartChange = (v: number) => {
    if (!Number.isInteger(v)) return;
    const clamped = Math.min(Math.max(totalStart, v), end);
    if (clamped !== start) setStart(clamped);
  };

  const handleEndChange = (v: number) => {
    if (!Number.isInteger(v)) return;
    const clamped = Math.max(Math.min(totalEnd, v), start);
    if (clamped !== end) setEnd(clamped);
  };

  const handleSaveClick = () => {
    onSave({
      id,
      doneStart: start,
      doneEnd: end,
      prevStart,
      prevEnd,
    });
  };

  return (
    <section className="space-y-2 rounded-lg border bg-white p-3 shadow-sm">
      {/* 科目ラベル */}
      <p className="text-center text-xs font-medium text-indigo-600">
        {subjectLabel[subject as keyof typeof subjectLabel]}
      </p>

      {/* タイトル & 今日のノルマ */}
      <div className="flex items-start justify-between">
        <h3 className="break-words text-lg font-bold text-gray-900">
          {title}
        </h3>
        <span className="text-sm text-gray-700">
          今日のノルマ：{plannedEnd - plannedStart + 1} {unit}
        </span>
      </div>

      {/* メタ情報 */}
      <p className="text-xs text-gray-600">
        合計 {totalEnd} {unit} ｜ 今日の予定：{plannedStart} ～{' '}
        {plannedEnd} {unit}
      </p>

      {/* 手入力欄 */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-xs text-gray-500">今日やった範囲：</span>
        <InputSingle
          value={start}
          onChange={handleStartChange}
          className="w-12 text-center"
        />
        <span>～</span>
        <InputSingle
          value={end}
          onChange={handleEndChange}
          className="w-12 text-center"
        />
        <span>{unit}</span>
      </div>

      {/* スライダー */}
      <div className="mt-1">
        <RangeSlider
          min={totalStart}
          max={totalEnd}
          value={{ start, end }}
          onChange={({ start: s, end: e }) => {
            if (s !== start) setStart(s);
            if (e !== end) setEnd(e);
          }}
          color="bg-indigo-500"
        />
      </div>

      {/* 保存ボタン */}
      <div className="mt-2 flex justify-end">
        <button
          onClick={handleSaveClick}
          className="rounded bg-indigo-600 px-3 py-1 text-sm text-white"
        >
          保存
        </button>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/** ページ本体 */
export default function ProgressPage() {
  /* 1) ユーザー & 日付 */
  const uid = 'demoUser'; // TODO: 認証に置き換え
  const todayKey = format(new Date(), 'yyyyMMdd');
  const todayDisp = dayjs().format('M/D(ddd)');

  /* 2) Firestore データ保持 */
  const [materials, setMaterials] = useState<Record<string, Material>>(
    {},
  );
  const [todos, setTodos] = useState<Record<string, TodoItem>>({});

  /* (a) 教材購読 */
  useEffect(() => {
    const q = query(
      collection(db, 'users', uid, 'materials'),
      orderBy('createdAt', 'asc'),
    );
    return onSnapshot(q, (snap) => {
      const map: Record<string, Material> = {};
      snap.forEach(
        (d) => (map[d.id] = { id: d.id, ...(d.data() as any) }),
      );
      setMaterials(map);
    });
  }, [uid]);

  /* (b) 今日の todos 購読 */
  useEffect(() => {
    const col = collection(
      db,
      'users',
      uid,
      'todos',
      todayKey,
      'items',
    );
    return onSnapshot(col, (snap) => {
      const map: Record<string, TodoItem> = {};
      snap.forEach(
        (d) => (map[d.id] = { id: d.id, ...(d.data() as any) }),
      );
      setTodos(map);
    });
  }, [uid, todayKey]);

  /* 3) ProgressCard 用データ生成（残数 ÷ 残日数で今日のノルマ算出） */
  const cards: CardData[] = useMemo(() => {
    return Object.values(materials).map((mat) => {
      const todo = todos[mat.id];

      /* --- 進捗と残ページ --- */
      const completed = mat.completed ?? 0;
      const remaining = Math.max(mat.totalCount - completed, 0);

      /* --- 期日までの残日数（今日を含む） --- */
      const daysLeft = Math.max(
        1,
        dayjs(mat.deadline).diff(dayjs(), 'day') + 1,
      );

      /* --- 今日やるべき量 --- */
      const todayPlan = Math.ceil(remaining / daysLeft);

      /* --- 今日の予定範囲 --- */
      const planStart = completed + 1;
      const planEnd = Math.min(
        planStart + todayPlan - 1,
        mat.totalCount,
      );

      return {
        id: mat.id,
        title: mat.title,
        subject: mat.subject,
        unitType: mat.unitType,
        totalStart: 1,
        totalEnd: mat.totalCount,
        plannedStart: planStart,
        plannedEnd: planEnd,
        doneStart: todo?.doneStart ?? null,
        doneEnd: todo?.doneEnd ?? null,
        prevStart: todo?.doneStart ?? null,
        prevEnd: todo?.doneEnd ?? null,
      };
    });
  }, [materials, todos]);

  /* 4) 保存ハンドラ */
  const handleSave = useCallback(
    async ({
      id,
      doneStart,
      doneEnd,
      prevStart,
      prevEnd,
    }: {
      id: string;
      doneStart: number | null;
      doneEnd: number | null;
      prevStart: number | null;
      prevEnd: number | null;
    }) => {
      await saveProgress({
        uid,
        materialId: id,
        newStart: doneStart ?? 0,
        newEnd: doneEnd ?? 0,
        prevStart,
        prevEnd,
      });
    },
    [uid],
  );

  /* -------------------------------------------------- */
  /* 画面描画 */
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 p-4">
      <h1 className="mb-4 text-2xl font-bold">
        今日の進捗入力 {todayDisp}
      </h1>

      {cards.map((card) => (
        <MaterialCard key={card.id} data={card} onSave={handleSave} />
      ))}

      {cards.length === 0 && (
        <p className="text-center text-sm text-gray-500">
          登録された教材がありません
        </p>
      )}
    </main>
  );
}
