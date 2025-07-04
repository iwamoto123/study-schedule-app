///components/ProgressSummary

'use client';

import React from 'react';
import { unitLabel } from '@/components/StudyMaterialCard';

/* -----------------------------------------
   今日の進捗まとめテーブル
   props.items は ProgressPage の CardData[] のサブセットを渡す想定
----------------------------------------- */
export type ProgressSummaryItem = {
  id: string;
  title: string;
  unitType: string;
  plannedStart: number;
  plannedEnd: number;
  doneStart: number | null;
  doneEnd: number | null;
};

export default function ProgressSummary({ items }: { items: ProgressSummaryItem[] }) {
  if (!items?.length) return null;

  return (
    <section className="mt-6 w-full overflow-x-auto rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-gray-900">今日の進捗まとめ</h2>
      <table className="min-w-full table-fixed text-sm">
        <thead>
          <tr className="text-left text-gray-600">
            <th className="w-1/3 px-2 py-1">教材</th>
            <th className="w-1/3 px-2 py-1">今日の予定</th>
            <th className="w-1/3 px-2 py-1">入力済み進捗</th>
          </tr>
        </thead>
        <tbody>
          {items.map(({ id, title, unitType, plannedStart, plannedEnd, doneStart, doneEnd }) => {
            const unit = unitLabel[unitType as keyof typeof unitLabel] ?? '';
            const planned = plannedStart === plannedEnd 
             ? `p. ${plannedStart} ${unit}`
             : `p. ${plannedStart} 〜 ${plannedEnd} ${unit}`;
            const done =
              doneStart !== null && doneEnd !== null
                ? `p. ${doneStart} 〜 ${doneEnd} ${unit} ✅`
                : '（未入力）';
            return (
              <tr key={id} className="border-t font-medium text-gray-800">
                <td className="truncate px-2 py-1 align-top">{title}</td>
                <td className="px-2 py-1 align-top">{planned}</td>
                <td className="px-2 py-1 align-top">{done}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}
