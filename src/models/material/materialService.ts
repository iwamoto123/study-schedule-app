import dayjs from 'dayjs';
import type { MaterialRepository } from '@/src/models/material/materialRepository';
import type { MaterialDraft, MaterialUpdate, Subject, UnitType } from '@/src/models/material/types';

export interface CreateMaterialInput {
  uid: string;
  title: string;
  unitType: UnitType;
  totalCount: number;
  startDate: string;
  deadline: string;
  dailyPlan: number;
  subject: Subject;
}

export interface MaterialService {
  createMaterial(input: CreateMaterialInput): Promise<string>;
  updateMaterial(uid: string, id: string, data: Partial<CreateMaterialInput>): Promise<void>;
}

export class MaterialServiceImpl implements MaterialService {
  constructor(private readonly repo: MaterialRepository) {}

  async createMaterial(input: CreateMaterialInput): Promise<string> {
    if (!input.uid) throw new Error('uid required');
    if (!input.title) throw new Error('title required');
    if (!input.startDate || !input.deadline) throw new Error('date range required');

    const days = dayjs(input.deadline).diff(dayjs(input.startDate), 'day') + 1;
    if (days <= 0) throw new Error('invalid date range');
    if (input.dailyPlan <= 0) throw new Error('dailyPlan must be > 0');

    const payload: MaterialDraft = {
      title: input.title,
      unitType: input.unitType,
      totalCount: input.totalCount,
      startDate: input.startDate,
      deadline: input.deadline,
      dailyPlan: input.dailyPlan,
      subject: input.subject,
    };

    return this.repo.create(input.uid, payload);
  }

  async updateMaterial(uid: string, id: string, data: Partial<CreateMaterialInput>): Promise<void> {
    if (!uid || !id) throw new Error('uid and id required');

    const { startDate, deadline } = data;
    if (startDate && deadline) {
      const days = dayjs(deadline).diff(dayjs(startDate), 'day') + 1;
      if (days <= 0) throw new Error('invalid date range');
    }

    const { uid: _omit, ...rest } = data;
    await this.repo.update(uid, id, rest as MaterialUpdate);
  }
}
