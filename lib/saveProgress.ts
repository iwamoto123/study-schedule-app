// lib/saveProgress.ts
import {
  doc,
  writeBatch,
  increment,
  serverTimestamp,
  getDoc,
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

  /* ---------- ① todos/items を上書き ---------- */
  batch.set(
    doc(db, 'users', uid, 'todos', todayKey, 'items', materialId),
    {
      doneStart: newStart,
      doneEnd:   newEnd,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );

  /* ---------- ② completed を ±差分 更新 ---------- */
  const prevSpan = prevStart !== null && prevEnd !== null
    ? prevEnd - prevStart + 1
    : 0;
  const newSpan  = newEnd - newStart + 1;
  const delta    = newSpan - prevSpan;

  const matRef = doc(db, 'users', uid, 'materials', materialId);
  // 存在有無に関わらず加算できるよう set(merge) を使用
  batch.set(matRef, { completed: increment(delta) }, { merge: true });

  /* ---------- ③ logs/{YYYYMMDD} に累積完了数を書き込む ---------- */
  // 先に material を読んで "更新後" の completed を求める
  const snap = await getDoc(matRef);
  const before = (snap.data()?.completed ?? 0) as number;
  const after  = before + delta;

  batch.set(
    doc(db, 'users', uid, 'materials', materialId, 'logs', todayKey),
    { date: dayjs().format('YYYY-MM-DD'), done: after },
    { merge: true },
  );

  await batch.commit();
}
