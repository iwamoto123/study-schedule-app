'use client';
import { useEffect, useState } from 'react';
import StudyMaterialCard, { UnitType } from '@/components/StudyMaterialCard';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  increment,
} from 'firebase/firestore';

interface TodoItem {
  id: string;
  title: string;
  unitType: UnitType;
  planCount: number;
  done?: number;
}

export default function TodayPage() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const uid      = 'demoUser';
  const todayKey = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  /* --- 当日のデータ取得 --- */
  useEffect(() => {
    (async () => {
      const snap = await getDocs(
        collection(db, 'users', uid, 'todos', todayKey, 'items')
      );
      const arr: TodoItem[] = [];
      snap.forEach((d) => arr.push(d.data() as TodoItem));
      setTodos(arr);
      console.log('todayKey =', todayKey); 
      console.log('docs size =', snap.size);
    })().catch(console.error);
  }, []);

  /* --- 保存処理 (done を加算) --- */
  const handleSave = async ({
    id,
    doneCount,
  }: {
    id: string;
    doneCount: number;
  }) => {
    await updateDoc(
      doc(db, 'users', uid, 'todos', todayKey, 'items', id),
      { done: increment(doneCount) }
    );
  };

  return (
    <main className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-xl font-bold">1日のToDoリスト</h1>

      {todos.map((t) => (
        <StudyMaterialCard
          key={t.id}
          {...t}
          editable
          onSave={handleSave}
        />
      ))}

      {todos.length === 0 && (
        <p className="text-center text-sm text-gray-500">
          今日の予定はありません
        </p>
      )}
    </main>
  );
}


