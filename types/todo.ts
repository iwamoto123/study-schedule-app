// types/todo.ts
import { UnitType, Subject } from '@/components/StudyMaterialCard';


/** Firestore: users/{uid}/todos/{YYYYMMDD}/items/{materialId} */
export interface TodoItem {
  id: string;
  title: string;
  subject: Subject;
  unitType: UnitType;

  /** 今日こなす予定量 */
  planCount: number;

  /** 入力済みなら実績範囲・量 */
  plannedStart: number;
  plannedEnd: number;

  totalStart: number;
  totalEnd: number;

  doneStart: number;  // 例: 151
  doneEnd:   number;  // 例: 200
  done?:      number;  // 例: 50
}
