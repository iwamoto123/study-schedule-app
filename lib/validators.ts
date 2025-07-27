// lib/validators.ts
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
export type UnitType =
  | 'pages'
  | 'problems'
  | 'words'
  | 'chapters'
  | 'none';

export interface ValidatedTodo {
  id:          string;
  title:       string;
  unitType:    UnitType;
  /** きょう開始ページ */
  plannedStart: number;
  /** きょう終了ページ */
  plannedEnd:   number;
  /** 教材全体開始ページ */
  totalStart:   number;
  /** 教材全体終了ページ */
  totalEnd:     number;
  /** きょうのノルマ数 */
  planCount:    number;
  /** 入力済み開始ページ（なければ null） */
  doneStart:    number | null;
  /** 入力済み終了ページ（なければ null） */
  doneEnd:      number | null;
}

/* ------------------------------------------------------------------ */
/**
 * 不正値を持つドキュメントを弾き、型を絞り込んで返す
 *
 * - 数値フィールドが欠損 / NaN / Infinity → null
 * - planCount ≤ 0 または totalStart > totalEnd → null
 * - plannedEnd が未定義なら plannedStart + planCount - 1 を補完
 */
export const validateTodo = (
  // Firestore の生データ（unknown とし、都度チェック）
  src: unknown,
  id:  string,
): ValidatedTodo | null => {
  if (src === null || typeof src !== 'object') return null;

  // Record<string, unknown> にキャストして読み取る
  const obj = src as Record<string, unknown>;

  // まず必要な数値を取り出し
  const planCount   = obj.planCount;
  const plannedStart = obj.plannedStart;
  const totalStart   = obj.totalStart;
  const totalEnd     = obj.totalEnd;

  const numericFields = [planCount, plannedStart, totalStart, totalEnd];

  // 数値チェック
  if (numericFields.some(n => !isFiniteNumber(n))) return null;
  if ((planCount as number) <= 0) return null;
  if ((totalStart as number) > (totalEnd as number)) return null;

  // plannedEnd が数値でない場合は補完
  const plannedEndRaw = obj.plannedEnd;
  const plannedEnd =
    isFiniteNumber(plannedEndRaw)
      ? plannedEndRaw
      : (plannedStart as number) + (planCount as number) - 1;

  return {
    id,
    title       : String(obj.title ?? ''),
    unitType    : (obj.unitType ?? 'none') as UnitType,
    plannedStart: plannedStart as number,
    plannedEnd  : plannedEnd,
    totalStart  : totalStart as number,
    totalEnd    : totalEnd as number,
    planCount   : planCount as number,
    doneStart   : isFiniteNumber(obj.doneStart) ? (obj.doneStart as number) : null,
    doneEnd     : isFiniteNumber(obj.doneEnd)   ? (obj.doneEnd   as number) : null,
  };
};
