// lib/firebase.ts
'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';

/* ==========================================================
 * 1. FirebaseConfig は .env から取得
 * ========================================================= */
const firebaseConfig = JSON.parse(
  process.env.NEXT_PUBLIC_FIREBASE_CONFIG as string,
);

/* ==========================================================
 * 2. Firebase App 初期化（既にあれば再利用）
 * ========================================================= */
export const app =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

/* ==========================================================
 * 3. Firestore 初期化
 *    - experimentalForceLongPolling: ネットワーク相性対策
 *    - 第3引数: databaseId（単一 DB なら省略可）
 * ========================================================= */
export const db = initializeFirestore(
  app,
  { experimentalForceLongPolling: true },
  'study-schedule-app',
);

/* ==========================================================
 * 4. 開発時は Emulator に接続
 *    .env.local ⇒ NEXT_PUBLIC_EMULATOR=true
 * ========================================================= */
if (process.env.NEXT_PUBLIC_EMULATOR === 'true') {
  connectFirestoreEmulator(db, 'localhost', 8080);
}
