// types/material.ts
export type UnitType =
  | 'pages'
  | 'problems'
  | 'words'
  | 'chapters'
  | 'none';

export interface Material {
  id: string;           // Firestore ドキュメントID
  title: string;
  subject: string;      // enum にしてもOK
  unitType: UnitType;

  totalCount: number;   // 教材の総量
  dailyPlan: number;    // 1日あたり
  completed: number;    // ⭐ 累積で完了した量

  startDate?: string;   // YYYY-MM-DD
  deadline?: string;    // YYYY-MM-DD
  createdAt?: any;      // Timestamp 型は細かい推論が難しいので any でOK
}
