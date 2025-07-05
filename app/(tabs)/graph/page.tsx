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
import isoWeek from 'dayjs/plugin/isoWeek';
import isBetween from 'dayjs/plugin/isBetween';
import classNames from 'classnames';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

import { db } from '@/lib/firebase';
import GraphCard, { GraphDataPoint } from '@/components/GraphCard';
import { unitLabel } from '@/components/StudyMaterialCard';

/* ---------- 型定義 ---------- */
interface Material {
  id: string;
  title: string;
  totalCount: number;
  unitType: keyof typeof unitLabel;
  startDate: string; // YYYY-MM-DD
  deadline: string; // YYYY-MM-DD
  subject: string;
}

interface ProgressLog {
  date: string; // YYYY-MM-DD
  done: number; // 累積完了数
}

export default function ProgressGraphPage() {
  const uid = 'demoUser'; // TODO: 認証と接続
  const [materials, setMaterials] = useState<Material[]>([]);
  const [graphs, setGraphs] = useState<Record<string, GraphDataPoint[]>>({});
  const [range, setRange] = useState<'all' | 'week'>('all');

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
      const logsCol = collection(db, 'users', uid, 'materials', mat.id, 'logs');
      const q = query(logsCol, orderBy('date', 'asc'));

      onSnapshot(q, (snap) => {
        /* ---- logs を取得 ---- */
        const logs: ProgressLog[] = [];
        snap.forEach((d) => {
          const { date, done } = d.data();
          logs.push({ date, done });
        });

        /* ---- データ点作成 ---- */
        const totalDays = dayjs(mat.deadline).diff(dayjs(mat.startDate), 'day') + 1;
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
          const log = logs.find((l) => dayjs(l.date).isSame(cur, 'day'));

          const actual = log ? Math.max(mat.totalCount - log.done, 0) : null; // 未入力日は線を切る

          const ideal = Math.max(mat.totalCount - Math.round(idealPerDay * (i + 1)), 0);

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

  /* ---------- (3) ヘルパ：週次ポイントを 7 日分にパディング ---------- */
    
  const getCurrentWeekPoints = (
    source: GraphDataPoint[],
  ): GraphDataPoint[] => {
    const monday = dayjs().startOf('isoWeek');
    const labels = Array.from({ length: 7 }, (_, i) =>
      monday.add(i, 'day').format('M/D'),
    );

    const map = new Map(source.map((p) => [p.date, p]));

    // 週内で最初にデータが入っている index を取得
    const firstIdx = labels.findIndex((l) => map.has(l));
    let lastIdeal = firstIdx >= 0 ? map.get(labels[firstIdx])!.ideal : 0;

    return labels.map((label, idx) => {
      const found = map.get(label);
      if (found) {
        lastIdeal = found.ideal; // 直前 ideal を更新
        return found;
      }

      // 開始日前 (まだ学習スタートしていない日) は線を描かない
      if (idx < firstIdx) {
        return { date: label, actual: null, ideal: null };
      }

      // それ以降は直前の ideal をコピーして折れ線を保つ
      return { date: label, actual: null, ideal: lastIdeal };
    });
  };


  /* ---------- (4) 画面 ---------- */
  return (
    <main className="mx-auto w-full max-w-none p-4 space-y-8 md:max-w-3xl">
      <h1 className="text-xl font-bold">進捗グラフ</h1>

      {/* 表示範囲タブ */}
      <div className="mb-6 flex space-x-2 border-b">
        {(['all', 'week'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setRange(t)}
            className={classNames(
              'px-4 py-2 text-sm font-semibold',
              range === t ? 'border-b-2 border-indigo-500 text-indigo-600' : 'text-gray-400 hover:text-indigo-600'
            )}
          >
            {t === 'all' ? '全期間' : '1週間'}
          </button>
        ))}
      </div>

      {materials.map((mat) => {
        const allPoints = graphs[mat.id] ?? [];
        const data = range === 'all' ? allPoints : getCurrentWeekPoints(allPoints);

        return <GraphCard key={mat.id} material={mat} data={data} />;
      })}

      {materials.length === 0 && <p className="text-center text-sm text-gray-500">登録された教材がありません</p>}
    </main>
  );
}
