import * as admin from 'firebase-admin';
import { getProjectId } from '../config';

/**
 * Firebase Admin SDK クライアント
 * サーバーサイドでの管理操作用
 */
class FirebaseAdminClient {
  private static instance: FirebaseAdminClient;
  private app: admin.app.App;
  private firestoreInstance: admin.firestore.Firestore;
  private authInstance: admin.auth.Auth;

  private constructor() {
    // Admin SDK初期化（Application Default Credentialsを使用）
    if (!admin.apps.length) {
      try {
        this.app = admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: getProjectId(),
        });
        console.log('[Firebase Admin] Initialized with ADC');
      } catch (error) {
        console.error('[Firebase Admin] Failed to initialize:', error);
        throw new Error('Failed to initialize Firebase Admin SDK. Ensure GOOGLE_APPLICATION_CREDENTIALS is set.');
      }
    } else {
      this.app = admin.app();
    }

    this.firestoreInstance = admin.firestore(this.app);
    this.authInstance = admin.auth(this.app);
  }

  /**
   * FirebaseAdminClientのインスタンスを取得
   */
  public static getInstance(): FirebaseAdminClient {
    if (!FirebaseAdminClient.instance) {
      FirebaseAdminClient.instance = new FirebaseAdminClient();
    }
    return FirebaseAdminClient.instance;
  }

  /**
   * Firestore Adminインスタンスを取得
   */
  public getFirestore(): admin.firestore.Firestore {
    return this.firestoreInstance;
  }

  /**
   * Auth Adminインスタンスを取得
   */
  public getAuth(): admin.auth.Auth {
    return this.authInstance;
  }

  /**
   * カスタムトークンを生成
   */
  public async createCustomToken(uid: string, claims?: object): Promise<string> {
    return await this.authInstance.createCustomToken(uid, claims);
  }

  /**
   * ユーザーを作成
   */
  public async createUser(properties: admin.auth.CreateRequest): Promise<admin.auth.UserRecord> {
    return await this.authInstance.createUser(properties);
  }

  /**
   * ユーザーを削除
   */
  public async deleteUser(uid: string): Promise<void> {
    return await this.authInstance.deleteUser(uid);
  }

  /**
   * ユーザー情報を取得
   */
  public async getUser(uid: string): Promise<admin.auth.UserRecord> {
    return await this.authInstance.getUser(uid);
  }
}

// エクスポート用のヘルパー関数
export const getFirebaseAdminClient = () => FirebaseAdminClient.getInstance();
export const getFirestoreAdmin = () => FirebaseAdminClient.getInstance().getFirestore();
export const getAuthAdmin = () => FirebaseAdminClient.getInstance().getAuth();