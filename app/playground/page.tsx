/* --------------------------------------------------------------
   Playground 画面
   ― InputSingle と StudyMaterialCard の動作確認用
   URL: http://localhost:3000/playground
-------------------------------------------------------------- */
'use client';

import { useState } from 'react';
import InputSingle from '@/components/InputSingle';
import StudyMaterialCard from '@/components/StudyMaterialCard';
import type { UnitType } from '@/components/StudyMaterialCard';

interface DummyItem {
  id: string;
  title: string;
  unitType: UnitType;
  planCount: number;
}

export default function Playground() {
  /* ---------- 単体テスト：InputSingle ---------- */
  const [single, setSingle] = useState(5);

  /* ---------- 複合テスト：StudyMaterialCard ---------- */
  const dummyList: DummyItem[] = [
    { id: '1', title: 'Vintage 英文法', unitType: 'pages',    planCount: 8 },
    { id: '2', title: '青チャートⅠ+A', unitType: 'problems', planCount: 20 },
  ];
  const [doneMap, setDoneMap] = useState<Record<string, number>>({});

  const handleSave = ({ id, doneCount }: { id: string; doneCount: number }) =>
    setDoneMap((prev) => ({ ...prev, [id]: doneCount }));

  return (
    <main className="mx-auto max-w-md space-y-8 p-6">
      <h1 className="text-xl font-bold">Playground</h1>

      {/* ---------- InputSingle テスト ---------- */}
      <section>
        <h2 className="mb-2 font-semibold">InputSingle</h2>
        <div className="flex items-center gap-3">
          <InputSingle value={single} onChange={setSingle} />
          <span className="text-sm text-gray-700">現在値: {single}</span>
        </div>
      </section>

      {/* ---------- StudyMaterialCard テスト ---------- */}
      <section>
        <h2 className="mb-2 font-semibold">StudyMaterialCard</h2>
        <div className="space-y-3">
          {dummyList.map((item) => (
            <StudyMaterialCard
              key={item.id}
              {...item}
              editable
              onSave={handleSave}
            />
          ))}
        </div>

        {/* 保存結果の確認用 */}
        <pre className="mt-4 rounded-md bg-gray-100 p-3 text-xs">
          {JSON.stringify(doneMap, null, 2)}
        </pre>
      </section>
    </main>
  );
}
