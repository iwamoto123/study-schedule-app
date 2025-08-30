// app/(tabs)/progress/page.tsx
'use client';

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
} from 'react';
import { format } from 'date-fns';
import dayjs from 'dayjs';
import 'dayjs/locale/ja';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

import { auth, db }      from '@/lib/firebase';
import { calcTodayPlan } from '@/lib/calcTodayPlan';
import { saveProgress }  from '@/lib/saveProgress';

import ProgressSummary from '@/components/ProgressSummary';
import TomorrowPlan    from '@/components/TomorrowPlan';
import RangeSlider     from '@/components/RangeSlider';
import InputSingle     from '@/components/InputSingle';
import {
  subjectLabel,
  unitLabel,
} from '@/components/StudyMaterialCard';

import type { Material } from '@/types/material';
import type { TodoItem } from '@/types/todo';

import { useAuthState } from 'react-firebase-hooks/auth';

dayjs.locale('ja');

/* ------------------------------------------------------------------ */
/*                               型                                  */
/* ------------------------------------------------------------------ */
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

type FirestoreMat  = Omit<Material, 'id'>;
type FirestoreTodo = Omit<TodoItem,  'id'>;

interface Todo {
  doneStart?: number | null;
  doneEnd?:   number | null;
}

interface TomorrowCard {
  id: string;
  title: string;
  subject: string;
  unitType: string;
  planStart: number;
  planEnd: number;
}

/* 回転アニメーション */
const flipVariants = {
  initial: { rotateX: 90, opacity: 0 },
  animate: { rotateX: 0,  opacity: 1,
             transition: { duration: 0.1, ease: [0.4, 0.0, 0.2, 1] } },
  exit   : { rotateX: -90, opacity: 0,
             transition: { duration: 0.1, ease: [0.4, 0.0, 0.2, 1] } },
} as const;

/* ------------------------------------------------------------------ */
/*                             ヘルパー                               */
/* ------------------------------------------------------------------ */
const donePages = (todo?: Todo) =>
  todo?.doneStart != null && todo?.doneEnd != null
    ? todo.doneEnd - todo.doneStart + 1
    : 0;

/* 今日のカード生成 -------------------------------------------------- */
export function generateTodayCards(
  materials: Record<string, Material>,
  todos: Record<string, Todo>,
): CardData[] {
  return Object.values(materials).map(mat => {
    const todo = todos[mat.id];

    const todayDone      = donePages(todo);
    const completedStart = Math.max(0, (mat.completed ?? 0) - todayDone);

    const todayPlan = calcTodayPlan({
      totalCount: mat.totalCount,
      completed : completedStart,
      deadline  : mat.deadline,
    });

    const plannedStart = completedStart + 1;
    const plannedEnd   = Math.min(plannedStart + todayPlan - 1, mat.totalCount);

    return {
      id           : mat.id,
      title        : mat.title,
      subject      : mat.subject,
      unitType     : mat.unitType,
      totalStart   : 1,
      totalEnd     : mat.totalCount,
      plannedStart,
      plannedEnd,
      doneStart    : todo?.doneStart ?? null,
      doneEnd      : todo?.doneEnd   ?? null,
      prevStart    : todo?.doneStart ?? null,
      prevEnd      : todo?.doneEnd   ?? null,
    };
  });
}

/* 明日のカード生成 -------------------------------------------------- */
export function generateTomorrowCards(
  materials: Record<string, Material>,
  todos: Record<string, Todo>,
): TomorrowCard[] {
  return Object.values(materials).flatMap(mat => {
    const todo          = todos[mat.id];
    const todayDone     = donePages(todo);
    const baseCompleted = mat.completed ?? 0;

    const todayPlanCnt = calcTodayPlan({
      totalCount: mat.totalCount,
      completed : baseCompleted,
      deadline  : mat.deadline,
    });

    const completedAfterToday =
      todayDone > 0 ? baseCompleted : baseCompleted + todayPlanCnt;

    if (completedAfterToday >= mat.totalCount) return [];

    const planCnt = calcTodayPlan(
      { totalCount: mat.totalCount,
        completed : completedAfterToday,
        deadline  : mat.deadline },
      dayjs().add(1, 'day'),
    );

    const planStart = completedAfterToday + 1;
    const planEnd   = Math.min(planStart + planCnt - 1, mat.totalCount);

    return [{
      id: mat.id,
      title:   mat.title,
      subject: mat.subject,
      unitType: mat.unitType,
      planStart,
      planEnd,
    }];
  });
}

/* ------------------------------------------------------------------ */
/*                         1 教材ぶんのカード                          */
/* ------------------------------------------------------------------ */
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
    doneEnd : number | null;
    prevStart: number | null;
    prevEnd  : number | null;
  }) => Promise<void>;
}) {
  const {
    id, title, subject, unitType,
    totalStart, totalEnd,
    plannedStart, plannedEnd,
    doneStart, doneEnd,
    prevStart, prevEnd,
  } = data;

  const unit   = unitLabel[unitType as keyof typeof unitLabel];
  const isDone = doneStart !== null && doneEnd !== null;

  const [editing, setEditing] = useState(!isDone);
  const [start, setStart]     = useState(doneStart ?? plannedStart);
  const [end,   setEnd]       = useState(doneEnd   ?? plannedEnd);

  const clamp = (v: number, min: number, max: number) =>
    Math.min(Math.max(v, min), max);

  const handleStartChange = (v: number) =>
    Number.isInteger(v) && setStart(clamp(v, totalStart, end));

  const handleEndChange = (v: number) =>
    Number.isInteger(v) && setEnd(clamp(v, start, totalEnd));

  const handleSave = async () => {
    await onSave({ id, doneStart: start, doneEnd: end, prevStart, prevEnd });
    setEditing(false);
  };

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
            {todayDisp}{' '}
            {doneStart === doneEnd
              ? `${doneStart}${unit}`
              : `${doneStart}〜${doneEnd}${unit}`}
          </p>

          <p className="text-center text-xs text-gray-500">
            （タップして再編集）
          </p>
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
          {/* 科目 */}
          <p className="text-center text-xs font-medium text-indigo-600">
            {subjectLabel[subject as keyof typeof subjectLabel]}
          </p>

          {/* タイトル & ノルマ */}
          <div className="flex items-start justify-between">
            <h3 className="break-words text-lg font-bold text-gray-900">
              {title}
            </h3>
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
/*                           ページ本体                               */
/* ------------------------------------------------------------------ */
export default function ProgressPage() {
  /* 🔸 全 Hook を冒頭で呼び出す */
  const [user, authLoading] = useAuthState(auth);

  const todayKey  = format(new Date(), 'yyyyMMdd');
  const todayDisp = dayjs().format('M/D(ddd)');

  const [materials, setMaterials] = useState<Record<string, Material>>({});
  const [todos,     setTodos]     = useState<Record<string, TodoItem>>({});

  /* materials 購読（uid 必須なので user が無い時はスキップ） */
  useEffect(() => {
    if (!user || authLoading) return;
    
    // デバッグ: 認証状態を確認
    console.log('🔐 Auth Debug:', {
      user: !!user,
      uid: user?.uid,
      authLoading,
      accessToken: user?.accessToken ? 'exists' : 'missing'
    });

    const collectionPath = `users/${user.uid}/materials`;
    console.log('📂 Accessing collection:', collectionPath);
    
    const q = query(
      collection(db, 'users', user.uid, 'materials'),
      orderBy('createdAt', 'asc'),
    );

    return onSnapshot(q, snap => {
      console.log('📋 Materials snapshot:', { size: snap.size, empty: snap.empty });
      const map: Record<string, Material> = {};
      snap.forEach(docSnap => {
        const data = docSnap.data() as FirestoreMat;
        const m: Material = { ...data, id: docSnap.id };
        m.todayPlan = calcTodayPlan(m);
        map[m.id]   = m;
      });
      setMaterials(map);
    }, error => {
      console.error('❌ Materials error:', error);
    });
  }, [user, authLoading]);

  /* todos 購読 */
  useEffect(() => {
    if (!user || authLoading) return;

    const col = collection(db, 'users', user.uid, 'todos', todayKey, 'items');
    return onSnapshot(col, snap => {
      const map: Record<string, TodoItem> = {};
      snap.forEach(docSnap => {
        const data = docSnap.data() as FirestoreTodo;
        map[docSnap.id] = { ...data, id: docSnap.id };
      });
      setTodos(map);
    });
  }, [user, authLoading, todayKey]);

  /* カード生成 */
  const cards = useMemo(
    () => generateTodayCards(materials, todos),
    [materials, todos],
  );

  const tomorrowCards = useMemo(
    () => generateTomorrowCards(materials, todos),
    [materials, todos],
  );

  /* 保存 */
  const handleSave = useCallback(async ({
    id, doneStart, doneEnd, prevStart, prevEnd,
  }: {
    id: string;
    doneStart: number | null;
    doneEnd  : number | null;
    prevStart: number | null;
    prevEnd  : number | null;
  }) => {
    if (!user) return;

    await saveProgress({
      uid        : user.uid,
      materialId : id,
      newStart   : doneStart ?? 0,
      newEnd     : doneEnd   ?? 0,
      prevStart,
      prevEnd,
    });
  }, [user]);

  /* 早期リターンは最終段階（JSX 部分の直前）で行う */
  if (authLoading) return <p className="p-4">読み込み中...</p>;
  if (!user)       return <p className="p-4">ログインしてください</p>;

  /* 画面 */
  return (
    <main className="mx-auto w-full max-w-none flex flex-col gap-4 p-4 sm:max-w-lg">
      <h1 className="mb-4 text-2xl font-bold">
        今日の進捗入力 {todayDisp}
      </h1>

      {cards.map(c => (
        <MaterialCard
          key={c.id}
          data={c}
          todayDisp={todayDisp}
          onSave={handleSave}
        />
      ))}

      <ProgressSummary items={cards} />
      <TomorrowPlan items={tomorrowCards} />

      {cards.length === 0 && (
        <p className="text-center text-sm text-gray-500">
          登録された教材がありません
        </p>
      )}
    </main>
  );
}
