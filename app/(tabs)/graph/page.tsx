// app/(tabs)/graph/page.tsx
'use client';

import { useEffect, useState } from 'react';
import {
  collection, onSnapshot, query, orderBy,
} from 'firebase/firestore';
import dayjs   from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import isBetween from 'dayjs/plugin/isBetween';
import classNames from 'classnames';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

import { db, auth }      from '@/lib/firebase';
import { useAuthState }  from 'react-firebase-hooks/auth';
import GraphCard, {
  type GraphDataPoint,
} from '@/components/GraphCard';
import { calcTodayPlan } from '@/lib/calcTodayPlan';
import type { Material } from '@/types/material';

interface ProgressLog { date: string; done: number }

export default function ProgressGraphPage() {
  /* ----------- Hooks は無条件で並べる ----------- */
  const [user] = useAuthState(auth);            // authLoading は不要
  const uid    = user?.uid ?? '';               // 空文字ならクエリが走らない

  const [materials, setMaterials] = useState<Material[]>([]);
  const [graphs,    setGraphs]    = useState<Record<string, GraphDataPoint[]>>(
    {},
  );
  const [range,     setRange]     = useState<'all' | 'week'>('all');

  /* ----------- materials 購読 ----------- */
  useEffect(() => {
    if (!uid) return;                     // 未ログインなら何もしない
    const col = collection(db, 'users', uid, 'materials');
    const q   = query(col, orderBy('createdAt', 'asc'));

    return onSnapshot(q, snap => {
      const list: Material[] = [];
      snap.forEach(doc => {
        const d = doc.data();
        if (d.startDate && d.deadline) {
          const m: Material = {
            id: doc.id,
            title: d.title,
            totalCount: d.totalCount,
            unitType: d.unitType,
            startDate: d.startDate,
            deadline:  d.deadline,
            subject:   d.subject,
            completed: d.completed  ?? 0,
            dailyPlan: d.dailyPlan  ?? 0,
          };
          m.todayPlan = calcTodayPlan(m);
          list.push(m);
        }
      });
      setMaterials(list);
    });
  }, [uid]);

  /* ----------- logs → グラフ ----------- */
  useEffect(() => {
    if (!uid || materials.length === 0) return;

    const unsubList = materials.map(mat => {
      const col = collection(db, 'users', uid, 'materials', mat.id, 'logs');
      const q   = query(col, orderBy('date', 'asc'));

      return onSnapshot(q, snap => {
        const logs: ProgressLog[] = [];
        snap.forEach(d => logs.push(d.data() as ProgressLog));

        /* データ点計算 */
        const totalDays   = dayjs(mat.deadline).diff(dayjs(mat.startDate), 'day') + 1;
        const idealPerDay = mat.totalCount / totalDays;
        const pts: GraphDataPoint[] = [];

        pts.push({
          date: dayjs(mat.startDate).subtract(1, 'day').format('M/D'),
          actual: mat.totalCount,
          ideal : mat.totalCount,
        });

        for (let i = 0; i < totalDays; i += 1) {
          const cur   = dayjs(mat.startDate).add(i, 'day');
          const log   = logs.find(l => dayjs(l.date).isSame(cur, 'day'));
          const actual = log ? Math.max(mat.totalCount - log.done, 0) : null;
          const ideal  = Math.max(
            mat.totalCount - Math.round(idealPerDay * (i + 1)),
            0,
          );
          pts.push({ date: cur.format('M/D'), actual, ideal });
        }
        setGraphs(prev => ({ ...prev, [mat.id]: pts }));
      });
    });
    return () => unsubList.forEach(u => u());
  }, [uid, materials]);

  /* ----------- 週表示変換 ----------- */
  const toWeekPoints = (src: GraphDataPoint[]) => {
    const monday  = dayjs().startOf('isoWeek');
    const labels  = [...Array(7)].map((_, i) =>
      monday.add(i, 'day').format('M/D'),
    );
    const map     = new Map(src.map(p => [p.date, p]));
    const first   = labels.findIndex(l => map.has(l));
    let lastIdeal = first >= 0 ? map.get(labels[first])!.ideal : 0;

    return labels.map((lab, idx) => {
      const found = map.get(lab);
      if (found) {
        lastIdeal = found.ideal;
        return found;
      }
      if (idx < first) return { date: lab, actual: null, ideal: null };
      return { date: lab, actual: null, ideal: lastIdeal };
    });
  };

  /* ----------- レンダリング ----------- */
  if (!user) return <p className="p-4">ログインしてください</p>;

  return (
    <main className="mx-auto w-full max-w-none space-y-8 p-4 md:max-w-3xl">
      <h1 className="text-xl font-bold">進捗グラフ</h1>

      {/* 範囲タブ */}
      <div className="mb-6 flex space-x-2 border-b">
        {(['all', 'week'] as const).map(t => (
          <button
            key={t}
            onClick={() => setRange(t)}
            className={classNames(
              'px-4 py-2 text-sm font-semibold',
              range === t
                ? 'border-b-2 border-indigo-500 text-indigo-600'
                : 'text-gray-400 hover:text-indigo-600',
            )}
          >
            {t === 'all' ? '全期間' : '1週間'}
          </button>
        ))}
      </div>

      {materials.map(mat => {
        const all  = graphs[mat.id] ?? [];
        const data = range === 'all' ? all : toWeekPoints(all);
        return <GraphCard key={mat.id} material={mat} data={data} />;
      })}

      {materials.length === 0 && (
        <p className="text-center text-sm text-gray-500">
          登録された教材がありません
        </p>
      )}
    </main>
  );
}


// // app/graph/page.tsx
// 'use client';

// import { useEffect, useState } from 'react';
// import {
//   collection,
//   onSnapshot,
//   query,
//   orderBy,
// } from 'firebase/firestore';
// import { db, auth } from '@/lib/firebase';
// import { useAuthState } from 'react-firebase-hooks/auth';

// import dayjs from 'dayjs';
// import isoWeek from 'dayjs/plugin/isoWeek';
// import isBetween from 'dayjs/plugin/isBetween';
// import classNames from 'classnames';

// import GraphCard, { GraphDataPoint } from '@/components/GraphCard';
// import { calcTodayPlan } from '@/lib/calcTodayPlan';
// import type { Material } from '@/types/material';

// dayjs.extend(isoWeek);
// dayjs.extend(isBetween);

// /* ---------- Firestore サブコレクション型 ---------- */
// interface ProgressLog {
//   date: string; // YYYY-MM-DD
//   done: number; // 累積完了数
// }

// export default function ProgressGraphPage() {
//   /* ------------------------------ ① Hooks は無条件で宣言 ------------------------------ */
//   const [user, loadingAuth] = useAuthState(auth);          // 認証
//   const [materials, setMaterials] = useState<Material[]>([]);
//   const [graphs, setGraphs] = useState<Record<string, GraphDataPoint[]>>({});
//   const [range, setRange] = useState<'all' | 'week'>('all');

//   const uid: string | undefined = user?.uid;               // user が null の場合 undefined

//   /* ------------------------------ ② 認証状態で早期リターン ------------------------------ */
//   if (loadingAuth) return <p className="p-4">読み込み中...</p>;
//   if (!uid)        return <p className="p-4">ログインしてください</p>;

//   /* ------------------------------ ③ materials 購読 ------------------------------ */
//   useEffect(() => {
//     if (!uid) return;                                      // safety ガード

//     const matsCol = collection(db, 'users', uid, 'materials');
//     const q = query(matsCol, orderBy('createdAt', 'asc'));

//     const unsub = onSnapshot(q, snap => {
//       const list: Material[] = [];

//       snap.forEach(docSnap => {
//         const d = docSnap.data();
//         if (d.startDate && d.deadline) {
//           const m: Material = {
//             id: docSnap.id,
//             title: d.title,
//             totalCount: d.totalCount,
//             unitType: d.unitType,
//             startDate: d.startDate,
//             deadline: d.deadline,
//             subject: d.subject,
//             completed: d.completed ?? 0,
//             dailyPlan: d.dailyPlan ?? 0,
//           };
//           m.todayPlan = calcTodayPlan(m);
//           list.push(m);
//         }
//       });

//       setMaterials(list);
//     });

//     return () => unsub();
//   }, [uid]);

//   /* ------------------------------ ④ logs → グラフデータ ------------------------------ */
//   useEffect(() => {
//     if (!uid || materials.length === 0) return;

//     /* materials.forEach の中でリスナーを張る。
//        既存リスナーのクリーンアップのため、戻り値でまとめて unsubscribe */
//     const unsubs = materials.map(mat => {
//       const logsCol = collection(db, 'users', uid, 'materials', mat.id, 'logs');
//       const q = query(logsCol, orderBy('date', 'asc'));

//       return onSnapshot(q, snap => {
//         const logs: ProgressLog[] = [];
//         snap.forEach(d => logs.push(d.data() as ProgressLog));

//         const totalDays = dayjs(mat.deadline).diff(dayjs(mat.startDate), 'day') + 1;
//         const idealPerDay = mat.totalCount / totalDays;

//         const pts: GraphDataPoint[] = [
//           /* 開始日前日を 0 点目 */
//           {
//             date: dayjs(mat.startDate).subtract(1, 'day').format('M/D'),
//             actual: mat.totalCount,
//             ideal: mat.totalCount,
//           },
//         ];

//         for (let i = 0; i < totalDays; i += 1) {
//           const cur = dayjs(mat.startDate).add(i, 'day');
//           const log = logs.find(l => dayjs(l.date).isSame(cur, 'day'));
//           const actual = log ? Math.max(mat.totalCount - log.done, 0) : null;
//           const ideal = Math.max(
//             mat.totalCount - Math.round(idealPerDay * (i + 1)),
//             0,
//           );

//           pts.push({ date: cur.format('M/D'), actual, ideal });
//         }

//         setGraphs(prev => ({ ...prev, [mat.id]: pts }));
//       });
//     });

//     /* 片付け */
//     return () => unsubs.forEach(unsub => unsub());
//   }, [uid, materials]);

//   /* ------------------------------ ⑤ 週次データ整形 ------------------------------ */
//   const getCurrentWeekPoints = (src: GraphDataPoint[]): GraphDataPoint[] => {
//     const monday = dayjs().startOf('isoWeek');
//     const labels = Array.from({ length: 7 }, (_, i) =>
//       monday.add(i, 'day').format('M/D'),
//     );

//     const map = new Map(src.map(p => [p.date, p]));
//     const firstIdx = labels.findIndex(label => map.has(label));
//     let lastIdeal =
//       firstIdx >= 0 ? map.get(labels[firstIdx])!.ideal : 0;

//     return labels.map((label, idx) => {
//       const found = map.get(label);
//       if (found) {
//         lastIdeal = found.ideal;
//         return found;
//       }
//       /* 過去か未来で分岐 */
//       if (idx < firstIdx) return { date: label, actual: null, ideal: null };
//       return { date: label, actual: null, ideal: lastIdeal };
//     });
//   };

//   /* ------------------------------ ⑥ 画面 ------------------------------ */
//   return (
//     <main className="mx-auto w-full max-w-none p-4 space-y-8 md:max-w-3xl">
//       <h1 className="text-xl font-bold">進捗グラフ</h1>

//       {/* 範囲タブ */}
//       <div className="mb-6 flex space-x-2 border-b">
//         {(['all', 'week'] as const).map(tab => (
//           <button
//             key={tab}
//             onClick={() => setRange(tab)}
//             className={classNames(
//               'px-4 py-2 text-sm font-semibold',
//               range === tab
//                 ? 'border-b-2 border-indigo-500 text-indigo-600'
//                 : 'text-gray-400 hover:text-indigo-600',
//             )}
//           >
//             {tab === 'all' ? '全期間' : '1週間'}
//           </button>
//         ))}
//       </div>

//       {/* グラフカード群 */}
//       {materials.map(mat => {
//         const allPts = graphs[mat.id] ?? [];
//         const data =
//           range === 'all' ? allPts : getCurrentWeekPoints(allPts);
//         return <GraphCard key={mat.id} material={mat} data={data} />;
//       })}

//       {materials.length === 0 && (
//         <p className="text-center text-sm text-gray-500">
//           登録された教材がありません
//         </p>
//       )}
//     </main>
//   );
// }
