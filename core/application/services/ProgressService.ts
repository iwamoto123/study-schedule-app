import dayjs from 'dayjs';
import { ProgressRepository } from '../ports/ProgressRepository';

export interface SaveProgressInput {
  uid: string;
  materialId: string;
  newStart: number;
  newEnd: number;
  prevStart: number | null;
  prevEnd: number | null;
}

export interface ProgressService {
  saveProgress(input: SaveProgressInput): Promise<void>;
}

export class ProgressServiceImpl implements ProgressService {
  constructor(private readonly repo: ProgressRepository) {}

  async saveProgress({ uid, materialId, newStart, newEnd, prevStart, prevEnd }: SaveProgressInput): Promise<void> {
    if (!uid || !materialId) throw new Error('uid and materialId required');
    if (newStart > newEnd) throw new Error('invalid range: newStart > newEnd');

    const dateKey = dayjs().format('YYYYMMDD');
    const dateISO = dayjs().format('YYYY-MM-DD');

    await this.repo.updateTodoItem({ uid, dateKey, materialId, doneStart: newStart, doneEnd: newEnd });

    const prevSpan = prevStart !== null && prevEnd !== null ? prevEnd - prevStart + 1 : 0;
    const newSpan = newEnd - newStart + 1;
    const delta = newSpan - prevSpan;

    const doneAfter = await this.repo.incrementMaterialCompleted({ uid, materialId, delta });
    await this.repo.setMaterialLog({ uid, materialId, dateKey, dateISO, doneAfter });
  }
}

