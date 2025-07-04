// components/ProgressCard.tsx
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import * as Slider from '@radix-ui/react-slider';
import debounce    from 'lodash-es/debounce';
import clsx        from 'clsx';

import { clampNumber }   from '@/lib/validators';
import InputSingle       from '@/components/InputSingle';
import { Subject }       from '@/types/common';
import { subjectLabel, unitLabel }  from '@/components/StudyMaterialCard'; // 既存を再利用


/* ---------- 型定義 ---------- */
export type UnitType =
  | 'pages' | 'problems' | 'words' | 'chapters' | 'none';

interface ProgressCardProps {
  id:       string;
  title:    string;     // ★ 追加
  subject:  Subject;    // ★ 追加
  unitType: UnitType;

  /* 計画・総量 */
  plannedStart: number;
  plannedEnd:   number;
  totalStart:   number;
  totalEnd:     number;

  /* 実績 */
  doneStart: number | null;
  doneEnd:   number | null;

  onSave: (p: { id: string; doneStart: number | null; doneEnd: number | null }) => void;
}

/* ===================================================================== */
export default function ProgressCard(props: ProgressCardProps) {
  const {
    id, title, subject, unitType,
    plannedStart, plannedEnd, totalStart, totalEnd,
    doneStart, doneEnd, onSave,
  } = props;

  /* state */
  // 開始時期のスライダー位置
  const [start, setStart] = useState(doneStart ?? plannedStart);
  // 終了時期のスライダー位置
  const [end,   setEnd]   = useState(doneEnd   ?? plannedEnd);

  const unit   = unitLabel[unitType];
  const isDone = start === plannedStart && end === plannedEnd;
  const safeStart = clampNumber(start, totalStart, totalEnd);
  const safeEnd   = clampNumber(end,   totalStart, totalEnd);

  /* 保存 (debounce) */
  const first = useRef(true);
  const debouncedSave = useMemo(() => debounce(onSave, 500), [onSave]);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    debouncedSave({ id, doneStart: start, doneEnd: end });
  }, [id, start, end, debouncedSave]);

  /* UI */
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
      {/* ── ヘッダー ───────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-center text-sm font-semibold text-indigo-600">
            {subjectLabel[subject]}
          </p>
          <h3 className="mt-1 text-xl font-bold text-gray-900 break-words">
            {title}
          </h3>
          <p className="text-xs text-gray-500">
            目標ペース {plannedEnd - plannedStart + 1} {unit}/日
          </p>
        </div>

        {/* 完了トグル */}
        <button
          onClick={() => {
            if (isDone) {
              const r = Math.max(plannedStart - 1, totalStart);
              setStart(r); setEnd(r);
            } else {
              setStart(plannedStart); setEnd(plannedEnd);
            }
          }}
          className={clsx(
            'h-9 w-9 shrink-0 rounded-full ring-2 ring-inset transition',
            isDone
              ? 'bg-indigo-500 ring-indigo-500 text-white'
              : 'bg-gray-100 ring-gray-300 text-gray-300',
          )}
          aria-label="予定どおり完了"
        >
          {isDone && '✓'}
        </button>
      </div>

      {/* ── 範囲・合計行 ───────────────── */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-xs text-gray-500">範囲</span>
        <InputSingle readOnly value={safeStart}
          className={clsx('w-12 text-center', isDone ? 'text-gray-900' : 'text-gray-400')} />
        <span>〜</span>
        <InputSingle readOnly value={safeEnd}
          className={clsx('w-12 text-center', isDone ? 'text-gray-900' : 'text-gray-400')} />
        <span>{unit}</span>

        <span className="mx-2 text-gray-300">｜</span>

        <span className="text-xs text-gray-500">合計</span>
        <InputSingle readOnly value={safeEnd - safeStart + 1}
          className={clsx('w-12 text-center', isDone ? 'text-gray-900' : 'text-gray-400')} />
        <span>{unit}</span>
      </div>

      {/* ── スライダー ───────────────── */}
      <div>
        <div className="mb-1 flex justify-between text-[11px] text-gray-400">
          <span>{totalStart}</span><span>{plannedStart}</span>
          <span>{plannedEnd}</span><span>{totalEnd}</span>
        </div>

        <Slider.Root
          className="relative flex h-5 w-full select-none items-center"
          min={totalStart}
          max={totalEnd}

          value={[safeStart, safeEnd]}
          onValueChange={([s, e]) => { 
            console.log("XXX Slider onValueChange s: ", s, ", e: ", e)
            setStart(s); 
            setEnd(e);
          }}
        >
          <Slider.Track className="relative h-2 w-full rounded-full bg-gray-300">
            <Slider.Range className="absolute h-full rounded-full bg-indigo-500" />
          </Slider.Track>
          {/** Start & End thumb */}
          {[0, 1].map(i => (
            <Slider.Thumb
              key={i}
              className="
                z-10 block h-4 w-4 rounded-full bg-white
                shadow-[0_0_4px_2px_rgba(0,0,0,0.25)] ring-1 ring-gray-300
                hover:bg-indigo-100 transition-colors
                focus:outline-none focus:ring-2 focus:ring-indigo-500
              "
              style={{
                boxShadow: "1px 1px 6px gray"
              }}
            />
          ))}
        </Slider.Root>
      </div>
    </div>
  );
}


///ui/ProgressCard.tsx

// 'use client';

// /* =======================================================================
//  * ProgressCard ― 1 教材分の「今日の進捗」入力カード
//  * ===================================================================== */
// import { useState, useEffect, useMemo, useRef } from 'react';
// import * as Slider from '@radix-ui/react-slider';
// import { clampNumber } from '@/lib/validators';
// import debounce from 'lodash-es/debounce';

// /* ---------- 型定義 ---------- */
// export type UnitType =
//   | 'pages' | 'problems' | 'words' | 'chapters' | 'none';

// interface ProgressCardProps {
//   id:            string;
//   unitType:      UnitType;

//   /* 計画・総量 */
//   plannedStart:  number;
//   plannedEnd:    number;
//   totalStart:    number;
//   totalEnd:      number;

//   /* 実績（null = まだ入力していない） */
//   doneStart:     number | null;
//   doneEnd:       number | null;

//   /* Firestore へ保存するコールバック */
//   onSave: (p: {
//     id: string;
//     doneStart: number | null;
//     doneEnd:   number | null;
//   }) => void;
// }

// /* ---------- 単位ラベル ---------- */
// const unitLabel: Record<UnitType, string> = {
//   pages:    'ページ',
//   problems: '問題',
//   words:    '単語',
//   chapters: '章',
//   none:     '',
// };

// /* =======================================================================
//  * Component
//  * ===================================================================== */
// export default function ProgressCard({
//   id,
//   unitType,

//   plannedStart,
//   plannedEnd,
//   totalStart,
//   totalEnd,

//   doneStart,
//   doneEnd,

//   onSave,
// }: ProgressCardProps) {
//   /* ------------------ state ------------------ */
//   const [start, setStart] = useState<number>(
//     doneStart ?? plannedStart,
//   );
//   const [end, setEnd]     = useState<number>(
//     doneEnd   ?? plannedEnd,
//   );

//   /* ------------------ ヘルパ ------------------ */
//   const unit = unitLabel[unitType];

//   /** 入力が存在するか */
//   const hasInput = doneStart !== null && doneEnd !== null;

//   /** 「予定どおり完了か」を厳密に判定 */
//   const isDone = hasInput &&
//     start === plannedStart &&
//     end   === plannedEnd;

//   /* ------------------ Slider 値域を安全化 ------------------ */
//   const safeStart = clampNumber(start, totalStart, totalEnd);
//   const safeEnd   = clampNumber(end,   totalStart, totalEnd);

//   /* ------------------ Firestore 保存 ------------------ */
//   const firstRender = useRef(true);
//   const debouncedSave = useMemo(
//   () => debounce(onSave, 500),   // 500ms 無操作でまとめて保存
//   [onSave],
// );

// useEffect(() => {
//   if (firstRender.current) {
//     firstRender.current = false;
//     return;
//   }
//   debouncedSave({ id, doneStart: start, doneEnd: end });
// }, [id, start, end, debouncedSave]);
//   /* ------------------ UI ------------------ */
//   return (
//     <div className="flex flex-col gap-3 rounded-xl border p-4 shadow-sm">
//       {/* 進捗バー */}
//       <div className="h-2 w-full rounded-full bg-gray-200">
//         <div
//           style={{ width: `${((safeEnd - totalStart + 1) /
//                                (totalEnd - totalStart + 1)) * 100}%` }}
//           className="h-full rounded-full bg-indigo-500 transition-all"
//         />
//       </div>

//       {/* スライダー */}
//       <Slider.Root
//         className="relative flex h-5 w-full touch-none select-none items-center"
//         min={totalStart}
//         max={totalEnd}
//         value={[safeStart, safeEnd]}
//         onValueChange={([s, e]) => {
//           setStart(s);
//           setEnd(e);
//         }}
//       >
//         <Slider.Track className="relative h-1 w-full grow rounded-full bg-gray-300">
//           <Slider.Range className="absolute h-full rounded-full bg-indigo-500" />
//         </Slider.Track>
//         <Slider.Thumb
//           className="block h-4 w-4 rounded-full bg-white shadow-[0_0_4px_2px_rgba(0,0,0,0.25)] ring-1 ring-gray-300 transition-colors hover:bg-indigo-50 hover:ring-indigo-400 "
//           aria-label="Start"
//         />
//         <Slider.Thumb
//           className="block h-4 w-4 rounded-full bg-white shadow-sm ring-1 ring-gray-300 transition-colors hover:bg-indigo-50 hover:ring-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
//           aria-label="End"
//         />
//       </Slider.Root>

//       {/* 範囲表示 + 完了トグル */}
//       <div className="flex items-center justify-between text-sm">
//         <span>
//           {safeStart.toLocaleString()} – {safeEnd.toLocaleString()} {unit}
//         </span>

//         <button
//           type="button"
//           onClick={() => {
//             if (isDone) {
          
//               const reset = Math.max(plannedStart - 1, totalStart);
//               setStart(reset);
//               setEnd(reset);
        
//             } else {
//               // 予定どおり完了へ
//               setStart(plannedStart);
//               setEnd(plannedEnd);
//             }
//           }}
//           className={`
//             flex h-6 w-6 items-center justify-center rounded-full border
//             ${isDone
//               ? 'border-indigo-600 bg-indigo-600 text-white'
//               : 'border-gray-300 bg-white text-gray-400'}
//           `}
//           aria-label={isDone ? '未入力に戻す' : '予定どおり完了にする'}
//         >
//           ✓
//         </button>
//       </div>
//     </div>
//   );
// }
