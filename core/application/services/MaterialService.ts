import dayjs from 'dayjs';
import { MaterialRepository } from '../ports/MaterialRepository';

export interface CreateMaterialInput {
  uid: string;
  title: string;
  unitType: 'pages' | 'problems' | 'words' | 'chapters' | 'none';
  totalCount: number;
  startDate: string; // YYYY-MM-DD
  deadline: string;  // YYYY-MM-DD
  dailyPlan: number;
  subject: string;
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

    const id = await this.repo.create(input.uid, {
      id: '', // ignored by repo
      title: input.title,
      unitType: input.unitType,
      totalCount: input.totalCount,
      startDate: input.startDate,
      deadline: input.deadline,
      dailyPlan: input.dailyPlan,
      subject: input.subject as any,
      completed: 0,
    } as any);

    return id;
  }

  async updateMaterial(uid: string, id: string, data: Partial<CreateMaterialInput>): Promise<void> {
    if (!uid || !id) throw new Error('uid and id required');
    if (data.startDate && data.deadline) {
      const days = dayjs(data.deadline).diff(dayjs(data.startDate), 'day') + 1;
      if (days <= 0) throw new Error('invalid date range');
    }
    await this.repo.update(uid, id, data);
  }
}

