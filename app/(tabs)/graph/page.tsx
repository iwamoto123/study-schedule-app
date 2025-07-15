// app/graph/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  collection, onSnapshot, query, orderBy,
} from 'firebase/firestore';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isBetween from 'dayjs/plugin/isBetween';
import classNames from 'classnames';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

import { db } from '@/lib/firebase';
import GraphCard, { GraphDataPoint } from '@/components/GraphCard';
import { calcTodayPlan }            from '@/lib/calcTodayPlan';
import type { Material }            from '@/types/material';

/* ── logs サブコレクションの型 ── */
interface ProgressLog {
  date: string; // YYYY-MM-DD
  done: number; // 累積完了数
}

export default function ProgressGraphPage() {
  const uid = 'demoUser';
  const [materials, setMaterials] = useState<Material[]>([]);
  const [graphs,    setGraphs]    = useState<Record<string, GraphDataPoint[]>>({});
  const [range,     setRange]     = useState<'all' | 'week'>('all');

  /* ────────────────────────────
   * (1) materials 購読
   * ──────────────────────────── */
  useEffect(() => {
    const matsCol = collection(db, 'users', uid, 'materials');
    const q       = query(matsCol, orderBy('createdAt', 'asc'));

    const unsub = onSnapshot(q, snap => {
      const list: Material[] = [];
      snap.forEach(doc => {
        const d = doc.data();
        if (d.startDate && d.deadline) {
          const m: Material = {
            id:         doc.id,
            title:      d.title,
            totalCount: d.totalCount,
            unitType:   d.unitType,
            startDate:  d.startDate,
            deadline:   d.deadline,
            subject:    d.subject,
            completed:  d.completed   ?? 0,
            dailyPlan:  d.dailyPlan   ?? 0,   // ★ 追加で必ず補完
          };
          m.todayPlan = calcTodayPlan(m);      // 今日時点ノルマ
          list.push(m);
        }
      });
      setMaterials(list);
    });

    return () => unsub();
  }, [uid]);

  /* ────────────────────────────
   * (2) logs → グラフデータ
   * ──────────────────────────── */
  useEffect(() => {
    if (materials.length === 0) return;

    materials.forEach(mat => {
      const logsCol = collection(db, 'users', uid, 'materials', mat.id, 'logs');
      const q       = query(logsCol, orderBy('date', 'asc'));

      onSnapshot(q, snap => {
        /* ---- logs を取得 ---- */
        const logs: ProgressLog[] = [];
        snap.forEach(d => logs.push(d.data() as ProgressLog));

        /* ---- グラフ用データ点 ---- */
        const totalDays   = dayjs(mat.deadline).diff(dayjs(mat.startDate), 'day') + 1;
        const idealPerDay = mat.totalCount / totalDays;
        const pts: GraphDataPoint[] = [];

        // 開始日前日を 0 点目
        pts.push({
          date:   dayjs(mat.startDate).subtract(1, 'day').format('M/D'),
          actual: mat.totalCount,
          ideal:  mat.totalCount,
        });

        for (let i = 0; i < totalDays; i++) {
          const cur   = dayjs(mat.startDate).add(i, 'day');
          const log   = logs.find(l => dayjs(l.date).isSame(cur, 'day'));
          const actual = log ? Math.max(mat.totalCount - log.done, 0) : null;
          const ideal  = Math.max(mat.totalCount - Math.round(idealPerDay * (i + 1)), 0);

          pts.push({ date: cur.format('M/D'), actual, ideal });
        }

        setGraphs(prev => ({ ...prev, [mat.id]: pts }));
      });
    });
  }, [materials, uid]);

  /* ────────────────────────────
   * 週次ポイントを 7 日にパディング
   * ──────────────────────────── */
  const getCurrentWeekPoints = (src: GraphDataPoint[]): GraphDataPoint[] => {
    const monday = dayjs().startOf('isoWeek');
    const labels = Array.from({ length: 7 }, (_, i) => monday.add(i, 'day').format('M/D'));
    const map    = new Map(src.map(p => [p.date, p]));

    const firstIdx  = labels.findIndex(l => map.has(l));
    let   lastIdeal = firstIdx >= 0 ? map.get(labels[firstIdx])!.ideal : 0;

    return labels.map((label, idx) => {
      const found = map.get(label);
      if (found) {
        lastIdeal = found.ideal;
        return found;
      }
      if (idx < firstIdx) return { date: label, actual: null, ideal: null };
      return { date: label, actual: null, ideal: lastIdeal };
    });
  };

  /* ────────────────────────────
   * 画面
   * ──────────────────────────── */
  return (
    <main className="mx-auto w-full max-w-none p-4 space-y-8 md:max-w-3xl">
      <h1 className="text-xl font-bold">進捗グラフ</h1>

      {/* 表示範囲タブ */}
      <div className="mb-6 flex space-x-2 border-b">
        {(['all', 'week'] as const).map(t => (
          <button
            key={t}
            onClick={() => setRange(t)}
            className={classNames(
              'px-4 py-2 text-sm font-semibold',
              range === t
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-400 hover:text-indigo-600',
            )}
          >
            {t === 'all' ? '全期間' : '1週間'}
          </button>
        ))}
      </div>

      {materials.map(mat => {
        const allPts = graphs[mat.id] ?? [];
        const data   = range === 'all' ? allPts : getCurrentWeekPoints(allPts);
        return <GraphCard key={mat.id} material={mat} data={data} />;
      })}

      {materials.length === 0 && (
        <p className="text-center text-sm text-gray-500">登録された教材がありません</p>
      )}
    </main>
  );
}
