import { MaterialServiceImpl } from '@/core/application/services/MaterialService';
import type { MaterialRepository } from '@/core/application/ports/MaterialRepository';

class InMemoryMaterialRepo implements MaterialRepository {
  store: Record<string, any[]> = {};
  async create(uid: string, data: any): Promise<string> {
    const id = 'm_' + Math.random().toString(36).slice(2, 8);
    if (!this.store[uid]) this.store[uid] = [];
    this.store[uid].push({ ...data, id, completed: 0 });
    return id;
  }
  async update(uid: string, id: string, data: any): Promise<void> {
    const arr = this.store[uid] || [];
    const idx = arr.findIndex((m) => m.id === id);
    if (idx >= 0) arr[idx] = { ...arr[idx], ...data };
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

