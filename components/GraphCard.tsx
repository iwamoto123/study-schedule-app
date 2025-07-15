// components/GraphCard.tsx
'use client';

import React from 'react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Label, ReferenceLine,
} from 'recharts';
import dayjs from 'dayjs';
import { unitLabel, subjectLabel } from '@/components/StudyMaterialCard';
import type { Material } from '@/types/material';
import { calcTodayPlan } from '@/lib/calcTodayPlan';

/* ---------- 型 ---------- */
export type GraphDataPoint = {
  date: string;
  actual: number | null;
  ideal:  number | null;
  daily?: number | null;
};
type Props = { material: Material; data: GraphDataPoint[] };

/* ---------- util ---------- */
const weekJp = ['日', '月', '火', '水', '木', '金', '土'];
const DateWeekTick = ({ x, y, payload }: any) => {
  const d = dayjs(`${dayjs().year()}/${payload.value}`, 'YYYY/M/D');
  return (
    <text x={x} y={y + 8} textAnchor="middle" fontSize={12} fill="#374151">
      <tspan x={x} dy="-0.2em">{payload.value}</tspan>
      <tspan x={x} dy="1.1em">{weekJp[d.day()]}</tspan>
    </text>
  );
};

/* ---------- component ---------- */
export default function GraphCard({ material, data }: Props) {
  const { title, subject, totalCount, unitType, deadline } = material;
  const unit = unitLabel[unitType];

  /* ---- 日次・累計差分 ---- */
  const chartData = data.map((p, i) => ({
    ...p,
    daily:
      i > 0 && data[i - 1].actual != null && p.actual != null
        ? Math.max(data[i - 1].actual! - p.actual!, 0)
        : null,
  }));

  const todayLabel  = dayjs().format('M/D');
  const todayPoint  = chartData.find(d => d.date === todayLabel);
  const dailyToday  = todayPoint?.daily ?? 0;

  /* ---------- 今日の“最新”ノルマを再計算 ---------- */
  const remainedAtStart =
    todayPoint && todayPoint.actual != null
      ? todayPoint.actual + dailyToday // 今朝時点の残量
      : null;

  const todayTarget = remainedAtStart != null
    ? calcTodayPlan(
        {
          totalCount,
          completed: totalCount - remainedAtStart,
          deadline,
        },
        dayjs(),           // 今日を基準日に
      )
    : 0;

  const dailyDiff  = dailyToday - todayTarget;

  /* ---------- 累計差分 & 進捗率 ---------- */
  const recent         = [...data].reverse().find(p => p.actual !== null);
  const actualToday    = recent?.actual ?? totalCount;             // “残り”ページ数
  const completedToday = totalCount - actualToday;                 // 累積完了数
  const progressPct    = Math.min(100, Math.round((completedToday / totalCount) * 100));

  const idealToday  = todayPoint?.ideal ?? null;
  const cumDiff     = idealToday != null ? actualToday - idealToday : 0;

  /* ---------- 追い上げペース ---------- */
  const catchUpDaily = calcTodayPlan(
    { totalCount: actualToday, completed: 0, deadline },
    dayjs(),
  );

  /* ---------- メッセージ ---------- */
  const sign = (v: number) => (v > 0 ? `＋${v}` : v < 0 ? `-${Math.abs(v)}` : '±0');

  const msgToday = (
    <span
      className={
        dailyDiff > 0
          ? 'font-semibold text-green-600'
          : dailyDiff < 0
          ? 'font-semibold text-red-600'
          : 'font-semibold text-emerald-600'
      }
    >
      {`今日の予定との差：${sign(dailyDiff)}${unit}`}
      {dailyDiff > 0 ? '😆' : dailyDiff < 0 ? '😌' : '☺️'}
    </span>
  );

  let msgCum: React.ReactNode = null;
  if (idealToday != null) {
    msgCum =
      cumDiff > 0 ? (
        <>
          <span className="font-semibold text-red-600">
            目標より {cumDiff}
            {unit} 遅れています！
          </span>
          <br />
          計画に追いつくには 1⽇ {catchUpDaily} {unit}
        </>
      ) : cumDiff < 0 ? (
        <span className="font-semibold text-green-600">
          目標より {Math.abs(cumDiff)}
          {unit} 早いです！その調子！
        </span>
      ) : (
        <span className="font-semibold text-emerald-600">
          目標通りのペースです！その調子！
        </span>
      );
  }

  /* ---- 軸計算 ---- */
  const yTicks = React.useMemo(() => {
    if (!totalCount) return [0];
    const step = totalCount / 4;
    return Array.from({ length: 5 }, (_, i) => Math.round(i * step));
  }, [totalCount]);

  const xTicks = React.useMemo(() => {
    const max = 10;
    if (chartData.length <= max) return chartData.map(d => d.date);
    const step = Math.ceil(chartData.length / max);
    return chartData.filter((_, i) => i % step === 0).map(d => d.date);
  }, [chartData]);

  const maxDaily = Math.max(...chartData.map(d => d.daily ?? 0));
  const rightMax = Math.max(maxDaily, todayTarget * 2) || 1;

  /* ---- render ---- */
  return (
    <div className="space-y-2 p-0 sm:rounded-lg sm:border sm:bg-white sm:p-4 sm:shadow-sm">
      {/* タイトル */}
      <p className="text-center text-sm font-medium text-indigo-600">
        {subjectLabel[subject as keyof typeof subjectLabel]}
      </p>
      <h2 className="text-center text-lg font-semibold">{title}</h2>
      {/* ▼ ここを要望どおりの文言に変更 ▼ */}
      <p className="text-center text-sm text-gray-500">
        1⽇の⽬標ペース：{todayTarget}{unit}｜合計：{totalCount}{unit} ｜現在の進捗率 {progressPct}%
      </p>

      {/* グラフ */}
      <ResponsiveContainer width="100%" height={290}>
        <ComposedChart data={chartData} margin={{ top: 32, right: 0, left: -6, bottom: 20 }}>
          <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" horizontal={false} />
          {yTicks.map(v => (
            <ReferenceLine
              key={v}
              yAxisId="left"
              y={v}
              stroke="#e5e7eb"
              strokeDasharray="3 3"
            />
          ))}
          {todayTarget > 0 && (
            <ReferenceLine yAxisId="right" y={todayTarget} stroke="#bbf7d0" />
          )}
          <XAxis
            dataKey="date"
            ticks={xTicks}
            tick={<DateWeekTick />}
            axisLine={{ stroke: '#374151' }}
            tickLine={false}
            height={40}
          />
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
            <Label
              value={`残${unit}数`}
              position="top"
              offset={10}
              style={{ fill: '#374151', fontSize: 12 }}
            />
          </YAxis>
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
            <Label
              value="日々の進捗"
              position="top"
              offset={10}
              style={{ fill: '#86efac', fontSize: 12 }}
            />
          </YAxis>
          <Tooltip
            wrapperStyle={{ zIndex: 10 }}
            formatter={(v, name) => {
              if (name === 'daily') return [`${v} ${unit}`, '今日の進捗'];
              if (name === 'actual') return [`残り ${v}`, '実残'];
              if (name === 'ideal') return [`残り ${v}`, '理想'];
              return [v, name];
            }}
          />
          <Bar yAxisId="right" dataKey="daily" barSize={18} fill="#bbf7d0" radius={[2, 2, 0, 0]} />
          <ReferenceLine yAxisId="right" y={0} stroke="#374151" strokeWidth={1} />
          <Line
            yAxisId="left"
            type="linear"
            dataKey="ideal"
            stroke="#a1a1aa"
            strokeDasharray="5 5"
            dot={false}
            connectNulls
          />
          <Line
            yAxisId="left"
            type="linear"
            dataKey="actual"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 2 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* メッセージ */}
      <div className="mt-2 flex flex-col items-center space-y-1 text-sm">
        {msgToday}
        {msgCum}
      </div>
    </div>
  );
}
