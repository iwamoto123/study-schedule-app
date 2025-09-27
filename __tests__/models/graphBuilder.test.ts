import dayjs from 'dayjs';

import { buildGraphPoints, filterToIsoWeek } from '@/src/models/progress/graphBuilder';
import type { Material } from '@/src/models/material/types';
import type { ProgressLog } from '@/src/models/progress/progressLogRepository';

describe('graphBuilder', () => {
  const material: Material = {
    id: 'mat-1',
    title: '物理',
    subject: 'physics',
    unitType: 'pages',
    totalCount: 100,
    dailyPlan: 10,
    completed: 0,
    startDate: '2025-01-01',
    deadline: '2025-01-05',
  };

  const logs: ProgressLog[] = [
    { date: '2025-01-01', done: 10 },
    { date: '2025-01-03', done: 40 },
  ];

  it('buildGraphPoints returns inclusive timeline with actual and ideal values', () => {
    const points = buildGraphPoints(material, logs);

    expect(points).toHaveLength(1 + 5); // start-1 + 5 days
    const firstDay = points.find((p) => p.date === dayjs('2025-01-01').format('M/D'));
    const thirdDay = points.find((p) => p.date === dayjs('2025-01-03').format('M/D'));

    expect(firstDay?.actual).toBe(90);
    expect(thirdDay?.actual).toBe(60);
    expect(thirdDay?.ideal).toBeGreaterThan(0);
  });

  it('filterToIsoWeek maps points onto current week', () => {
    const allPoints = buildGraphPoints(material, logs);
    const weekPoints = filterToIsoWeek(allPoints, dayjs('2025-01-03'));

    expect(weekPoints).toHaveLength(7);
    expect(weekPoints.some((p) => p.actual !== null)).toBe(true);
  });
});
