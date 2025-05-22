// 参考書登録ページ
'use client';

import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { useForm, Controller } from 'react-hook-form';
import {
  collection,
  addDoc,
  doc,
  setDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '@/lib/firebase';
import InputSingle from '@/components/InputSingle';
import RadioGroup  from '@/components/RadioGroup';
import StudyMaterialCard, { UnitType } from '@/components/StudyMaterialCard';

dayjs.extend(isSameOrBefore);

/* ---------------- 型 ---------------- */
interface FormValues {
  title: string;
  unitType: UnitType;
  totalCount: number;
  startDate: string;   // YYYY-MM-DD
  deadline: string;    // YYYY-MM-DD
  dailyPlan: number;   // 自動計算
}

export default function MaterialPage() {
  const uid = 'demoUser';

  /* ---------------- フォーム ---------------- */
  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { isValid },
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      title: '',
      unitType: 'pages',
      totalCount: 0,
      startDate:  dayjs().format('YYYY-MM-DD'),
      deadline:   '',
      dailyPlan:  0,
    },
  });

  /* ----- dailyPlan 自動計算 ----- */
  const totalCount = watch('totalCount');
  const startDate  = watch('startDate');
  const deadline   = watch('deadline');

  useEffect(() => {
    if (!totalCount || !startDate || !deadline) {
      setValue('dailyPlan', 0, { shouldValidate: true });
      return;
    }
    const days =
      dayjs(deadline).startOf('day').diff(dayjs(startDate).startOf('day'), 'day') + 1;
    setValue('dailyPlan', days > 0 ? Math.ceil(totalCount / days) : 0,
      { shouldValidate: true });
  }, [totalCount, startDate, deadline, setValue]);

  /* ---------------- 一覧取得 ---------------- */
  const [list, setList] = useState<any[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'users', uid, 'materials'),
      orderBy('createdAt', 'asc')
    );
    return onSnapshot(q, (snap) => {
      const arr: any[] = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      setList(arr);
    });
  }, []);

  /* ---------------- 送信 ---------------- */
  const onSubmit = async (data: FormValues) => {
    // ① materials に追加
    const matsCol = collection(db, 'users', uid, 'materials');
    const docRef  = await addDoc(matsCol, {
      ...data,
      createdAt: serverTimestamp(),
    });

    // ② 今日の todos/items にコピー（materialId を合わせる）
    const todayKey = dayjs().format('YYYYMMDD');
    await setDoc(
      doc(db, 'users', uid, 'todos', todayKey, 'items', docRef.id),
      {
        title:     data.title,
        unitType:  data.unitType,
        planCount: data.dailyPlan,
        done:      0,
      },
      { merge: true },
    );

    reset(); // フォーム初期化
  };

  /* ---------------- 画面 ---------------- */
  return (
    <main className="mx-auto max-w-md space-y-8 p-4">
      <h1 className="text-xl font-bold">参考書を登録</h1>

      {/* ---------- 登録フォーム ---------- */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 rounded-lg bg-white p-6 shadow"
      >
        {/* 参考書名 */}
        <div>
          <label className="block text-sm font-medium">参考書名</label>
          <input
            className="input-basic w-full"
            {...register('title', { required: true })}
          />
        </div>

        {/* 単位 */}
        <div>
          <label className="block text-sm font-medium">単位</label>
          <Controller
            control={control}
            name="unitType"
            render={({ field }) => (
              <RadioGroup
                options={[
                  { label: 'ページ', value: 'pages' },
                  { label: '問題',  value: 'problems' },
                ]}
                {...field}
              />
            )}
          />
        </div>

        {/* 総数 & １日当たり */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium">
              総{watch('unitType') === 'pages' ? 'ページ' : '問題'}数
            </label>
            <Controller
              control={control}
              name="totalCount"
              rules={{ min: 1 }}
              render={({ field }) => (
                <InputSingle {...field} className="w-full" />
              )}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium">1日あたり</label>
            <Controller
              control={control}
              name="dailyPlan"
              render={({ field }) => (
                <InputSingle {...field} readOnly className="w-full" />
              )}
            />
          </div>
        </div>

        {/* 開始日 & 目標達成日 */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium">開始日</label>
            <input
              type="date"
              className="input-basic w-full"
              {...register('startDate', {
                required: true,
                validate: (v) =>
                  dayjs(v).isSameOrBefore(dayjs(deadline), 'day') ||
                  '開始日は終了日以前にしてください',
              })}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium">目標達成日</label>
            <input
              type="date"
              className="input-basic w-full"
              {...register('deadline', { required: true })}
            />
          </div>
        </div>

        {/* 保存 */}
        <button
          type="submit"
          disabled={!isValid || watch('dailyPlan') === 0}
          className="w-full rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          ＋ 保存
        </button>
      </form>

      {/* ---------- 登録済み ---------- */}
      <section className="space-y-3">
        {list.map((m) => (
          <StudyMaterialCard
            key={m.id}
            id={m.id}
            title={m.title}
            unitType={m.unitType}
            planCount={m.dailyPlan}
            totalCount={m.totalCount}
            startDate={m.startDate}
            deadline={m.deadline}
            editable={false}
          />
        ))}
      </section>
    </main>
  );
}



//前Ver
// 'use client';
// import { useState, useEffect } from 'react';
// import { db } from '@/lib/firebase';
// import {
//   collection, addDoc, serverTimestamp, onSnapshot, query, orderBy
// } from 'firebase/firestore';
// import InputSingle from '@/components/InputSingle';
// import RadioGroup  from '@/components/RadioGroup';
// import StudyMaterialCard from '@/components/StudyMaterialCard';

// type UnitType = 'pages' | 'problems';

// interface Material {
//   id: string;
//   title: string;
//   unitType: UnitType;
//   totalCount: number;
//   dailyPlan: number;
//   deadline: string;
// }

// export default function MaterialNew() {
//   /* --- form state --- */
//   const [title, setTitle]         = useState('');
//   const [unitType, setUnitType]   = useState<UnitType>('pages');
//   const [total, setTotal]         = useState(0);
//   const [daily, setDaily]         = useState(0);
//   const [deadline, setDeadline]   = useState('');

//   /* --- list state --- */
//   const [list, setList] = useState<Material[]>([]);
//   const uid = 'demoUser';

//   /* --- realtime fetch --- */
//   useEffect(() => {
//     const q = query(
//       collection(db, 'users', uid, 'materials'),
//       orderBy('createdAt', 'asc')
//     );
//     return onSnapshot(q, (snap) => {
//       const arr: Material[] = [];
//       snap.forEach((d) => arr.push({ id: d.id, ...(d.data() as Omit<Material, 'id'>) }));
//       setList(arr);
//     });
//   }, []);

//   /* --- submit --- */
//   const handleSave = async () => {
//     if (!title || total <= 0 || daily <= 0) return;
//     await addDoc(collection(db, 'users', uid, 'materials'), {
//       title,
//       unitType,
//       totalCount: total,
//       dailyPlan:  daily,
//       deadline,
//       createdAt:  serverTimestamp(),
//     });
//     /* reset */
//     setTitle(''); setTotal(0); setDaily(0); setDeadline('');
//   };

//   return (
//     <main className="mx-auto max-w-md p-4 space-y-6">
//       <h1 className="text-xl font-bold">参考書を登録</h1>

//       {/* ---------- form ---------- */}
//       <div className="space-y-4 rounded-lg bg-white p-4 shadow">
//         <div>
//           <label className="block text-sm font-medium">参考書名</label>
//           <input
//             className="input-basic w-full"
//             value={title}
//             onChange={(e) => setTitle(e.target.value)}
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium">単位</label>
//           <RadioGroup
//             options={[
//               { label: 'ページ',   value: 'pages'   },
//               { label: '問題',    value: 'problems'},
//             ]}
//             value={unitType}
//             onChange={setUnitType}
//           />
//         </div>

//         <div className="flex gap-3">
//           <div className="flex-1">
//             <label className="block text-sm font-medium">総{unitType === 'pages' ? 'ページ' : '問題'}数</label>
//             <InputSingle value={total} onChange={setTotal} className="w-full" />
//           </div>
//           <div className="flex-1">
//             <label className="block text-sm font-medium">1日あたり</label>
//             <InputSingle value={daily} onChange={setDaily} className="w-full" />
//           </div>
//         </div>

//         <div>
//           <label className="block text-sm font-medium">目標達成日</label>
//           <input
//             type="date"
//             className="input-basic w-full"
//             value={deadline}
//             onChange={(e) => setDeadline(e.target.value)}
//           />
//         </div>

//         <button
//           onClick={handleSave}
//           className="w-full rounded-md bg-indigo-600 py-2 text-sm font-semibold text-white disabled:opacity-40"
//           disabled={!title || total <= 0 || daily <= 0}
//         >
//           ＋ 保存
//         </button>
//       </div>

//       {/* ---------- list ---------- */}
//       <section className="space-y-3">
//         {list.map((m) => (
//           <StudyMaterialCard
//             key={m.id}
//             id={m.id}
//             title={m.title}
//             unitType={m.unitType}
//             planCount={m.dailyPlan}
//             editable={false}
//             /* 編集アイコン & 遷移はここで拡張可 */
//           />
//         ))}
//       </section>
//     </main>
//   );
// }
