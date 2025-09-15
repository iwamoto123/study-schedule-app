import { addDoc, collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { Material } from '../../domain/material';
import type { MaterialRepository } from '../../application/ports/MaterialRepository';
import { db } from '@/lib/firebase';
import dayjs from 'dayjs';

export class MaterialRepositoryFirestore implements MaterialRepository {
  async create(uid: string, data: Omit<Material, 'id' | 'completed'> & { completed?: number }): Promise<string> {
    const ref = await addDoc(collection(db, 'users', uid, 'materials'), {
      ...data,
      completed: 0,
      createdAt: serverTimestamp(),
    });

    // 初期todosへコピー
    const todayKey = dayjs().format('YYYYMMDD');
    await setDoc(
      doc(db, 'users', uid, 'todos', todayKey, 'items', ref.id),
      {
        title: data.title,
        unitType: data.unitType,
        planCount: data.dailyPlan,
        done: 0,
      },
      { merge: true },
    );

    return ref.id;
  }

  async update(uid: string, id: string, data: Partial<Omit<Material, 'id'>>): Promise<void> {
    await setDoc(doc(db, 'users', uid, 'materials', id), { ...data }, { merge: true });
  }
}

