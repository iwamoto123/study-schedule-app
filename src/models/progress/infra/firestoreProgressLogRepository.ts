import { collection, onSnapshot, orderBy, query, type Firestore, type Unsubscribe } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import type { ProgressLog, ProgressLogRepository } from '@/src/models/progress/progressLogRepository';

export class FirestoreProgressLogRepository implements ProgressLogRepository {
  constructor(private readonly firestore: Firestore = db) {}

  listen(uid: string, materialId: string, callback: (logs: ProgressLog[]) => void): Unsubscribe {
    const col = collection(this.firestore, 'users', uid, 'materials', materialId, 'logs');
    const q = query(col, orderBy('date', 'asc'));

    return onSnapshot(q, snapshot => {
      const logs: ProgressLog[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          date: (data.date as string) ?? '',
          done: (data.done as number) ?? 0,
        };
      });
      callback(logs);
    });
  }
}
