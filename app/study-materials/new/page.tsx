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
}

export default function ProgressInputPage() {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const uid = 'demoUser';
  const todayKey = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  /* 当日の予定を取得 */
  useEffect(() => {
    (async () => {
      const snap = await getDocs(
        collection(db, 'users', uid, 'todos', todayKey, 'items')
      );
      const list: TodoItem[] = [];
      snap.forEach((d) => list.push(d.data() as TodoItem));
      setTodos(list);
    })();
  }, []);

  /* 保存 */
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
      <h1 className="text-xl font-bold">今日の進捗入力</h1>

      {todos.map((t) => (
        <StudyMaterialCard
          key={t.id}
          {...t}
          editable
          onSave={handleSave}
        />
      ))}
    </main>
  );
}
