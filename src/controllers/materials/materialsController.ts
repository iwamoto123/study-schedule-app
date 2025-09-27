import type { Material } from '@/src/models/material/types';
import type { MaterialService } from '@/src/models/material/materialService';
import type { MaterialRepository } from '@/src/models/material/materialRepository';
import type { CreateMaterialInput } from '@/src/models/material/materialService';

export interface MaterialCreatePayload extends Omit<CreateMaterialInput, 'uid'> {}

export interface MaterialUpdatePayload extends Partial<CreateMaterialInput> {}

export class MaterialsController {
  constructor(
    private readonly service: MaterialService,
    private readonly repository: MaterialRepository,
  ) {}

  listenAll(uid: string, callback: (materials: Material[]) => void): () => void {
    return this.repository.listenAll(uid, callback);
  }

  async create(uid: string, payload: MaterialCreatePayload): Promise<string> {
    return this.service.createMaterial({ uid, ...payload });
  }

  async update(uid: string, id: string, payload: MaterialUpdatePayload): Promise<void> {
    await this.service.updateMaterial(uid, id, payload);
  }

  async delete(uid: string, id: string): Promise<void> {
    await this.repository.delete(uid, id);
  }
}
