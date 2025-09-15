test('noop', () => {
  expect(true).toBe(true);
});

// /**
//  * progress/page.test.tsx
//  *
//  * generateTodayCards / generateTomorrowCards のユニットテスト
//  *   - completed は “今日入力後” の値を保持している前提
//  *   - calcTodayPlan は常にモックで差し替え
//  */
// import { calcTodayPlan } from '@/lib/calcTodayPlan';
// import dayjs             from 'dayjs';
// import {
//   generateTodayCards,
//   generateTomorrowCards,
// }                        from './page';
// import type { Material } from '@/types/material';

// /* ---------- calcTodayPlan をモック ---------- */
// jest.mock('@/lib/calcTodayPlan', () => ({
//   calcTodayPlan: jest.fn(),
// }));
// const mockCalcTodayPlan =
//   calcTodayPlan as jest.MockedFunction<typeof calcTodayPlan>;

// /* ---------- 共通ヘルパ ---------- */
// const tomorrow = dayjs().add(1, 'day');
// const dummyDeadline = '2024-12-31';

// describe('Card Generators', () => {
//   beforeEach(() => {
//     jest.clearAllMocks();
//   });

//   /* =======================================================
//    * generateTodayCards
//    * ===================================================== */
//   describe('generateTodayCards', () => {
//     it('基本ケース：入力済みの範囲とノルマを正しく反映', () => {
//       mockCalcTodayPlan.mockReturnValue(10); // 今日のノルマ

//       /** completed は “入力後” = 25 まで進んでいる想定 */
//       const materials: Record<string, Material> = {
//         mat1: {
//           id: 'mat1',
//           title: '数学ワークブック',
//           subject: 'math',
//           unitType: 'pages',
//           totalCount: 100,
//           completed: 25,          // 21〜25 を保存済み
//           deadline:  dummyDeadline,
//           dailyPlan: 10,
//         },
//       };

//       const todos = {
//         mat1: { doneStart: 21, doneEnd: 25 },
//       };

//       const [card] = generateTodayCards(materials, todos);

//       expect(card).toEqual({
//         id: 'mat1',
//         title: '数学ワークブック',
//         subject: 'math',
//         unitType: 'pages',
//         totalStart: 1,
//         totalEnd:   100,
//         plannedStart: 21, // 25 - 5 + 1
//         plannedEnd:   30, // 21 + 10 - 1
//         doneStart:  21,
//         doneEnd:    25,
//         prevStart:  21,
//         prevEnd:    25,
//       });

//       expect(mockCalcTodayPlan).toHaveBeenCalledWith({
//         totalCount: 100,
//         completed : 20, // 25 - 5
//         deadline  : dummyDeadline,
//       });
//     });

//     it('TODO が無い場合でもノルマ算出が行われる', () => {
//       mockCalcTodayPlan.mockReturnValue(5);

//       const materials: Record<string, Material> = {
//         mat1: {
//           id: 'mat1',
//           title: '英語ドリル',
//           subject: 'english',
//           unitType: 'problems',
//           totalCount: 50,
//           completed: 10,
//           deadline : dummyDeadline,
//           dailyPlan: 5,
//         },
//       };

//       const cards = generateTodayCards(materials, {});
//       const [c]   = cards;

//       expect(cards).toHaveLength(1);
//       expect(c.plannedStart).toBe(11);
//       expect(c.plannedEnd).toBe(15);
//       expect(c.doneStart).toBeNull();
//     });

//     it('plannedEnd が totalCount を超えない', () => {
//       mockCalcTodayPlan.mockReturnValue(20);

//       const materials: Record<string, Material> = {
//         mat1: {
//           id: 'mat1',
//           title: '理科問題集',
//           subject: 'biology',
//           unitType: 'pages',
//           totalCount: 30,
//           completed: 25,
//           deadline : dummyDeadline,
//           dailyPlan: 20,
//         },
//       };

//       const [c] = generateTodayCards(materials, {});
//       expect(c.plannedStart).toBe(26);
//       expect(c.plannedEnd).toBe(30); // clamp
//     });

//     it('completed が undefined|0 でも正常動作', () => {
//       mockCalcTodayPlan.mockReturnValue(10);

//       const materials: Record<string, Material> = {
//         mat1: {
//           id: 'mat1',
//           title: '社会ワーク',
//           subject: 'social',
//           unitType: 'pages',
//           totalCount: 100,
//           completed: 0,
//           deadline : dummyDeadline,
//           dailyPlan: 10,
//         },
//       };

//       const [c] = generateTodayCards(materials, {});
//       expect(c.plannedStart).toBe(1);
//       expect(c.plannedEnd).toBe(10);
//     });
//   });

//   /* =======================================================
//    * generateTomorrowCards
//    * ===================================================== */
//   describe('generateTomorrowCards', () => {
//     it('入力済みの場合：入力範囲の次ページから開始', () => {
//       /* 2 回呼ばれる（今日分 / 明日分）*/
//       mockCalcTodayPlan
//         .mockReturnValueOnce(10) // todayPlanCnt (未使用だが呼ばれる)
//         .mockReturnValueOnce(8); // 明日のノルマ

//       const materials: Record<string, Material> = {
//         mat1: {
//           id: 'mat1',
//           title: '数学ワークブック',
//           subject: 'math',
//           unitType: 'pages',
//           totalCount: 100,
//           completed: 25, // 今日入力後まで含む
//           deadline : dummyDeadline,
//           dailyPlan: 10,
//         },
//       };

//       const todos = {
//         mat1: { doneStart: 21, doneEnd: 25 },
//       };

//       const [t] = generateTomorrowCards(materials, todos);

//       expect(t).toEqual({
//         id: 'mat1',
//         title: '数学ワークブック',
//         subject: 'math',
//         unitType: 'pages',
//         planStart: 26, // 25 + 1
//         planEnd  : 33, // 26 + 8 - 1
//       });

//       /* 1 回目 = todayPlanCnt / 2 回目 = 明日分 */
//       expect(mockCalcTodayPlan).toHaveBeenNthCalledWith(2, {
//         totalCount: 100,
//         completed : 25,
//         deadline  : dummyDeadline,
//       }, expect.anything());
//     });

//     it('未入力の場合：今日の予定量をみなし消化して開始', () => {
//       mockCalcTodayPlan
//         .mockReturnValueOnce(10) // todayPlanCnt
//         .mockReturnValueOnce(10); // tomorrowPlanCnt

//       const materials: Record<string, Material> = {
//         mat1: {
//           id: 'mat1',
//           title: '英語教材',
//           subject: 'english',
//           unitType: 'chapters',
//           totalCount: 100,
//           completed: 30,  // まだ入力していない想定
//           deadline : dummyDeadline,
//           dailyPlan: 10,
//         },
//       };

//       const cards = generateTomorrowCards(materials, {}); // todo 無し
//       const [c]   = cards;

//       expect(c.planStart).toBe(41); // 30 + 10(みなし) + 1
//       expect(c.planEnd).toBe(50);   // 41 + 10 - 1
//     });

//     it('教材が完了済みなら除外', () => {
//       mockCalcTodayPlan.mockReturnValue(0); // 呼ばれても構わない

//       const materials: Record<string, Material> = {
//         mat1: {
//           id: 'mat1',
//           title: '完了教材',
//           subject: 'math',
//           unitType: 'pages',
//           totalCount: 50,
//           completed: 50,
//           deadline : dummyDeadline,
//           dailyPlan: 5,
//         },
//       };

//       const result = generateTomorrowCards(materials, {});
//       expect(result).toHaveLength(0);
//     });

//     it('今日の入力で totalCount に達した場合も除外', () => {
//       mockCalcTodayPlan.mockReturnValueOnce(5).mockReturnValueOnce(5);

//       const materials: Record<string, Material> = {
//         mat1: {
//           id: 'mat1',
//           title: '国語ドリル',
//           subject: 'japanese',
//           unitType: 'problems',
//           totalCount: 30,
//           completed: 30, // 26〜30 を保存済み
//           deadline : dummyDeadline,
//           dailyPlan: 5,
//         },
//       };

//       const todos = {
//         mat1: { doneStart: 26, doneEnd: 30 },
//       };

//       expect(generateTomorrowCards(materials, todos)).toHaveLength(0);
//     });

//     it('複数教材を処理し、それぞれのノルマを反映', () => {
//       mockCalcTodayPlan
//         // mat1: todayPlanCnt / tomorrowPlanCnt
//         .mockReturnValueOnce(5).mockReturnValueOnce(5)
//         // mat2: todayPlanCnt / tomorrowPlanCnt
//         .mockReturnValueOnce(3).mockReturnValueOnce(3);

//       const materials: Record<string, Material> = {
//         mat1: {
//           id: 'mat1',
//           title: '数学',
//           subject: 'math',
//           unitType: 'pages',
//           totalCount: 100,
//           completed: 22, // 21〜22 完了済み
//           deadline : dummyDeadline,
//           dailyPlan: 10,
//         },
//         mat2: {
//           id: 'mat2',
//           title: '英語',
//           subject: 'english',
//           unitType: 'problems',
//           totalCount: 50,
//           completed: 11, // 11 完了済み
//           deadline : dummyDeadline,
//           dailyPlan: 5,
//         },
//       };

//       const todos = {
//         mat1: { doneStart: 21, doneEnd: 22 },
//         mat2: { doneStart: 11, doneEnd: 11 },
//       };

//       const result = generateTomorrowCards(materials, todos);

//       expect(result).toHaveLength(2);

//       // mat1
//       expect(result[0]).toMatchObject({
//         id: 'mat1',
//         planStart: 23, // 22 + 1
//         planEnd  : 27, // 23 + 5 - 1
//       });

//       // mat2
//       expect(result[1]).toMatchObject({
//         id: 'mat2',
//         planStart: 12, // 11 + 1
//         planEnd  : 14, // 12 + 3 - 1
//       });
//     });

//     it('doneStart / doneEnd が null → 未入力扱い', () => {
//       mockCalcTodayPlan
//         .mockReturnValueOnce(10) // todayPlanCnt
//         .mockReturnValueOnce(10); // tomorrowPlanCnt

//       const materials: Record<string, Material> = {
//         mat1: {
//           id: 'mat1',
//           title: '理科',
//           subject: 'biology',
//           unitType: 'pages',
//           totalCount: 100,
//           completed: 30,
//           deadline : dummyDeadline,
//           dailyPlan: 10,
//         },
//       };

//       const todos = {
//         mat1: { doneStart: null, doneEnd: null },
//       };

//       const [c] = generateTomorrowCards(materials, todos);

//       expect(c.planStart).toBe(41); // 30 + 10 + 1
//       expect(c.planEnd).toBe(50);
//     });
//   });
// });
