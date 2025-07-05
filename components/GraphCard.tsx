'use client';

import React from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Label,
  ReferenceLine,
} from 'recharts';
import dayjs from 'dayjs';
import { unitLabel, subjectLabel } from '@/components/StudyMaterialCard';

/* ------------------------------------------------------------------
 * 型定義
 * ---------------------------------------------------------------- */
export type GraphDataPoint = {
  date: string;          // X 軸ラベル (M/D)
  actual: number | null; // 残数（累積）
  ideal: number;         // 理想残数（累積）
  daily?: number | null; // 当日クリア量
};

type Props = {
  material: {
    title: string;
    subject: string;
    totalCount: number;
    unitType: keyof typeof unitLabel;
    startDate: string;  // YYYY-MM-DD
    deadline: string;   // YYYY-MM-DD
  };
  data: GraphDataPoint[];
};

/* ------------------------------------------------------------------
 * ユーティリティ
 * ---------------------------------------------------------------- */
const weekdaysJp = ['日', '月', '火', '水', '木', '金', '土'];

// X 軸カスタム Tick: 日付 + 曜日を 2 行で描画
const DateWeekTick = ({ x, y, payload }: any) => {
  const dateStr = payload.value; // "M/D"
  // 年を適当に補完（今年で OK）
  const d       = dayjs(`${dayjs().year()}/${dateStr}`, 'YYYY/M/D');
  const w       = weekdaysJp[d.day()];
  return (
    <text x={x} y={y + 8} textAnchor="middle" fontSize={12} fill="#374151">
      <tspan x={x} dy="-0.2em">{dateStr}</tspan>
      <tspan x={x} dy="1.1em">{w}</tspan>
    </text>
  );
};

/* ------------------------------------------------------------------
 * Component
 * ---------------------------------------------------------------- */
export default function GraphCard({ material, data }: Props) {
  /* ======= メタ計算 ======= */
  const { title, subject, totalCount, unitType, deadline } = material;
  const recent      = [...data].reverse().find(p => p.actual !== null);
  const idealToday  = data.find(d => d.date === dayjs().format('M/D'))?.ideal;
  const actualToday = recent?.actual ?? totalCount;
  const daysLeft    = Math.max(1, dayjs(deadline).diff(dayjs(), 'day') + 1);
  const todayTarget = Math.ceil(actualToday / daysLeft);

  /* 差分メッセージ */
  let message: React.ReactNode = null;
  if (idealToday !== undefined) {
    const diff = actualToday - idealToday;
    if (diff > 0) {
      const newDaily = Math.ceil(actualToday / daysLeft);
      message = (
        <>
          <span className="font-semibold text-red-600">
            目標ペースより&nbsp;{diff}&nbsp;{unitLabel[unitType]}&nbsp;遅れています！
          </span>
          <br />
          計画に追いつくには 1⽇ {newDaily} {unitLabel[unitType]}
        </>
      );
    } else if (diff < 0) {
      message = (
        <span className="font-semibold text-green-600">
          目標ペースより&nbsp;{Math.abs(diff)}&nbsp;{unitLabel[unitType]}&nbsp;早いです！ その調子！
        </span>
      );
    } else {
      message = (
        <span className="font-semibold text-emerald-600">
          計画通りです！ その調子！
        </span>
      );
    }
  }

  /* ======= 日次データ ======= */
  const chartData = data.map((p, i) => {
    const prev  = i > 0 ? data[i - 1] : undefined;
    const daily = prev?.actual != null && p.actual != null ? Math.max(prev.actual - p.actual, 0) : null;
    return { ...p, daily };
  });

  const maxDaily = Math.max(...chartData.map(d => d.daily ?? 0));
  const rightMax = Math.max(maxDaily, todayTarget * 2) || 1;

  /* ======= 軸目盛り（ticks） ======= */
  // --- 左 Y 軸（残数：最大値から 4 分割）
  const yTicks = React.useMemo(() => {
    if (!totalCount) return [0];
    const step = totalCount / 4;
    return Array.from({ length: 5 }, (_, i) => Math.round(i * step)); // 0, 1/4, 1/2, 3/4, 最大
  }, [totalCount]);

  // --- X 軸（日付）
  const xTicks = React.useMemo(() => {
    const max = 10; // ラベル表示は最大 10 本程度
    if (chartData.length <= max) return chartData.map(d => d.date);
    const step = Math.ceil(chartData.length / max);
    return chartData.filter((_, i) => i % step === 0).map(d => d.date);
  }, [chartData]);

  /* ======= 表示 ======= */
  return (
    <div className="space-y-2 rounded-lg border bg-white p-4 shadow-sm">
      {/* 科目ラベル */}
      <p className="text-center text-sm font-medium text-indigo-600">
        {subjectLabel[subject as keyof typeof subjectLabel]}
      </p>

      {/* 教材タイトル */}
      <h2 className="text-center text-lg font-semibold">{title}</h2>

      {/* メタ情報 */}
      <p className="text-center text-sm text-gray-500">
        1⽇の⽬標ペース：{todayTarget}&nbsp;
        {unitLabel[unitType]}&nbsp;|&nbsp;合計：
        {totalCount}&nbsp;{unitLabel[unitType]}
      </p>

      {/* グラフ */}
      <ResponsiveContainer width="100%" height={290}>
        <ComposedChart data={chartData} margin={{ top: 32, right: 50, left: 20, bottom: 20 }}>
          {/* ---------- グリッド ---------- */}
          <CartesianGrid
            stroke="#e5e7eb"
            strokeDasharray="3 3"
            horizontal={false}
            
          />

          {/* ---------- 横線（残数） ---------- */}
          {yTicks.map(v => (
            <ReferenceLine key={`h-${v}`} yAxisId="left" y={v} stroke="#e5e7eb" strokeDasharray="3 3" />
          ))}

          {/* ---------- 1 日の予定ライン ---------- */}
          {todayTarget > 0 && (
            <ReferenceLine yAxisId="right" y={todayTarget} stroke="#bbf7d0" />
          )}

          {/* X 軸 */}
          <XAxis
            dataKey="date"
            ticks={xTicks}
            tick={<DateWeekTick />}   /* ← ここでカスタム Tick */
            axisLine={{ stroke: '#374151' }}
            tickLine={false}
            height={40}                /* 2 行分スペース確保 */
          />

          {/* 左 Y 軸 */}
          <YAxis
            yAxisId="left"
            domain={[0, totalCount]}
            ticks={yTicks}
            allowDecimals={false}
            fontSize={12}
            tick={{ fill: '#374151', dx: -4 }}
            axisLine={{ stroke: '#374151' }}
            tickLine={false}
          >
            <Label value="残ページ" position="top" offset={10} style={{ fill: '#374151', fontSize: 12 }} />
          </YAxis>

          {/* 右 Y 軸 */}
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, rightMax]}
            allowDecimals={false}
            fontSize={12}
            tick={{ fill: '#86efac', dx: 4 }}
            axisLine={{ stroke: '#86efac' }}
            tickLine={false}
          >
            <Label value="日々の進捗" position="top" offset={10} style={{ fill: '#86efac', fontSize: 12 }} />
          </YAxis>

          {/* ツールチップ */}
          <Tooltip
            wrapperStyle={{ zIndex: 10 }}
            formatter={(value, name) => {
              if (name === 'daily') return [`${value} ${unitLabel[unitType]}`, '今日の進捗'];
              if (name === 'actual') return [`残り ${value}`, '実残'];
              if (name === 'ideal') return [`残り ${value}`, '理想'];
              return [value, name];
            }}
          />

          {/* 棒グラフ：日々の進捗 */}
          <Bar yAxisId="right" dataKey="daily" barSize={18} fill="#bbf7d0" radius={[2, 2, 0, 0]} />

          {/* Baseline (y=0) */}
          <ReferenceLine yAxisId="right" y={0} stroke="#374151" strokeWidth={1} />

          {/* 折れ線：理想 & 実績 */}
          <Line yAxisId="left" type="monotone" dataKey="ideal" stroke="#a1a1aa" strokeDasharray="5 5" dot={false} connectNulls />
          <Line yAxisId="left" type="monotone" dataKey="actual" stroke="#22c55e" strokeWidth={2} dot={{ r: 2 }} />
        </ComposedChart>
      </ResponsiveContainer>

      {/* 差分メッセージ */}
      {message && <p className="mt-2 text-center text-sm">{message}</p>}
    </div>
  );
}
