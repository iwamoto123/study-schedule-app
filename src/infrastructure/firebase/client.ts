'use client';

import {
  initializeApp,
  getApps,
  getApp,
  type FirebaseApp,
} from 'firebase/app';

import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirebaseConfig } from './config';

/**
 * Firebaseクライアント管理クラス
 * シングルトンパターンで実装
 */
class FirebaseClient {
  private static instance: FirebaseClient;
  private app: FirebaseApp;
  private firestoreInstance: Firestore;
  private authInstance: Auth;

  private constructor() {
    const firebaseConfig = getFirebaseConfig();

    // Firebase App 初期化（既にあれば再利用）
    this.app = getApps().length ? getApp() : initializeApp(firebaseConfig);

    // Firestore 初期化
    this.firestoreInstance = getFirestore(this.app);

    // Auth 初期化
    this.authInstance = getAuth(this.app);

    // クライアントサイドで接続確認
    if (typeof window !== 'undefined') {
      console.log('🔥 Connected to Firebase:', firebaseConfig.projectId);

      // 開発環境でのデバッグ情報
      if (process.env.NODE_ENV !== 'production') {
        this.logDebugInfo();
      }
    }
  }

  /**
   * FirebaseClientのインスタンスを取得
   */
  public static getInstance(): FirebaseClient {
    if (!FirebaseClient.instance) {
      FirebaseClient.instance = new FirebaseClient();
    }
    return FirebaseClient.instance;
  }

  /**
   * Firebase Appインスタンスを取得
   */
  public getApp(): FirebaseApp {
    return this.app;
  }

  /**
   * Firestoreインスタンスを取得
   */
  public getFirestore(): Firestore {
    return this.firestoreInstance;
  }

  /**
   * Authインスタンスを取得
   */
  public getAuth(): Auth {
    return this.authInstance;
  }

  /**
   * デバッグ情報をログ出力
   */
  private logDebugInfo(): void {
    const config = this.app.options;
    const envProject = process.env.NEXT_PUBLIC_GCP_PROJECT_ID;

    if (config.projectId && envProject && config.projectId !== envProject) {
      console.warn('[Firebase] projectId mismatch:', {
        configProject: config.projectId,
        envProject,
      });
    }

    console.log('[Firebase] Debug info:', {
      projectId: config.projectId,
      authDomain: config.authDomain,
      environment: process.env.NODE_ENV,
    });
  }
}

// エクスポート用のヘルパー関数
export const getFirebaseClient = () => FirebaseClient.getInstance();
export const getFirebaseApp = () => FirebaseClient.getInstance().getApp();
export const getFirestoreClient = () => FirebaseClient.getInstance().getFirestore();
export const getAuthClient = () => FirebaseClient.getInstance().getAuth();