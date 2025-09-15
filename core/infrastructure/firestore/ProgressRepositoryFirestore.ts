import { doc, setDoc, serverTimestamp, getDoc, increment } from 'firebase/firestore';
import { collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ProgressRepository } from '@/core/application/ports/ProgressRepository';

export class ProgressRepositoryFirestore implements ProgressRepository {
  async updateTodoItem({ uid, dateKey, materialId, doneStart, doneEnd }: {
    uid: string; dateKey: string; materialId: string; doneStart: number; doneEnd: number;
  }): Promise<void> {
    await setDoc(
      doc(db, 'users', uid, 'todos', dateKey, 'items', materialId),
      { doneStart, doneEnd, updatedAt: serverTimestamp() },
      { merge: true },
    );
  }

  async incrementMaterialCompleted({ uid, materialId, delta }: { uid: string; materialId: string; delta: number; }): Promise<number> {
    const matRef = doc(db, 'users', uid, 'materials', materialId);
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
      doc(collection(db, 'users', uid, 'materials', materialId, 'logs'), dateKey),
      { date: dateISO, done: doneAfter },
      { merge: true },
    );
  }
}

