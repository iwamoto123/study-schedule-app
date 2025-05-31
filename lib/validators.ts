///lib/validators.ts

/* =======================================================================
 * 共通ユーティリティ ― 型安全な数値チェック & クランプ
 * ===================================================================== */
export const isFiniteNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

export const clampNumber = (v: number, min: number, max: number) =>
  Math.min(Math.max(v, min), max);

/* =======================================================================
 * Firestore から取得した Todo ドキュメントのバリデーション
 * ===================================================================== */
export interface ValidatedTodo {
  id:          string;
  title:       string;
  unitType:    UnitType;
  plannedStart: number;
  plannedEnd:   number;
  totalStart:   number;
  totalEnd:     number;
  planCount:    number;
  doneStart:    number | null;
  doneEnd:      number | null;
}

export type UnitType =
  | 'pages' | 'problems' | 'words' | 'chapters' | 'none';

/**
 * 不正値を持つドキュメントを弾き、型を絞り込んで返す
 * - 数値フィールドが欠損 / NaN / Infinity → false
 * - planCount ≤ 0 または totalStart > totalEnd → false
 * - plannedEnd が undefined の場合は   plannedStart + planCount - 1 を補完
 */
export const validateTodo = (
  src: any,         // Firestore の生データ
  id:  string,
): ValidatedTodo | null => {
  const nums = [
    src.planCount,
    src.plannedStart,
    src.totalStart,
    src.totalEnd,
  ];

  if (nums.some(n => !isFiniteNumber(n))) return null;
  if (src.planCount <= 0) return null;
  if (src.totalStart > src.totalEnd) return null;

  const plannedStart = src.plannedStart;
  const plannedEnd   = isFiniteNumber(src.plannedEnd)
    ? src.plannedEnd
    : plannedStart + src.planCount - 1;

  return {
    id,
    title:        String(src.title ?? ''),
    unitType:     (src.unitType ?? 'none') as UnitType,
    plannedStart,
    plannedEnd,
    totalStart:   src.totalStart,
    totalEnd:     src.totalEnd,
    planCount:    src.planCount,
    doneStart:    isFiniteNumber(src.doneStart) ? src.doneStart : null,
    doneEnd:      isFiniteNumber(src.doneEnd)   ? src.doneEnd   : null,
  };
};
