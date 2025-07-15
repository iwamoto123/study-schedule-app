// app/materials/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  deleteDoc,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import StudyMaterialCard from '@/components/StudyMaterialCard';
import MaterialForm      from '@/components/MaterialForm';

import type { Material } from '@/types/material';   // ← 共通型だけを import

export default function MaterialsPage() {
  const uid = 'demoUser';

  /* ──────────────────────────────
   * 編集モーダル用 state
   * ────────────────────────────── */
  const [editing, setEditing] = useState<Material | null>(null);
  const closeModal  = ()      => setEditing(null);
  const handleEdit  = (m: Material) => setEditing(m);
  const handleDelete = async (m: Material) => {
    if (!confirm(`「${m.title}」を削除します。よろしいですか？`)) return;
    await deleteDoc(doc(db, 'users', uid, 'materials', m.id));
    // TODO: todos 側も連動削除するならここで
  };

  /* ──────────────────────────────
   * 一覧取得
   * ────────────────────────────── */
  const [list, setList] = useState<Material[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'users', uid, 'materials'),
      orderBy('createdAt', 'asc'),
    );

    return onSnapshot(q, snap => {
      const arr: Material[] = [];
      snap.forEach(d => {
        const data = d.data();

        arr.push({
          id:          d.id,
          title:       data.title,
          subject:     data.subject,
          unitType:    data.unitType,
          totalCount:  data.totalCount,
          dailyPlan:   data.dailyPlan ?? 0,
          completed:   data.completed ?? 0,   // ★ 0 を補完
          startDate:   data.startDate,
          deadline:    data.deadline,
          createdAt:   data.createdAt,
        });
      });
      setList(arr);
    });
  }, [uid]);

  /* ──────────────────────────────
   * 画面
   * ────────────────────────────── */
  return (
    <main className="mx-auto max-w-md space-y-8 p-4">
      <h1 className="text-xl font-bold">新しい参考書を登録</h1>

      {/* ---------- 登録フォーム ---------- */}
      <MaterialForm uid={uid} mode="create" onSaved={closeModal} />

      {/* ---------- 編集モーダル ---------- */}
      {editing && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onClick={closeModal}
        >
          <div
            className="w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <MaterialForm
              uid={uid}
              mode="update"
              docId={editing.id}
              defaultValues={editing}
              onSaved={closeModal}
              onCancel={closeModal}
            />
          </div>
        </div>
      )}

      {/* ---------- 一覧 ---------- */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">登録済みの参考書</h2>

        {list.map(m => (
          <StudyMaterialCard
            key={m.id}
            /* --- 基本情報 --- */
            id={m.id}
            title={m.title}
            subject={m.subject}
            unitType={m.unitType}
            totalCount={m.totalCount}
            /* --- 進捗表示 --- */
            planCount={m.dailyPlan}
            done={m.completed}
            startDate={m.startDate}
            deadline={m.deadline}
            /* --- 操作 --- */
            editable={false}
            onEdit={() => handleEdit(m)}
            onDelete={() => handleDelete(m)}
          />
        ))}
      </section>
    </main>
  );
}
