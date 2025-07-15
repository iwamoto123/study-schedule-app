// dailyPlanTest.js
// Run with: node dailyPlanTest.js
// or, if using TypeScript, rename to .ts and run with ts-node

const assert = require('node:assert/strict');

/**
 * Calculate dailyPlan the same way MaterialForm does:
 *   days = (deadline - startDate) + 1   // inclusive
 *   dailyPlan = days > 0 ? Math.ceil(totalCount / days) : 0
 */
function calcDailyPlan(totalCount, startDate, deadline) {
  const dayMs = 24 * 60 * 60 * 1000;
  const start = new Date(startDate);
  const end   = new Date(deadline);
  const diffDays = Math.floor((end - start) / dayMs) + 1;
  if (diffDays <= 0) return 0;
  return Math.ceil(totalCount / diffDays);
}

// ---------- 20 test patterns ----------
const cases = [
  { id: 1,  totalCount: 100, start: '2025-07-01', deadline: '2025-07-10', expected: 10 },
  { id: 2,  totalCount: 95,  start: '2025-07-01', deadline: '2025-07-10', expected: 10 },
  { id: 3,  totalCount: 14,  start: '2025-07-05', deadline: '2025-07-05', expected: 14 },
  { id: 4,  totalCount: 7,   start: '2025-07-01', deadline: '2025-07-07', expected: 1 },
  { id: 5,  totalCount: 500, start: '2025-07-01', deadline: '2025-08-30', expected: 9 },
  { id: 6,  totalCount: 123, start: '2025-07-06', deadline: '2025-07-06', expected: 123 },
  { id: 7,  totalCount: 30,  start: '2025-07-10', deadline: '2025-07-01', expected: 0 },
  { id: 8,  totalCount: 100, start: '2025-07-15', deadline: '2025-07-14', expected: 0 },
  { id: 9,  totalCount: 365, start: '2025-01-01', deadline: '2025-12-31', expected: 1 },
  { id: 10, totalCount: 366, start: '2025-01-01', deadline: '2025-12-31', expected: 2 },
  { id: 11, totalCount: 12,  start: '2025-07-01', deadline: '2025-07-03', expected: 4 },
  { id: 12, totalCount: 11,  start: '2025-07-01', deadline: '2025-07-03', expected: 4 },
  { id: 13, totalCount: 15,  start: '2025-06-30', deadline: '2025-07-06', expected: 3 },
  { id: 14, totalCount: 2000,start: '2025-07-01', deadline: '2025-07-31', expected: 65 },
  { id: 15, totalCount: 2000,start: '2025-07-01', deadline: '2025-07-15', expected: 134 },
  { id: 16, totalCount: 1,   start: '2025-07-06', deadline: '2025-07-20', expected: 1 },
  { id: 17, totalCount: 250, start: '2025-07-20', deadline: '2025-07-20', expected: 250 },
  { id: 18, totalCount: 250, start: '2025-07-20', deadline: '2025-07-21', expected: 125 },
  { id: 19, totalCount: 250, start: '2025-07-20', deadline: '2025-07-22', expected: 84 },
  { id: 20, totalCount: 300, start: '2025-06-01', deadline: '2025-06-30', expected: 10 },
];

// ---------- run tests ----------
cases.forEach(({ id, totalCount, start, deadline, expected }) => {
  const got = calcDailyPlan(totalCount, start, deadline);
  assert.equal(got, expected, `Case ${id}: expected ${expected}, got ${got}`);
});

console.log('✅  All 20 test cases passed!');
