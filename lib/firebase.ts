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

(() => {
  const configString = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
  if (!configString) {
    const msg = '[Firebase] NEXT_PUBLIC_FIREBASE_CONFIG is not defined. Set valid JSON string in .env.local.';
    console.error(msg);
    throw new Error(msg);
  }
  try {
    firebaseConfig = JSON.parse(configString) as FirebaseOptions;
  } catch (error) {
    const msg = '[Firebase] Failed to parse NEXT_PUBLIC_FIREBASE_CONFIG. Ensure it is a valid JSON string.';
    console.error(msg, error);
    throw new Error(msg);
  }
})();

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
// エミュレータ接続は明示的に開発環境のみ
const isBrowser = typeof window !== 'undefined';
const host = isBrowser ? window.location.hostname : '';
const wantEmu = process.env.NEXT_PUBLIC_EMULATOR === 'true';
const devHost = ['localhost', '127.0.0.1'].includes(host);
const isDev = process.env.NODE_ENV === 'development';
const shouldUseEmulator = wantEmu || (isBrowser && isDev && devHost);

if (shouldUseEmulator) {
  try {
    /* Firestore → localhost:8080 */
    connectFirestoreEmulator(db, 'localhost', 8080);

    /* Auth → localhost:9099 */
    connectAuthEmulator(auth, 'http://localhost:9099', {
      disableWarnings: true,
    });

    console.log('🔧 Connected to Firebase emulators');
  } catch (error) {
    console.log('⚠️ Emulator connection failed:', error);
  }
} else {
  console.log('🔥 Connected to production Firebase');
}
