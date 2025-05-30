// lib/saveProgress.ts
import {
  doc,
  writeBatch,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import dayjs from 'dayjs';
import { db } from '@/lib/firebase';

interface Params {
  uid: string;
  materialId: string;
  newStart: number;
  newEnd: number;
  prevStart: number | null;
  prevEnd: number | null;
}

export async function saveProgress({
  uid,
  materialId,
  newStart,
  newEnd,
  prevStart,
  prevEnd,
}: Params) {
  const todayKey = dayjs().format('YYYYMMDD');
  const batch    = writeBatch(db);

  /* --- ① 今日の todos を上書き ----------------------- */
  batch.set(
    doc(db, 'users', uid, 'todos', todayKey, 'items', materialId),
    {
      doneStart: newStart,
      doneEnd:   newEnd,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  /* --- ② 累積 completed を ±差分 更新 ---------------- */
  const prevSpan = prevStart !== null && prevEnd !== null
    ? prevEnd - prevStart + 1
    : 0;
  const newSpan  = newEnd - newStart + 1;
  const delta    = newSpan - prevSpan;

  batch.update(
    doc(db, 'users', uid, 'materials', materialId),
    { completed: increment(delta) },
  );

  await batch.commit();
}
