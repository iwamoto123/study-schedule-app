// app/scripts/seeds.ts
// -------------------------------------------------------------
// Cloud Firestore にテストデータを一括投入するユーティリティ
//   - エミュレータ／本番どちらでも使用可
//   - NEXT_PUBLIC_FIREBASE_CONFIG（JSON 文字列）が必須
// -------------------------------------------------------------
import {
  initializeApp,
  getApp,
  FirebaseApp,
  type FirebaseOptions,
} from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  Timestamp,
} from 'firebase/firestore';
import dayjs from 'dayjs';

/* ------------------------------------------------------------------
 * 1. Firebase 設定を環境変数から取得
 * ----------------------------------------------------------------- */
const rawConfig = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
if (!rawConfig) {
  // 環境変数がない場合は即終了
  console.error('❌  NEXT_PUBLIC_FIREBASE_CONFIG が設定されていません');
  process.exit(1);
}
const firebaseConfig = JSON.parse(rawConfig) as FirebaseOptions;

/* ------------------------------------------------------------------
 * 2. Firebase 初期化（重複エラー対策あり）
 * ----------------------------------------------------------------- */
let app: FirebaseApp;
try {
  app = initializeApp(firebaseConfig);
} catch (err: unknown) {
  // 既に初期化済みなら再利用
  const maybeDup = err as { code?: string };
  if (maybeDup.code === 'app/duplicate-app') {
    app = getApp();
  } else {
    console.error('❌  Firebase 初期化に失敗しました', err);
    process.exit(1);
  }
}
const db = getFirestore(app);

/* ------------------------------------------------------------------
 * 3. スクリプト用のパラメータ
 * ----------------------------------------------------------------- */
const uid      = 'demoUser';                       // ← 必要なら変更
const dateKey  = dayjs().format('YYYYMMDD');       // 例: 20250726
const baseCol  = collection(db, 'users', uid, 'todos', dateKey, 'items');

/* ------------------------------------------------------------------
 * 4. テスト投入したいデータ
 * ----------------------------------------------------------------- */
type SeedItem = {
  id: string;
  title: string;
  unitType: 'pages' | 'problems' | 'words' | 'chapters' | 'none';
  planCount: number;
  done: number;
};

const seedItems: SeedItem[] = [
  { id: 'taskA', title: '参考書A', unitType: 'pages',    planCount: 10, done: 0 },
  { id: 'taskB', title: '参考書B', unitType: 'problems', planCount: 20, done: 0 },
  { id: 'taskC', title: '参考書C', unitType: 'pages',    planCount:  5, done: 0 },
];

/* ------------------------------------------------------------------
 * 5. Firestore へ書き込み
 * ----------------------------------------------------------------- */
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
