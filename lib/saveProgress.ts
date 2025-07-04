// lib/saveProgress.ts
import {
  doc,
  runTransaction,
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
  const todayISO = dayjs().format('YYYY-MM-DD');

  /* ---- 入力範囲 → 差分計算 ------------------------------------- */
  const prevSpan = prevStart !== null && prevEnd !== null
    ? prevEnd - prevStart + 1
    : 0;
  const newSpan  = newEnd - newStart + 1;
  const delta    = newSpan - prevSpan;              // きょう増えた分

  /* ---- トランザクション ----------------------------------------- */
  await runTransaction(db, async (tx) => {
    /* ① materials を取得して現在の completed を読む */
    const matRef  = doc(db, 'users', uid, 'materials', materialId);
    const matSnap = await tx.get(matRef);
    const curComp = (matSnap.data()?.completed as number) ?? 0;
    const newComp = curComp + delta;

    /* ② materials.completed を更新 */
    tx.update(matRef, { completed: increment(delta) });

    /* ③ todos/{today}/items を上書き */
    tx.set(
      doc(db, 'users', uid, 'todos', todayKey, 'items', materialId),
      {
        doneStart: newStart,
        doneEnd:   newEnd,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );

    /* ④ logs サブコレクションに累積値を保存 */
    tx.set(
      doc(db, 'users', uid, 'materials', materialId, 'logs', todayKey),
      {
        date : todayISO,   // human readable
        done : newComp,    // ← 累積完了数
      },
      { merge: true },
    );
  });
}
