import { MaterialServiceImpl } from '@/src/models/material/materialService';
import type { MaterialRepository } from '@/src/models/material/materialRepository';
import type { Material, MaterialDraft, MaterialUpdate } from '@/src/models/material/types';

class InMemoryMaterialRepo implements MaterialRepository {
  store: Record<string, Material[]> = {};

  async create(uid: string, data: MaterialDraft): Promise<string> {
    const id = 'm_' + Math.random().toString(36).slice(2, 8);
    const next: Material = {
      id,
      title: data.title,
      subject: data.subject,
      unitType: data.unitType,
      totalCount: data.totalCount,
      dailyPlan: data.dailyPlan,
      completed: 0,
      startDate: data.startDate,
      deadline: data.deadline,
    };

    this.store[uid] = [...(this.store[uid] ?? []), next];
    return id;
  }

  async update(uid: string, id: string, data: MaterialUpdate): Promise<void> {
    this.store[uid] = (this.store[uid] ?? []).map(item =>
      item.id === id ? { ...item, ...data } : item,
    );
  }

  async delete(uid: string, id: string): Promise<void> {
    this.store[uid] = (this.store[uid] ?? []).filter(item => item.id !== id);
  }

  listenAll(): () => void {
    return () => {};
  }
}

describe('MaterialService', () => {
  it('creates a material with validation', async () => {
    const repo = new InMemoryMaterialRepo();
    const svc = new MaterialServiceImpl(repo);
    const id = await svc.createMaterial({
      uid: 'u1',
      title: 'Math Book',
      unitType: 'pages',
      totalCount: 100,
      startDate: '2025-01-01',
      deadline: '2025-01-10',
      dailyPlan: 10,
      subject: 'math',
    });
    expect(id).toMatch(/^m_/);
  });

  it('rejects invalid date range', async () => {
    const repo = new InMemoryMaterialRepo();
    const svc = new MaterialServiceImpl(repo);
    await expect(
      svc.createMaterial({
        uid: 'u1',
        title: 'X',
        unitType: 'pages',
        totalCount: 10,
        startDate: '2025-01-10',
        deadline: '2025-01-01',
        dailyPlan: 1,
        subject: 'math',
      })
    ).rejects.toThrow('invalid date range');
  });
});
