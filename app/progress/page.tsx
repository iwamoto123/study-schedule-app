'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { format } from 'date-fns';

import { db } from '@/lib/firebase';
import ProgressCard from '@/components/ProgressCard';
import { saveProgress } from '@/lib/saveProgress';

import type { Material } from '@/types/material';
import type { TodoItem } from '@/types/todo';

/* -------------------------------------------------------
 * 画面コンポーネント
 * ----------------------------------------------------- */
export default function ProgressPage() {
  /* 1) ユーザー & 今日のキー */
  const uid      = 'demoUser';                    // 認証未実装なら固定で OK
  const todayKey = format(new Date(), 'yyyyMMdd'); // 例: 20250531

  /* 2) Firestore から取得したデータを保持 */
  const [materials, setMaterials] = useState<Record<string, Material>>({});
  const [todos,     setTodos]     = useState<Record<string, TodoItem>>({});

  /* ---------- (a) 教材一覧を購読 ---------- */
  useEffect(() => {
    const q = query(
      collection(db, 'users', uid, 'materials'),
      orderBy('createdAt', 'asc'),
    );
    return onSnapshot(q, (snap) => {
      const map: Record<string, Material> = {};
      snap.forEach((d) => (map[d.id] = { id: d.id, ...(d.data() as any) }));
      setMaterials(map);
    });
  }, [uid]);

  /* ---------- (b) 今日の todos を購読 ---------- */
  useEffect(() => {
    const col = collection(db, 'users', uid, 'todos', todayKey, 'items');
    return onSnapshot(col, (snap) => {
      const map: Record<string, TodoItem> = {};
      snap.forEach((d) => (map[d.id] = { id: d.id, ...(d.data() as any) }));
      setTodos(map);
    });
  }, [uid, todayKey]);

  /* 3) materials と todos を突合し、ProgressCard 用データを生成 */
  const cards = useMemo(() => {
    return Object.values(materials).map((mat) => {
      const todo = todos[mat.id];

      // --- 今日やる予定範囲 ---
      const planStart = (mat.completed ?? 0) + 1;
      const planEnd   = Math.min(
        planStart + mat.dailyPlan - 1,
        mat.totalCount,
      );

      return {
        id:            mat.id,
        unitType:      mat.unitType,
        totalStart:    1,
        totalEnd:      mat.totalCount,
        plannedStart:  planStart,
        plannedEnd:    planEnd,
        doneStart:     todo?.doneStart ?? null,
        doneEnd:       todo?.doneEnd   ?? null,
        /* 差分保存で必要な直前値 */
        prevStart:     todo?.doneStart ?? null,
        prevEnd:       todo?.doneEnd   ?? null,
      };
    });
  }, [materials, todos]);

  /* 4) 差分保存ハンドラ ------------- */
  const handleSave = async (args: {
    id: string;
    doneStart: number | null;
    doneEnd:   number | null;
    prevStart: number | null;
    prevEnd:   number | null;
  }) => {
    const { id, doneStart, doneEnd, prevStart, prevEnd } = args;

    await saveProgress({
      uid,
      materialId: id,
      newStart: doneStart ?? 0,
      newEnd:   doneEnd   ?? 0,
      prevStart,
      prevEnd,
    });
  };

  /* -------------------------------------------------------
   * 画面描画
   * ----------------------------------------------------- */
  return (
    <main className="mx-auto flex max-w-lg flex-col gap-4 p-4">
      <h1 className="mb-2 text-xl font-bold">今日の進捗</h1>

      {cards.map((c) => (
        <ProgressCard
          key={c.id}
          id={c.id}
          unitType={c.unitType}
          totalStart={c.totalStart}
          totalEnd={c.totalEnd}
          plannedStart={c.plannedStart}
          plannedEnd={c.plannedEnd}
          doneStart={c.doneStart}
          doneEnd={c.doneEnd}
          onSave={({ id, doneStart, doneEnd }) =>
            handleSave({
              id,
              doneStart,
              doneEnd,
              prevStart: c.prevStart,
              prevEnd:   c.prevEnd,
            })
          }
        />
      ))}

      {cards.length === 0 && (
        <p className="text-center text-sm text-gray-500">
          登録された教材がありません
        </p>
      )}
    </main>
  );
}
