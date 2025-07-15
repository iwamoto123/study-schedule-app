// app/progress/page.tsx

'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import 'dayjs/locale/ja';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

import ProgressSummary from '@/components/ProgressSummary';
import TomorrowPlan     from '@/components/TomorrowPlan';
import { db }           from '@/lib/firebase';
import { saveProgress } from '@/lib/saveProgress';
import RangeSlider      from '@/components/RangeSlider';
import InputSingle      from '@/components/InputSingle';
import { subjectLabel, unitLabel } from '@/components/StudyMaterialCard';
import type { Material } from '@/types/material';
import { calcTodayPlan } from '@/lib/calcTodayPlan';

import type { TodoItem } from '@/types/todo';

dayjs.locale('ja');

/* ---------- 型 ---------- */
export type CardData = {
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

/* ---------- 回転アニメーション (X 軸フリップ) ---------- */
const flipVariants = {
  initial: { rotateX: 90, opacity: 0 },
  animate: { rotateX: 0, opacity: 1, transition: { duration: 0.1, ease: [0.4, 0.0, 0.2, 1] } },
  exit:    { rotateX: -90, opacity: 0, transition: { duration: 0.1, ease: [0.4, 0.0, 0.2, 1] } },
} as const;

/* ------------------------------------------------------------------ */
/** 1 教材ぶんのカード */
function MaterialCard({
  data,
  todayDisp,
  onSave,
}: {
  data: CardData;
  todayDisp: string;
  onSave: (args: {
    id: string;
    doneStart: number | null;
    doneEnd: number | null;
    prevStart: number | null;
    prevEnd: number | null;
  }) => Promise<void>;
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

  const unit   = unitLabel[unitType as keyof typeof unitLabel];
  const isDone = doneStart !== null && doneEnd !== null;

  const [editing, setEditing] = useState(!isDone);
  const [start, setStart]     = useState(doneStart ?? plannedStart);
  const [end,   setEnd]       = useState(doneEnd   ?? plannedEnd);

  /* ----- 保存 ----- */
  const handleSave = async () => {
    await onSave({ id, doneStart: start, doneEnd: end, prevStart, prevEnd });
    setEditing(false);
  };

  /* ----- 整数入力ガード ----- */
  const clamp = (v:number,min:number,max:number)=>Math.min(Math.max(v,min),max);
  const handleStartChange = (v:number)=>Number.isInteger(v)&&setStart(clamp(v,totalStart,end));
  const handleEndChange   = (v:number)=>Number.isInteger(v)&&setEnd  (clamp(v,start,totalEnd));

  /* ---------------------------------------------------------------- */
  return (
    <AnimatePresence mode="wait">
      {/* ===== 完了ビュー ===== */}
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

          {/* 科目 & タイトル */}
          <p className="text-center text-xs font-medium text-indigo-600">
            {subjectLabel[subject as keyof typeof subjectLabel]}
          </p>
          <h3 className="break-words text-center text-lg font-bold text-gray-900">
            {title}
          </h3>

          {/* 入力済み表示 */}
          <p className="text-center text-sm font-semibold text-gray-700">入力済み</p>
          <p className="text-center text-sm text-gray-700">
            {todayDisp}{' '}
            {doneStart === doneEnd
             ? `${doneStart}${unit}`
             : `${doneStart}〜${doneEnd}${unit}`}
          </p>

          <p className="text-center text-xs text-gray-500">（タップして再編集）</p>
        </motion.section>
      )}

      {/* ===== 編集ビュー ===== */}
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
          {/* 科目 */}
          <p className="text-center text-xs font-medium text-indigo-600">
            {subjectLabel[subject as keyof typeof subjectLabel]}
          </p>

          {/* タイトル & ノルマ */}
          <div className="flex items-start justify-between">
            <h3 className="break-words text-lg font-bold text-gray-900">{title}</h3>
            <span className="text-sm text-gray-700">
              今日のノルマ：{plannedEnd - plannedStart + 1} {unit}
            </span>
          </div>

          {/* メタ */}
          <p className="text-xs text-gray-600">
            合計 {totalEnd} {unit} ｜ 今日の予定：
            {plannedStart === plannedEnd
             ? `${plannedStart}${unit}`
             : `${plannedStart} ～ ${plannedEnd} ${unit}`}
          </p>

          {/* 手入力 */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xs text-gray-500">今日やった範囲：</span>
            <InputSingle value={start} onChange={handleStartChange} className="w-12 text-center" />
            <span>～</span>
            <InputSingle value={end} onChange={handleEndChange} className="w-12 text-center" />
            <span>{unit}</span>
          </div>

          {/* スライダー */}
          <div className="mt-1">
            <RangeSlider
              min={totalStart}
              max={totalEnd}
              value={{ start, end }}
              onChange={({ start:s, end:e }) => {
                if (s !== start) setStart(s);
                if (e !== end)   setEnd(e);
              }}
              color="bg-indigo-500"
            />
          </div>

          {/* 保存 */}
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

/* ------------------------------------------------------------------ */
/** ページ本体 */
export default function ProgressPage() {
  const uid        = 'demoUser';
  const todayKey   = format(new Date(), 'yyyyMMdd');
  const todayDisp  = dayjs().format('M/D(ddd)');

  const [materials, setMaterials] = useState<Record<string, Material>>({});
  const [todos,     setTodos]     = useState<Record<string, TodoItem>>({});

  /* ----- Firestore 購読 ----- */
  useEffect(() => {
    const q = query(collection(db, 'users', uid, 'materials'), orderBy('createdAt', 'asc'));
    return onSnapshot(q, snap => {
      const map: Record<string, Material> = {};
      snap.forEach(d => {
        const m = { id: d.id, ...(d.data() as any) } as Material;
        m.todayPlan = calcTodayPlan(m); // 参考として保持（グラフ等に使うなら）
        map[d.id]   = m;
      });
      setMaterials(map);
    });
  }, [uid]);

  useEffect(() => {
    const col = collection(db, 'users', uid, 'todos', todayKey, 'items');
    return onSnapshot(col, snap => {
      const map: Record<string, TodoItem> = {};
      snap.forEach(d => (map[d.id] = { id: d.id, ...(d.data() as any) }));
      setTodos(map);
    });
  }, [uid, todayKey]);

  /* ----- カードデータ生成（今日） ----- */
  const cards: CardData[] = useMemo(() =>
    Object.values(materials).map(mat => {
      const todo = todos[mat.id];

      /* ① 今日入力済みページ数 */
      const doneSpan =
        todo?.doneStart != null && todo?.doneEnd != null
          ? todo.doneEnd - todo.doneStart + 1
          : 0;

      /* ② 今朝時点 completed */
      const baseCompleted = (mat.completed ?? 0) - doneSpan;

      /* ③ calcTodayPlan でノルマを統一計算 */
      const todayPlan = calcTodayPlan({
        totalCount: mat.totalCount,
        completed:  baseCompleted,
        deadline:   mat.deadline,
      });

      const planStart = baseCompleted + 1;
      const planEnd   = Math.min(planStart + todayPlan - 1, mat.totalCount);

      return {
        id: mat.id,
        title: mat.title,
        subject: mat.subject,
        unitType: mat.unitType,
        totalStart: 1,
        totalEnd: mat.totalCount,

        plannedStart: planStart,
        plannedEnd:   planEnd,

        doneStart: todo?.doneStart ?? null,
        doneEnd:   todo?.doneEnd   ?? null,
        prevStart: todo?.doneStart ?? null,
        prevEnd:   todo?.doneEnd   ?? null,
      } as CardData;
    }),
  [materials, todos]);


/* ----- 明日の予定カード生成 ----- */
const tomorrowCards = useMemo(() => {
  return Object.values(materials).flatMap(mat => {
    // ① すでに完了している量
    const completedNow = mat.completed ?? 0;
    if (completedNow >= mat.totalCount) return [];      // 全部終わっている教材は除外

    // ② 今日やるべき量（期待値）を再計算
    const todayPlanCnt = calcTodayPlan(
      { totalCount: mat.totalCount, completed: completedNow, deadline: mat.deadline },
      dayjs(),                                         // きょう基準
    );

    // ③ 今日が終わった時点の累積完了量
    const completedEndOfToday = Math.min(
      completedNow + todayPlanCnt,
      mat.totalCount,
    );

    // ④ 明日のノルマを計算（基準日を「明日」に）
    const tomorrow      = dayjs().add(1, 'day');
    const tmwPlanCnt    = calcTodayPlan(
      {
        totalCount: mat.totalCount,
        completed:  completedEndOfToday,
        deadline:   mat.deadline,
      },
      tomorrow,
    );

    // ⑤ 明日の開始/終了ページ
    const planStart = completedEndOfToday + 1;
    const planEnd   = Math.min(planStart + tmwPlanCnt - 1, mat.totalCount);

    return [{
      id:    mat.id,
      title: mat.title,
      subject:  mat.subject,
      unitType: mat.unitType,
      /* TomorrowPlan コンポーネントが期待する値 */
      planStart,
      planEnd,
    }];
  });
}, [materials]);



  /* ----- 保存ハンドラ ----- */
  const handleSave = useCallback(async (args: {
    id: string;
    doneStart: number | null;
    doneEnd: number | null;
    prevStart: number | null;
    prevEnd: number | null;
  }) => {
    await saveProgress({
      uid,
      materialId: args.id,
      newStart:   args.doneStart ?? 0,
      newEnd:     args.doneEnd   ?? 0,
      prevStart:  args.prevStart,
      prevEnd:    args.prevEnd,
    });
  }, [uid]);

  /* ----- 描画 ----- */
  return (
    <main className="mx-auto w-full max-w-none flex flex-col gap-4 p-4 sm:max-w-lg">
      <h1 className="mb-4 text-2xl font-bold">今日の進捗入力 {todayDisp}</h1>

      {/* --- 今日のカード --- */}
      {cards.map(c => (
        <MaterialCard
          key={c.id}
          data={c}
          todayDisp={todayDisp}
          onSave={handleSave}
        />
      ))}

      {/* --- 今日の進捗まとめ --- */}
      <ProgressSummary items={cards} />

      {/* --- 明日の予定 --- */}
      <TomorrowPlan items={tomorrowCards} />

      {cards.length === 0 && (
        <p className="text-center text-sm text-gray-500">登録された教材がありません</p>
      )}
    </main>
  );
}
