/**
 * Firebase Infrastructure Layer
 *
 * Firebase関連の全ての操作を統一されたインターフェースで提供
 */

// 設定
export { getFirebaseConfig, getProjectId, getRegion } from './config';

// クライアント（ブラウザ用）
export {
  getFirebaseClient,
  getFirebaseApp,
  getFirestoreClient,
  getAuthClient,
} from './client';

// 認証サービス
export { FirebaseAuthService, getFirebaseAuthService } from './auth/authService';

// Firestoreサービス
export { FirestoreService, getFirestoreService } from './firestore/firestoreService';

// Admin SDK（サーバーサイド用） - サーバーサイドでのみインポート
// 注意: これらはサーバーサイド専用です。クライアントサイドでは使用しないでください。
// export {
//   getFirebaseAdminClient,
//   getFirestoreAdmin,
//   getAuthAdmin,
// } from './admin/adminClient';

// 型定義
export type { User, UserCredential } from 'firebase/auth';
export type {
  DocumentData,
  DocumentReference,
  CollectionReference,
  DocumentSnapshot,
  QuerySnapshot,
  QueryConstraint,
} from 'firebase/firestore';