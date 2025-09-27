import { ProgressServiceImpl } from '@/src/models/progress/progressService';
import type { ProgressRepository } from '@/src/models/progress/progressRepository';

class InMemoryProgressRepo implements ProgressRepository {
  logs: any[] = [];
  matCompleted: Record<string, number> = {};
  async updateTodoItem(params: any): Promise<void> { this.logs.push(['todo', params]); }
  async incrementMaterialCompleted({ uid, materialId, delta }: any): Promise<number> {
    const key = `${uid}:${materialId}`;
    const before = this.matCompleted[key] ?? 0;
    const after = before + delta;
    this.matCompleted[key] = after;
    this.logs.push(['inc', { uid, materialId, delta, after }]);
    return after;
  }
  async setMaterialLog(params: any): Promise<void> { this.logs.push(['log', params]); }
}

describe('ProgressService', () => {
  it('computes delta and writes log with doneAfter', async () => {
    const repo = new InMemoryProgressRepo();
    const svc = new ProgressServiceImpl(repo);
    await svc.saveProgress({
      uid: 'u1', materialId: 'm1', newStart: 21, newEnd: 25, prevStart: 11, prevEnd: 15,
    });
    // prevSpan=5, newSpan=5 => delta=0, doneAfter equals before
    // First call will set after=0 in this in-memory impl.
    expect(repo.logs.find((x) => x[0] === 'todo')).toBeTruthy();
    const inc = repo.logs.find((x) => x[0] === 'inc');
    expect(inc[1].delta).toBe(0);
    const log = repo.logs.find((x) => x[0] === 'log');
    expect(typeof log[1].dateKey).toBe('string');
    expect(typeof log[1].dateISO).toBe('string');
    expect(typeof log[1].doneAfter).toBe('number');
  });
});
