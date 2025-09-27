import type { Material } from '@/src/models/material/types';
import type { MaterialRepository } from '@/src/models/material/materialRepository';
import type { ProgressService } from '@/src/models/progress/progressService';
import type { TodoItem } from '@/src/models/todo/todoEntity';
import type { TodoRepository } from '@/src/models/todo/todoRepository';

export interface SaveProgressPayload {
  materialId: string;
  newStart: number;
  newEnd: number;
  prevStart: number | null;
  prevEnd: number | null;
}

export class ProgressController {
  constructor(
    private readonly progressService: ProgressService,
    private readonly materialRepository: MaterialRepository,
    private readonly todoRepository: TodoRepository,
  ) {}

  listenMaterials(uid: string, callback: (materials: Material[]) => void): () => void {
    return this.materialRepository.listenAll(uid, callback);
  }

  listenTodos(uid: string, dateKey: string, callback: (todos: Record<string, TodoItem>) => void): () => void {
    return this.todoRepository.listenDaily(uid, dateKey, callback);
  }

  async saveProgress(uid: string, payload: SaveProgressPayload): Promise<void> {
    await this.progressService.saveProgress({
      uid,
      materialId: payload.materialId,
      newStart: payload.newStart,
      newEnd: payload.newEnd,
      prevStart: payload.prevStart,
      prevEnd: payload.prevEnd,
    });
  }
}
