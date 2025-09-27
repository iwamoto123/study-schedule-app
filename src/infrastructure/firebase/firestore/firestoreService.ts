'use client';

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  type DocumentData,
  type QueryConstraint,
  type DocumentReference,
  type CollectionReference,
  type DocumentSnapshot,
  type QuerySnapshot,
  serverTimestamp,
  FieldValue,
} from 'firebase/firestore';

import { getFirestoreClient } from '../client';

/**
 * Firestore操作サービス
 * Firestoreへのアクセスを抽象化
 */
export class FirestoreService {
  /**
   * ドキュメントを取得
   */
  async getDocument<T = DocumentData>(
    collectionPath: string,
    docId: string
  ): Promise<DocumentSnapshot<T>> {
    const db = getFirestoreClient();
    const docRef = doc(db, collectionPath, docId) as DocumentReference<T>;
    return await getDoc(docRef);
  }

  /**
   * コレクションを取得
   */
  async getCollection<T = DocumentData>(
    collectionPath: string,
    ...constraints: QueryConstraint[]
  ): Promise<QuerySnapshot<T>> {
    const db = getFirestoreClient();
    const collRef = collection(db, collectionPath) as CollectionReference<T>;
    const q = constraints.length > 0 ? query(collRef, ...constraints) : collRef;
    return await getDocs(q);
  }

  /**
   * ドキュメントを作成（IDを指定）
   */
  async setDocument<T extends DocumentData>(
    collectionPath: string,
    docId: string,
    data: T,
    merge: boolean = false
  ): Promise<void> {
    const db = getFirestoreClient();
    const docRef = doc(db, collectionPath, docId);
    await setDoc(docRef, data, { merge });
  }

  /**
   * ドキュメントを作成（IDを自動生成）
   */
  async addDocument<T extends DocumentData>(
    collectionPath: string,
    data: T
  ): Promise<DocumentReference> {
    const db = getFirestoreClient();
    const collRef = collection(db, collectionPath);
    return await addDoc(collRef, data);
  }

  /**
   * ドキュメントを更新
   */
  async updateDocument(
    collectionPath: string,
    docId: string,
    data: Partial<DocumentData>
  ): Promise<void> {
    const db = getFirestoreClient();
    const docRef = doc(db, collectionPath, docId);
    await updateDoc(docRef, data);
  }

  /**
   * ドキュメントを削除
   */
  async deleteDocument(collectionPath: string, docId: string): Promise<void> {
    const db = getFirestoreClient();
    const docRef = doc(db, collectionPath, docId);
    await deleteDoc(docRef);
  }

  /**
   * ユーザーコレクションのパスを生成
   */
  getUserCollectionPath(userId: string, subCollection?: string): string {
    if (subCollection) {
      return `users/${userId}/${subCollection}`;
    }
    return `users/${userId}`;
  }

  /**
   * サーバータイムスタンプを取得
   */
  getServerTimestamp(): FieldValue {
    return serverTimestamp();
  }

  /**
   * クエリ制約を生成するヘルパー
   */
  get constraints() {
    return {
      where,
      orderBy,
      limit,
    };
  }
}

// シングルトンインスタンス
let firestoreServiceInstance: FirestoreService | null = null;

/**
 * FirestoreServiceのインスタンスを取得
 */
export function getFirestoreService(): FirestoreService {
  if (!firestoreServiceInstance) {
    firestoreServiceInstance = new FirestoreService();
  }
  return firestoreServiceInstance;
}