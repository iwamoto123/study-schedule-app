import type { Subject, UnitType } from '@/src/models/shared/academics';

export type { Subject, UnitType } from '@/src/models/shared/academics';

export interface Material {
  id: string;
  title: string;
  subject: Subject;
  unitType: UnitType;
  totalCount: number;
  dailyPlan: number;
  completed: number;
  startDate?: string;
  deadline?: string;
  createdAt?: unknown;
  todayPlan?: number;
}

export interface MaterialDraft {
  title: string;
  subject: Subject;
  unitType: UnitType;
  totalCount: number;
  dailyPlan: number;
  startDate?: string;
  deadline?: string;
}

export type MaterialUpdate = Partial<Omit<Material, 'id'>>;
