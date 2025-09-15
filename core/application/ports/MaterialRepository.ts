import type { Material } from '../../domain/material';

export interface MaterialRepository {
  create(uid: string, data: Omit<Material, 'id' | 'completed'> & { completed?: number }): Promise<string>;
  update(uid: string, id: string, data: Partial<Omit<Material, 'id'>>): Promise<void>;
}

