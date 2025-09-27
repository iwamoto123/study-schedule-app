import type { Subject, UnitType } from '@/src/models/shared/academics';

export interface TodoItem {
  id: string;
  title: string;
  subject: Subject;
  unitType: UnitType;

  planCount: number;

  // 以下は UI 計算用なので optional にしてもOK
  plannedStart?: number;
  plannedEnd?:   number;
  totalStart?:   number;
  totalEnd?:     number;

  doneStart: number | null;
  doneEnd:   number | null;
}
