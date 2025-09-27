import dayjs from 'dayjs';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';
import type { Material, MaterialDraft, MaterialUpdate } from '@/src/models/material/types';
import type { MaterialRepository } from '@/src/models/material/materialRepository';

function buildMaterial(id: string, data: Record<string, unknown>): Material {
  return {
    id,
    title: (data.title as string) ?? '',
    subject: data.subject as Material['subject'],
    unitType: data.unitType as Material['unitType'],
    totalCount: (data.totalCount as number) ?? 0,
    dailyPlan: (data.dailyPlan as number) ?? 0,
    completed: (data.completed as number) ?? 0,
    startDate: data.startDate as string | undefined,
    deadline: data.deadline as string | undefined,
    createdAt: data.createdAt,
  };
}

export class FirestoreMaterialRepository implements MaterialRepository {
  constructor(private readonly firestore: Firestore = db) {}

  async create(uid: string, data: MaterialDraft): Promise<string> {
    // デバッグ: 送信データを確認
    console.log('[FirestoreMaterialRepository] Creating material with:', {
      uid,
      data,
      path: `users/${uid}/materials`,
      auth: {
        currentUser: auth.currentUser?.uid,
        isAnonymous: auth.currentUser?.isAnonymous,
        providerId: auth.currentUser?.providerId,
      }
    });

    if (!uid) {
      throw new Error('User ID is required to create a material');
    }

    // ユーザーIDが現在の認証ユーザーと一致するか確認
    if (auth.currentUser && auth.currentUser.uid !== uid) {
      console.error('[FirestoreMaterialRepository] UID mismatch:', {
        provided: uid,
        current: auth.currentUser.uid
      });
    }

    const ref = await addDoc(collection(this.firestore, 'users', uid, 'materials'), {
      ...data,
      completed: 0,
      createdAt: serverTimestamp(),
    });

    const todayKey = dayjs().format('YYYYMMDD');
    await setDoc(
      doc(this.firestore, 'users', uid, 'todos', todayKey, 'items', ref.id),
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

  async update(uid: string, id: string, data: MaterialUpdate): Promise<void> {
    await setDoc(doc(this.firestore, 'users', uid, 'materials', id), { ...data }, { merge: true });
  }

  async delete(uid: string, id: string): Promise<void> {
    await deleteDoc(doc(this.firestore, 'users', uid, 'materials', id));
  }

  listenAll(uid: string, callback: (materials: Material[]) => void): Unsubscribe {
    // ユーザーIDが無効な場合は空の関数を返す
    if (!uid) {
      console.warn('[FirestoreMaterialRepository] listenAll called with empty uid');
      callback([]);
      return () => {};
    }

    const collectionRef = collection(this.firestore, 'users', uid, 'materials');
    const q = query(collectionRef, orderBy('createdAt', 'asc'));

    return onSnapshot(
      q,
      snapshot => {
        const materials = snapshot.docs.map(docSnap => buildMaterial(docSnap.id, docSnap.data()));
        callback(materials);
      },
      error => {
        // エラーハンドリング: 権限エラーの場合は空配列を返す
        if (error.code === 'permission-denied') {
          console.warn('[FirestoreMaterialRepository] Permission denied for user:', uid);
          callback([]);
        } else {
          console.error('[FirestoreMaterialRepository] Snapshot error:', error);
        }
      }
    );
  }
}
