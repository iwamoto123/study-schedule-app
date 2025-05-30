'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,           
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProgressCard from '@/components/ProgressCard';
import { validateTodo, ValidatedTodo } from '@/lib/validators';
import { format } from 'date-fns';      

export default function ProgressPage() {
  /* ユーザーと日付キー */
  const uid = 'demoUser';                       // 認証未実装なら固定で OK
  const todayKey = format(new Date(), 'yyyyMMdd');

  /* 進捗データ */
  const [todos, setTodos] = useState<ValidatedTodo[]>([]);

  /* Firestore 購読 */
  useEffect(() => {
    const col = collection(db, 'users', uid, 'todos', todayKey, 'items');
    const unsub = onSnapshot(col, snap => {
      const next: ValidatedTodo[] = [];
      snap.forEach(d => {
        const v = validateTodo(d.data(), d.id);
        if (v) next.push(v);
      });
      setTodos(next);
    });
    return () => unsub();
  }, [uid, todayKey]);

  /* 保存ハンドラ（async に変更） */
  const handleSave = async ({
    id,
    doneStart,
    doneEnd,
  }: {
    id: string;
    doneStart: number | null;
    doneEnd:   number | null;
  }) => {
    await setDoc(
      doc(db, 'users', uid, 'todos', todayKey, 'items', id),
      { doneStart, doneEnd },
      { merge: true },
    );
  };

  /* UI */
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4">
      {todos.map(t => (
        <ProgressCard
          key={t.id}
          {...t}
          onSave={handleSave}
        />
      ))}
      {todos.length === 0 && (
        <p className="text-center text-sm text-gray-500">
          登録された教材がありません
        </p>
      )}
    </div>
  );
}
