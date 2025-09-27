import { calcTodayPlan } from '@/src/models/progress/calcTodayPlan';
import {
  generateTodayCards,
  generateTomorrowCards,
} from '@/src/models/progress/cardGenerators';
import type { Material } from '@/src/models/material/types';

jest.mock('@/src/models/progress/calcTodayPlan', () => ({
  calcTodayPlan: jest.fn(),
}));

const mockCalcTodayPlan = calcTodayPlan as jest.MockedFunction<typeof calcTodayPlan>;

const material = (overrides: Partial<Material> = {}): Material => ({
  id: 'mat1',
  title: '数学ワークブック',
  subject: 'math',
  unitType: 'pages',
  totalCount: 100,
  completed: 25,
  deadline: '2025-12-31',
  startDate: '2025-01-01',
  dailyPlan: 10,
  ...overrides,
});

describe('progress card generators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateTodayCards', () => {
    it('reflects completed range and today plan', () => {
      mockCalcTodayPlan.mockReturnValue(10);

      const materials: Record<string, Material> = {
        mat1: material(),
      };

      const todos = {
        mat1: { doneStart: 21, doneEnd: 25 },
      };

      const [card] = generateTodayCards(materials, todos);

      expect(card).toMatchObject({
        id: 'mat1',
        plannedStart: 21,
        plannedEnd: 30,
        doneStart: 21,
        doneEnd: 25,
        prevStart: 21,
        prevEnd: 25,
      });

      expect(mockCalcTodayPlan).toHaveBeenCalledWith({
        totalCount: 100,
        completed: 20,
        deadline: '2025-12-31',
      });
    });

    it('clamps planned range to total count when plan exceeds remaining', () => {
      mockCalcTodayPlan.mockReturnValue(50);

      const materials: Record<string, Material> = {
        mat1: material({ totalCount: 30, completed: 25 }),
      };

      const [card] = generateTodayCards(materials, {});
      expect(card.plannedStart).toBe(26);
      expect(card.plannedEnd).toBe(30);
    });
  });

  describe('generateTomorrowCards', () => {
    it('generates plan for unfinished materials', () => {
      mockCalcTodayPlan
        .mockReturnValueOnce(5) // today
        .mockReturnValueOnce(4); // tomorrow

      const materials: Record<string, Material> = {
        mat1: material({ completed: 20 }),
      };

      const result = generateTomorrowCards(materials, {});
      expect(result).toEqual([
        {
          id: 'mat1',
          title: '数学ワークブック',
          subject: 'math',
          unitType: 'pages',
          planStart: 26,
          planEnd: 29,
        },
      ]);

      expect(mockCalcTodayPlan).toHaveBeenNthCalledWith(1, {
        totalCount: 100,
        completed: 20,
        deadline: '2025-12-31',
      });
      expect(mockCalcTodayPlan).toHaveBeenNthCalledWith(2,
        {
          totalCount: 100,
          completed: 25,
          deadline: '2025-12-31',
        },
        expect.anything(),
      );
    });

    it('omits materials that are already complete after today', () => {
      mockCalcTodayPlan.mockReturnValue(5);

      const materials: Record<string, Material> = {
        mat1: material({ completed: 100 }),
      };

      const todos = {
        mat1: { doneStart: 21, doneEnd: 25 },
      };

      expect(generateTomorrowCards(materials, todos)).toHaveLength(0);
    });
  });
});
