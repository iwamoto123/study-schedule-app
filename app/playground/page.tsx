/* --------------------------------------------------------------
   Playground 画面
   ― Firestore接続テスト用
   URL: http://localhost:3000/playground
-------------------------------------------------------------- */
'use client';

import FirestoreTestPanel from '@/components/FirestoreTestPanel';

export default function Playground() {
  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold text-center mb-8">🧪 Playground - Firestore Test</h1>
        <FirestoreTestPanel />
      </div>
    </main>
  );
}
