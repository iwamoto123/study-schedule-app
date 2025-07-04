// /app/graph/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import dayjs from 'dayjs';

import { db } from '@/lib/firebase';
import GraphCard, {
  GraphDataPoint,
} from '@/components/GraphCard';
import { unitLabel } from '@/components/StudyMaterialCard';

/* ---------- 型定義 ---------- */
interface Material {
  id: string;
  title: string;
  totalCount: number;
  unitType: keyof typeof unitLabel;
  startDate: string;  // YYYY-MM-DD
  deadline: string;   // YYYY-MM-DD
  subject: string;
}

interface ProgressLog {
  date: string; // YYYY-MM-DD
  done: number; // 累積完了数
}

export default function ProgressGraphPage() {
  const uid = 'demoUser'; // TODO: 認証と接続
  const [materials, setMaterials] = useState<Material[]>([]);
  const [graphs, setGraphs] = useState<
    Record<string, GraphDataPoint[]>
  >({});

  /* ---------- (1) 教材一覧購読 ---------- */
  useEffect(() => {
    const matsCol = collection(db, 'users', uid, 'materials');
    const q = query(matsCol, orderBy('createdAt', 'asc'));

    const unsub = onSnapshot(q, (snap) => {
      const list: Material[] = [];
      snap.forEach((doc) => {
        const d = doc.data();
        if (d.startDate && d.deadline) {
          list.push({
            id: doc.id,
            title: d.title,
            totalCount: d.totalCount,
            unitType: d.unitType,
            startDate: d.startDate,
            deadline: d.deadline,
            subject: d.subject,
          });
        }
      });
      setMaterials(list);
    });

    return () => unsub();
  }, [uid]);

  /* ---------- (2) logs 購読 & グラフデータ生成 ---------- */
  useEffect(() => {
    if (materials.length === 0) return;

    materials.forEach((mat) => {
      const logsCol = collection(
        db,
        'users',
        uid,
        'materials',
        mat.id,
        'logs',
      );
      const q = query(logsCol, orderBy('date', 'asc'));

      onSnapshot(q, (snap) => {
        /* ---- logs を取得 ---- */
        const logs: ProgressLog[] = [];
        snap.forEach((d) => {
          const { date, done } = d.data();
          logs.push({ date, done });
        });

        /* ---- データ点作成 ---- */
        const totalDays =
          dayjs(mat.deadline).diff(dayjs(mat.startDate), 'day') + 1;
        const idealPerDay = mat.totalCount / totalDays;

        const points: GraphDataPoint[] = [];

        /* (0) ベースライン（開始日前日） */
        points.push({
          date: dayjs(mat.startDate).subtract(1, 'day').format('M/D'),
          actual: mat.totalCount,
          ideal: mat.totalCount,
        });

        /* (1) 開始日〜終了日 */
        for (let i = 0; i < totalDays; i++) {
          const cur = dayjs(mat.startDate).add(i, 'day');
          const log = logs.find((l) =>
            dayjs(l.date).isSame(cur, 'day'),
          );

          const actual = log
            ? Math.max(mat.totalCount - log.done, 0)
            : null; // 未入力日は線を切る

          const ideal = Math.max(
            mat.totalCount - Math.round(idealPerDay * (i + 1)),
            0,
          );

          points.push({
            date: cur.format('M/D'),
            actual,
            ideal,
          });
        }

        setGraphs((prev) => ({ ...prev, [mat.id]: points }));
      });
    });
  }, [materials, uid]);

  /* ---------- (3) 画面 ---------- */
  return (
    <main className="mx-auto max-w-2xl p-4 space-y-8">
      <h1 className="text-xl font-bold">進捗グラフ</h1>

      {materials.map((mat) => (
        <GraphCard
          key={mat.id}
          material={mat}
          data={graphs[mat.id] || []}
        />
      ))}

      {materials.length === 0 && (
        <p className="text-center text-sm text-gray-500">
          登録された教材がありません
        </p>
      )}
    </main>
  );
}
