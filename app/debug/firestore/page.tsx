'use client';

import { useState, useCallback } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
} from 'firebase/firestore';
import dayjs from 'dayjs';

export default function FirestoreDebugPage() {
  const [user] = useAuthState(auth);
  const [log, setLog] = useState<string>('');

  const append = useCallback((line: string) => {
    setLog(prev => prev + (prev ? '\n' : '') + line);
  }, []);

  const doRead = useCallback(async () => {
    setLog('');
    if (!user) { append('No user. Please login.'); return; }
    try {
      const col = collection(db, 'users', user.uid, 'materials');
      const snap = await getDocs(col);
      append(`Read ok. size=${snap.size}`);
    } catch (e: any) {
      append(`Read error: ${e?.code || ''} ${e?.message || e}`);
    }
  }, [append, user]);

  const doWrite = useCallback(async () => {
    setLog('');
    if (!user) { append('No user. Please login.'); return; }
    try {
      const ref = await addDoc(collection(db, 'users', user.uid, 'materials'), {
        title: 'Debug Material',
        subject: 'math',
        unitType: 'pages',
        totalCount: 10,
        dailyPlan: 1,
        createdAt: serverTimestamp(),
        startDate: dayjs().format('YYYY-MM-DD'),
        deadline: dayjs().add(7, 'day').format('YYYY-MM-DD'),
      });
      append(`Write ok. id=${ref.id}`);

      const today = dayjs().format('YYYYMMDD');
      await setDoc(
        doc(db, 'users', user.uid, 'todos', today, 'items', ref.id),
        { title: 'Debug Material', unitType: 'pages', planCount: 1, done: 0 },
        { merge: true },
      );
      append('Todos set ok.');
    } catch (e: any) {
      append(`Write error: ${e?.code || ''} ${e?.message || e}`);
    }
  }, [append, user]);

  if (process.env.NEXT_PUBLIC_DEBUG !== 'true') {
    return <div className="p-4 text-sm text-gray-500">Debug page disabled</div>;
  }

  return (
    <main className="mx-auto max-w-xl space-y-4 p-4">
      <h1 className="text-lg font-bold">Firestore Debug</h1>
      <p className="text-sm text-gray-600">Login required. Use buttons to test read/write.</p>
      <div className="flex gap-2">
        <button className="rounded bg-gray-100 px-3 py-2" onClick={doRead}>Test Read</button>
        <button className="rounded bg-indigo-100 px-3 py-2" onClick={doWrite}>Test Write</button>
      </div>
      <pre className="rounded bg-black/80 p-3 text-xs text-green-100 whitespace-pre-wrap">{log || 'no logs'}</pre>
    </main>
  );
}

