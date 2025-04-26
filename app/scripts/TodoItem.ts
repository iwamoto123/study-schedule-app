import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';

/**
 * タスクのデータモデル
 */
export interface TodoItem {
  id: string;
  title: string;
  unitType: 'pages' | 'problems';
  planCount: number;
  done: number;
}

/**
 * タスクを作成または上書きする
 */
export async function createTodoItem(
  uid: string,
  dateKey: string,
  todoItem: TodoItem
): Promise<void> {
  const itemsCol = collection(db, 'users', uid, 'todos', dateKey, 'items');
  await setDoc(doc(itemsCol, todoItem.id), todoItem);
}

/**
 * 指定ユーザー・指定日付の全タスクを取得する
 */
export async function fetchTodoItems(
  uid: string,
  dateKey: string
): Promise<TodoItem[]> {
  const itemsCol = collection(db, 'users', uid, 'todos', dateKey, 'items');
  const snapshot = await getDocs(itemsCol);
  return snapshot.docs.map(docSnap => docSnap.data() as TodoItem);
}

/**
 * 指定ユーザー・指定日付・ID の単一タスクを取得する
 */
export async function fetchTodoItem(
  uid: string,
  dateKey: string,
  id: string
): Promise<TodoItem | null> {
  const snap = await getDoc(doc(db, 'users', uid, 'todos', dateKey, 'items', id));
  return snap.exists() ? (snap.data() as TodoItem) : null;
}

/**
 * 既存タスクのフィールドを部分更新する
 */
export async function updateTodoItem(
  uid: string,
  dateKey: string,
  id: string,
  updates: Partial<Omit<TodoItem, 'id'>>
): Promise<void> {
  await updateDoc(doc(db, 'users', uid, 'todos', dateKey, 'items', id), updates);
}

/**
 * タスクを削除する
 */
export async function deleteTodoItem(
  uid: string,
  dateKey: string,
  id: string
): Promise<void> {
  await deleteDoc(doc(db, 'users', uid, 'todos', dateKey, 'items', id));
}
