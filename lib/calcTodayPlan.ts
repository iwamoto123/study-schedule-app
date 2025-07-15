// lib/calcTodayPlan.ts
import dayjs from 'dayjs';
import type { Material } from '@/types/material';

/**
 * @param mat       学習教材
 * @param baseDate  ノルマ計算の基準日（デフォルト＝今日）
 * @return          その日のノルマ（ページ・問題数など）
 */
export const calcTodayPlan = (
  mat: Pick<Material, 'totalCount' | 'completed' | 'deadline'>,
  baseDate: dayjs.Dayjs = dayjs(),
) => {
  const completed = mat.completed ?? 0;
  const remaining = Math.max(mat.totalCount - completed, 0);

  // ---- 基準日と締切日を 0:00 にそろえて差分日数を算出 ----
  const daysLeft = Math.max(
    1,
    dayjs(mat.deadline).startOf('day').diff(baseDate.startOf('day'), 'day') + 1,
  );

  return Math.ceil(remaining / daysLeft);
};
