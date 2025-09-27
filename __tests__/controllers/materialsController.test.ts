import { MaterialsController } from '@/src/controllers/materials/materialsController';
import type { Material } from '@/src/models/material/types';
import type { MaterialRepository } from '@/src/models/material/materialRepository';
import type { MaterialService } from '@/src/models/material/materialService';

describe('MaterialsController', () => {
  const repoMock: jest.Mocked<MaterialRepository> = {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    listenAll: jest.fn(),
  } as unknown as jest.Mocked<MaterialRepository>;

  const serviceMock: jest.Mocked<MaterialService> = {
    createMaterial: jest.fn(),
    updateMaterial: jest.fn(),
  } as unknown as jest.Mocked<MaterialService>;

  const controller = new MaterialsController(serviceMock, repoMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates create to service', async () => {
    serviceMock.createMaterial.mockResolvedValue('material-1');

    const result = await controller.create('user-1', {
      title: '数学',
      unitType: 'pages',
      totalCount: 100,
      startDate: '2025-01-01',
      deadline: '2025-02-01',
      dailyPlan: 5,
      subject: 'math',
    });

    expect(result).toBe('material-1');
    expect(serviceMock.createMaterial).toHaveBeenCalledWith({
      uid: 'user-1',
      title: '数学',
      unitType: 'pages',
      totalCount: 100,
      startDate: '2025-01-01',
      deadline: '2025-02-01',
      dailyPlan: 5,
      subject: 'math',
    });
  });

  it('delegates update to service', async () => {
    await controller.update('user-1', 'mat-1', { title: '新タイトル' });

    expect(serviceMock.updateMaterial).toHaveBeenCalledWith('user-1', 'mat-1', {
      title: '新タイトル',
    });
  });

  it('delegates deletion to repository', async () => {
    await controller.delete('user-1', 'mat-1');

    expect(repoMock.delete).toHaveBeenCalledWith('user-1', 'mat-1');
  });

  it('subscribes via repository', () => {
    const materials: Material[] = [
      {
        id: 'mat-1',
        title: '数学',
        subject: 'math',
        unitType: 'pages',
        totalCount: 100,
        dailyPlan: 5,
        completed: 0,
      },
    ];

    const unsubscribe = jest.fn();
    repoMock.listenAll.mockImplementation((_uid, cb) => {
      cb(materials);
      return unsubscribe;
    });

    const callback = jest.fn();
    const result = controller.listenAll('user-1', callback);

    expect(callback).toHaveBeenCalledWith(materials);
    expect(result).toBe(unsubscribe);
  });
});
