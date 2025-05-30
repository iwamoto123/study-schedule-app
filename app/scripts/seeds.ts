// scripts/seed.ts
// ---------------------------------------------
// Cloud Firestore エミュレータ／本番どちらでも使える
// テストデータ一括投入ユーティリティ
// ---------------------------------------------
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import dayjs from 'dayjs';

// ─────────────────────────────────────────────
// 1. Firebase 設定を環境変数から取得
//    NEXT_PUBLIC_FIREBASE_CONFIG は .env.local に JSON 文字列で入っている想定
// ─────────────────────────────────────────────
const rawConfig = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
if (!rawConfig) {
  console.error('❌  環境変数 NEXT_PUBLIC_FIREBASE_CONFIG が見つかりません');
  process.exit(1);
}
const firebaseConfig = JSON.parse(rawConfig);

// ─────────────────────────────────────────────
// 2. 初期化
// ─────────────────────────────────────────────
let app: FirebaseApp;
try {
  app = initializeApp(firebaseConfig);
} catch (e: any) {
  // initializeApp を複数回呼んでもいいように再利用
  if (e.code === 'app/duplicate-app') {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore – getApp は import しなくて OK
    app = (await import('firebase/app')).getApp();
  } else {
    console.error('❌  Firebase 初期化に失敗しました', e);
    process.exit(1);
  }
}
const db = getFirestore(app);

// ─────────────────────────────────────────────
// 3. パラメータ
// ─────────────────────────────────────────────
const uid = 'demoUser';

// 例: 2025-05-31 → 20250531
const dateKey = dayjs().format('YYYYMMDD');

const baseCol = collection(db, 'users', uid, 'todos', dateKey, 'items');

// ─────────────────────────────────────────────
// 4. データ定義 – 必要ならここを書き換える
// ─────────────────────────────────────────────
const seedItems: {
  id: string;
  title: string;
  unitType: 'pages' | 'problems' | 'words' | 'chapters' | 'none';
  planCount: number;
  done: number;
}[] = [
  { id: 'taskA', title: '参考書A', unitType: 'pages',    planCount: 10, done: 0 },
  { id: 'taskB', title: '参考書B', unitType: 'problems', planCount: 20, done: 0 },
  { id: 'taskC', title: '参考書C', unitType: 'pages',    planCount:  5, done: 0 },
];

// ─────────────────────────────────────────────
// 5. 書き込み
// ─────────────────────────────────────────────
(async () => {
  try {
    await Promise.all(
      seedItems.map((item) =>
        setDoc(
          doc(baseCol, item.id),
          {
            ...item,
            doneStart: null,
            doneEnd:   null,
            updatedAt: Timestamp.now(),
          },
          { merge: true },
        ),
      ),
    );

    console.log(
      `✅  Firestore seeding complete (${seedItems.length} items on ${dateKey})`,
    );
    process.exit(0);
  } catch (err) {
    console.error('❌  Firestore への書き込みに失敗しました', err);
    process.exit(1);
  }
})();
