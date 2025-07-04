///components/TomorrowPlan

'use client';

import React from 'react';
import { unitLabel } from '@/components/StudyMaterialCard';

/* -----------------------------------------
   明日の予定カード（ProgressSummary と同じカード枠内で箇条書き）
----------------------------------------- */
export type TomorrowPlanItem = {
  id: string;
  title: string;
  unitType: string;
  planStart: number;
  planEnd: number;
};

export default function TomorrowPlan({ items }: { items: TomorrowPlanItem[] }) {
  if (!items?.length) return null;

  return (
    <section className="mt-6 w-full rounded-lg border bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-gray-900">明日の予定</h2>

      <ul className="space-y-1 text-sm font-medium text-gray-800">
        {items.map(({ id, title, unitType, planStart, planEnd }) => {
          const unit = unitLabel[unitType as keyof typeof unitLabel] ?? '';
          return (
            <li
              key={id}
              className="flex justify-between border-t first:border-t-0 pt-1"
            >
              {/* 教材名 */}
              <span className="w-1/2 truncate pr-2">{title}</span>
              {/* 明日の予定 */}
              <span className="w-1/2 text-right text-gray-700">
              {planStart === planEnd
                ? `p. ${planStart} ${unit}`
                : `p. ${planStart} 〜 ${planEnd} ${unit}`}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
