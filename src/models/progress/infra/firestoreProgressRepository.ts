import { doc, setDoc, serverTimestamp, getDoc, increment, collection, type Firestore } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { ProgressRepository } from '@/src/models/progress/progressRepository';

export class ProgressRepositoryFirestore implements ProgressRepository {
  constructor(private readonly firestore: Firestore = db) {}

  async updateTodoItem({ uid, dateKey, materialId, doneStart, doneEnd }: {
    uid: string; dateKey: string; materialId: string; doneStart: number; doneEnd: number;
  }): Promise<void> {
    await setDoc(
      doc(this.firestore, 'users', uid, 'todos', dateKey, 'items', materialId),
      { doneStart, doneEnd, updatedAt: serverTimestamp() },
      { merge: true },
    );
  }

  async incrementMaterialCompleted({ uid, materialId, delta }: { uid: string; materialId: string; delta: number; }): Promise<number> {
    const matRef = doc(this.firestore, 'users', uid, 'materials', materialId);
    const snap = await getDoc(matRef);
    const before = (snap.data()?.completed ?? 0) as number;
    const after = before + delta;
    await setDoc(matRef, { completed: increment(delta) }, { merge: true });
    return after;
  }

  async setMaterialLog({ uid, materialId, dateKey, dateISO, doneAfter }: {
    uid: string; materialId: string; dateKey: string; dateISO: string; doneAfter: number;
  }): Promise<void> {
    await setDoc(
      doc(collection(this.firestore, 'users', uid, 'materials', materialId, 'logs'), dateKey),
      { date: dateISO, done: doneAfter },
      { merge: true },
    );
  }
}
