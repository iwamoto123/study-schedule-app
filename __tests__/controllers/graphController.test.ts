import { GraphController } from '@/src/controllers/graph/graphController';
import type { MaterialRepository } from '@/src/models/material/materialRepository';
import type { Material } from '@/src/models/material/types';
import type { ProgressLogRepository, ProgressLog } from '@/src/models/progress/progressLogRepository';

describe('GraphController', () => {
  const materialRepoMock: jest.Mocked<MaterialRepository> = {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    listenAll: jest.fn(),
  } as unknown as jest.Mocked<MaterialRepository>;

  const logRepoMock: jest.Mocked<ProgressLogRepository> = {
    listen: jest.fn(),
  } as unknown as jest.Mocked<ProgressLogRepository>;

  const controller = new GraphController(materialRepoMock, logRepoMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('listens to materials via repository', () => {
    const unsubscribe = jest.fn();
    const materials: Material[] = [];

    materialRepoMock.listenAll.mockImplementation((_uid, cb) => {
      cb(materials);
      return unsubscribe;
    });

    const callback = jest.fn();
    const result = controller.listenMaterials('user-1', callback);

    expect(callback).toHaveBeenCalledWith(materials);
    expect(result).toBe(unsubscribe);
  });

  it('listens to logs via repository', () => {
    const unsubscribe = jest.fn();
    const logs: ProgressLog[] = [{ date: '2025-01-01', done: 10 }];

    logRepoMock.listen.mockImplementation((_uid, _matId, cb) => {
      cb(logs);
      return unsubscribe;
    });

    const callback = jest.fn();
    const result = controller.listenLogs('user-1', 'mat-1', callback);

    expect(callback).toHaveBeenCalledWith(logs);
    expect(result).toBe(unsubscribe);
  });
});
