import dayjs from 'dayjs';

import type { Material } from '@/src/models/material/types';
import type { ProgressLog } from '@/src/models/progress/progressLogRepository';

export interface GraphDataPoint {
  date: string;
  actual: number | null;
  ideal: number | null;
}

export function buildGraphPoints(material: Material, logs: ProgressLog[]): GraphDataPoint[] {
  if (!material.startDate || !material.deadline) {
    return [];
  }

  const start = dayjs(material.startDate);
  const deadline = dayjs(material.deadline);
  const totalDays = deadline.diff(start, 'day') + 1;
  if (totalDays <= 0) return [];

  const idealPerDay = material.totalCount / totalDays;
  const points: GraphDataPoint[] = [];

  points.push({
    date: start.subtract(1, 'day').format('M/D'),
    actual: material.totalCount,
    ideal: material.totalCount,
  });

  for (let i = 0; i < totalDays; i += 1) {
    const current = start.add(i, 'day');
    const log = logs.find(({ date }) => dayjs(date).isSame(current, 'day'));
    const actual = log ? Math.max(material.totalCount - log.done, 0) : null;
    const ideal = Math.max(
      material.totalCount - Math.round(idealPerDay * (i + 1)),
      0,
    );

    points.push({
      date: current.format('M/D'),
      actual,
      ideal,
    });
  }

  return points;
}

export function filterToIsoWeek(points: GraphDataPoint[], baseDate = dayjs()): GraphDataPoint[] {
  const monday = baseDate.startOf('isoWeek');
  const labels = Array.from({ length: 7 }, (_, index) => monday.add(index, 'day').format('M/D'));
  const map = new Map(points.map(point => [point.date, point] as const));

  const firstIndex = labels.findIndex(label => map.has(label));
  let lastIdeal = firstIndex >= 0 ? map.get(labels[firstIndex])?.ideal ?? 0 : 0;

  return labels.map((label, index) => {
    const match = map.get(label);
    if (match) {
      lastIdeal = match.ideal ?? lastIdeal;
      return match;
    }

    if (index < firstIndex || firstIndex < 0) {
      return { date: label, actual: null, ideal: null };
    }

    return { date: label, actual: null, ideal: lastIdeal };
  });
}
