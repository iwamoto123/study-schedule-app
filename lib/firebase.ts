/* =====================================================================
 * Firebase クライアント初期化 & 開発時エミュレータ接続
 *   - Client Component 専用（`'use client'`）
 *   - Firestore / Auth のみ使用
 * =================================================================== */
'use client';

import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseOptions,
} from 'firebase/app';

import {
  getFirestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';

import {
  getAuth,
  connectAuthEmulator,
} from 'firebase/auth';

/* -------------------------------------------------------------------
 * 1. FirebaseConfig を .env から取得
 *    .env.local 例）
 *      NEXT_PUBLIC_FIREBASE_CONFIG='{"apiKey":"...","authDomain":"...","projectId":"...","appId":"..."}'
 *      NEXT_PUBLIC_EMULATOR=true
 * ------------------------------------------------------------------ */
let firebaseConfig: FirebaseOptions;

try {
  const configString = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
  if (!configString) {
    throw new Error('NEXT_PUBLIC_FIREBASE_CONFIG is not defined');
  }
  firebaseConfig = JSON.parse(configString) as FirebaseOptions;
} catch (error) {
  console.error('Failed to parse Firebase config:', error);
  // デフォルト値を使用（ビルド時のエラーを回避）
  firebaseConfig = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: "",
  };
}

/* -------------------------------------------------------------------
 * 2. Firebase App 初期化（既にあれば再利用）
 * ------------------------------------------------------------------ */
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/* -------------------------------------------------------------------
 * 3. Firestore 初期化
 *    - getFirestore (uses default database)
 * ------------------------------------------------------------------ */
export const db = getFirestore(app);

/* -------------------------------------------------------------------
 * 4. Authentication 初期化
 * ------------------------------------------------------------------ */
export const auth = getAuth(app);

/* -------------------------------------------------------------------
 * 5. 開発時は Firestore / Auth エミュレータに接続
 * ------------------------------------------------------------------ */
if (process.env.NEXT_PUBLIC_EMULATOR === 'true') {
  /* Firestore → localhost:8080 */
  connectFirestoreEmulator(db, 'localhost', 8080);

  /* Auth → localhost:9099 */
  connectAuthEmulator(auth, 'http://localhost:9099', {
    disableWarnings: true,
  });
}
