// src/types/material.ts
import type { UnitType, Subject } from '@/types/common';

/**
 * Firestore users/{uid}/materials の 1 ドキュメント型
 */
export interface Material {
  /* ── ID ── */
  id: string;

  /* ── 基本情報 ── */
  title:    string;
  subject:  Subject;
  unitType: UnitType;

  /* ── 分量・進捗 ── */
  totalCount: number;   // 教材全体の量
  dailyPlan:  number;   // 登録時の 1 日目安   ★必須
  completed:  number;   // 累積完了数（0 でも可）
  todayPlan?: number;   // 動的計算用（Progress / Graph だけが利用）

  /* ── 日付 ── */
  startDate?: string;   // YYYY-MM-DD
  deadline?:  string;   // YYYY-MM-DD
  createdAt?: any;      // Firestore Timestamp
}
