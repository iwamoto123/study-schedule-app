import type { Material, MaterialDraft, MaterialUpdate } from '@/src/models/material/types';

export interface MaterialRepository {
  create(uid: string, data: MaterialDraft): Promise<string>;
  update(uid: string, id: string, data: MaterialUpdate): Promise<void>;
  delete(uid: string, id: string): Promise<void>;
  listenAll(uid: string, callback: (materials: Material[]) => void): () => void;
}
