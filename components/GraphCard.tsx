//components/GraphCard.tsx 

'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import dayjs from 'dayjs';
import { unitLabel, subjectLabel } from '@/components/StudyMaterialCard';

export type GraphDataPoint = {
  date: string;
  actual: number | null;
  ideal: number;
};

type Props = {
  material: {
    title: string;
    subject: string;
    totalCount: number;
    unitType: keyof typeof unitLabel;
    startDate: string;   // YYYY-MM-DD
    deadline: string;    // YYYY-MM-DD
  };
  data: GraphDataPoint[];
};

export default function GraphCard({ material, data }: Props) {
  const {
    title,
    subject,
    totalCount,
    unitType,
    startDate,
    deadline,
  } = material;

/* ---------- 進捗計算 ---------- */
// A) 最新の “actual が入っている” データ点
const recent = [...data].reverse().find(p => p.actual !== null);

// 残ページ数（実績が無ければ totalCount）
const todayRemaining = recent?.actual ?? totalCount;

// 残日数（今日含む）
const daysLeft = Math.max(
  1,
  dayjs(deadline).diff(dayjs(), "day") + 1
);
const todayTarget = Math.ceil(todayRemaining / daysLeft);

/* ---------- 遅れ / 先行 / 計画通り ---------- */
let message: React.ReactNode = null;

if (recent) {
  const diff = (recent.actual as number) - recent.ideal; // ±差分

  if (diff > 0) {
    /* ----- 遅れている ----- */
    const catchUpPerDay = Math.ceil(diff / daysLeft);
    message = (
      <>
        <span className="font-semibold text-red-600">
          目標ペースより&nbsp;{diff}&nbsp;{unitLabel[unitType]}
          &nbsp;遅れています！
        </span>
        <br />
        計画に追いつくには 1⽇&nbsp;
        {catchUpPerDay}&nbsp;{unitLabel[unitType]}
      </>
    );
  } else if (diff < 0) {
    /* ----- 先行している ----- */
    message = (
      <span className="font-semibold text-green-600">
        目標ペースより&nbsp;{Math.abs(diff)}&nbsp;
        {unitLabel[unitType]}&nbsp;早いです！ その調子！
      </span>
    );
  } else {
    /* ----- ぴったり計画通り ----- */
    message = (
      <span className="font-semibold text-emerald-600">
        計画通りです！ その調子！
      </span>
    );
  }
}




  /* ---------- 表示 ---------- */
  return (
    <div className="space-y-2 rounded-lg border bg-white p-4 shadow-sm">
      {/* 教科（中央） */}
      <p className="text-center text-sm font-medium text-indigo-600">
        {subjectLabel[subject as keyof typeof subjectLabel]}
      </p>

      {/* タイトル */}
      <h2 className="text-lg font-semibold text-center">{title}</h2>

      {/* メタ情報 */}
      <p className="text-sm text-gray-500 text-center">
        1⽇の⽬標ペース：{todayTarget}&nbsp;{unitLabel[unitType]}
        &nbsp;|&nbsp; 合計：{totalCount}&nbsp;{unitLabel[unitType]}
      </p>

      {/* グラフ */}
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" fontSize={12} />
          <YAxis
            domain={[0, totalCount]}
            fontSize={12}
            allowDecimals={false}
          />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="ideal"
            stroke="#ccc"
            strokeDasharray="5 5"
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ r: 2 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* 差分メッセージ */}
      {message && (
        <p className="mt-2 text-center text-sm">{message}</p>
      )}
    </div>
  );
}
