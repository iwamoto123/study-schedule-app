import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';

export const firebaseConfig = JSON.parse(
  process.env.NEXT_PUBLIC_FIREBASE_CONFIG as string
);

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

/* v11.6: FirestoreSettings に useFetchStreams は無い */
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,  // ← 必要なければ {} だけでも可
  },
  'study-schedule-app'                   // ← あなたの Database ID
);
