# Firebase 設定ガイド

## 初期セットアップ

### 1. 環境変数の自動生成

```bash
# Firebase設定を生成
npm run generate:config

# または、初期セットアップを実行
npm run setup
```

### 2. 手動設定が必要な場合

`scripts/generate-firebase-config.js`を編集して、以下の情報を更新：

```javascript
const firebaseConfig = {
  projectId: "your-project-id",
  appId: "your-app-id",
  storageBucket: "your-storage-bucket",
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  messagingSenderId: "your-sender-id",
  measurementId: "your-measurement-id"
};
```

Firebase Consoleから取得：
1. [Firebase Console](https://console.firebase.google.com)にアクセス
2. プロジェクトを選択
3. ⚙️ > プロジェクトの設定
4. 「マイアプリ」セクションでWeb アプリの設定をコピー

## コマンド一覧

| コマンド | 説明 |
|---------|------|
| `npm run generate:config` | Firebase設定を`.env.local`に生成 |
| `npm run setup` | 初期セットアップ（設定生成） |
| `npm run dev` | 開発サーバー起動 |
| `npm run seed:admin` | 管理者用のテストデータを作成 |

## インフラストラクチャー層の使用

### クライアントサイド（ブラウザ）

```typescript
import {
  getFirebaseAuthService,
  getFirestoreService
} from '@/infrastructure/firebase';

// 認証サービス
const authService = getFirebaseAuthService();
await authService.signInAnonymously();

// Firestoreサービス
const firestoreService = getFirestoreService();
const doc = await firestoreService.getDocument('users', userId);
```

### サーバーサイド（Admin SDK）

```typescript
import {
  getFirestoreAdmin,
  getAuthAdmin
} from '@/infrastructure/firebase';

// Admin Firestore
const db = getFirestoreAdmin();
await db.collection('users').doc(userId).set(data);

// Admin Auth
const auth = getAuthAdmin();
const customToken = await auth.createCustomToken(uid);
```

## トラブルシューティング

### Firebase接続エラーが発生する場合

1. `.env.local`ファイルが存在することを確認
2. `npm run generate:config`を実行して設定を再生成
3. Firebase Consoleで認証方法が有効になっているか確認
   - Anonymous認証
   - Email/Password認証（必要に応じて）

### Google Application Default Credentialsエラー

Admin SDKを使用する場合：

```bash
# ADCを設定
gcloud auth application-default login

# プロジェクトを設定
gcloud config set project study-schedule-app
```