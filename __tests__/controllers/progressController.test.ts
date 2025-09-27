import { ProgressController } from '@/src/controllers/progress/progressController';
import type { MaterialRepository } from '@/src/models/material/materialRepository';
import type { Material } from '@/src/models/material/types';
import type { ProgressRepository } from '@/src/models/progress/progressRepository';
import type { ProgressService } from '@/src/models/progress/progressService';
import type { TodoRepository } from '@/src/models/todo/todoRepository';
import type { TodoItem } from '@/src/models/todo/todoEntity';

describe('ProgressController', () => {
  const progressRepoMock: jest.Mocked<ProgressRepository> = {
    updateTodoItem: jest.fn(),
    incrementMaterialCompleted: jest.fn(),
    setMaterialLog: jest.fn(),
  } as unknown as jest.Mocked<ProgressRepository>;

  const progressServiceMock: jest.Mocked<ProgressService> = {
    saveProgress: jest.fn(),
  } as unknown as jest.Mocked<ProgressService>;

  const materialRepoMock: jest.Mocked<MaterialRepository> = {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    listenAll: jest.fn(),
  } as unknown as jest.Mocked<MaterialRepository>;

  const todoRepoMock: jest.Mocked<TodoRepository> = {
    listenDaily: jest.fn(),
  } as unknown as jest.Mocked<TodoRepository>;

  const controller = new ProgressController(progressServiceMock, materialRepoMock, todoRepoMock);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('delegates saveProgress to service', async () => {
    await controller.saveProgress('user-1', {
      materialId: 'mat-1',
      newStart: 11,
      newEnd: 20,
      prevStart: null,
      prevEnd: null,
    });

    expect(progressServiceMock.saveProgress).toHaveBeenCalledWith({
      uid: 'user-1',
      materialId: 'mat-1',
      newStart: 11,
      newEnd: 20,
      prevStart: null,
      prevEnd: null,
    });
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

  it('listens to todos via repository', () => {
    const unsubscribe = jest.fn();
    const todos: Record<string, TodoItem> = {
      t1: {
        id: 't1',
        title: '数学',
        subject: 'math',
        unitType: 'pages',
        planCount: 5,
        doneStart: null,
        doneEnd: null,
      },
    };

    todoRepoMock.listenDaily.mockImplementation((_uid, _dateKey, cb) => {
      cb(todos);
      return unsubscribe;
    });

    const callback = jest.fn();
    const result = controller.listenTodos('user-1', '20250101', callback);

    expect(callback).toHaveBeenCalledWith(todos);
    expect(result).toBe(unsubscribe);
  });
});
