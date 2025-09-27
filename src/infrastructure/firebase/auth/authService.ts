'use client';

import {
  User,
  UserCredential,
  signInAnonymously,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCustomToken,
  signOut,
  onAuthStateChanged,
  type Unsubscribe,
} from 'firebase/auth';

import { getAuthClient } from '../client';

/**
 * Firebase認証サービス
 * 認証関連の操作を抽象化
 */
export class FirebaseAuthService {
  /**
   * 匿名ログイン
   */
  async signInAnonymously(): Promise<UserCredential> {
    const auth = getAuthClient();
    return await signInAnonymously(auth);
  }

  /**
   * メールアドレスとパスワードでログイン
   */
  async signInWithEmail(email: string, password: string): Promise<UserCredential> {
    const auth = getAuthClient();
    return await signInWithEmailAndPassword(auth, email, password);
  }

  /**
   * メールアドレスとパスワードで新規登録
   */
  async signUpWithEmail(email: string, password: string): Promise<UserCredential> {
    const auth = getAuthClient();
    return await createUserWithEmailAndPassword(auth, email, password);
  }

  /**
   * カスタムトークンでログイン
   */
  async signInWithCustomToken(token: string): Promise<UserCredential> {
    const auth = getAuthClient();
    return await signInWithCustomToken(auth, token);
  }

  /**
   * ログアウト
   */
  async signOut(): Promise<void> {
    const auth = getAuthClient();
    return await signOut(auth);
  }

  /**
   * 現在のユーザーを取得
   */
  getCurrentUser(): User | null {
    const auth = getAuthClient();
    return auth.currentUser;
  }

  /**
   * 認証状態の変更を監視
   */
  onAuthStateChanged(callback: (user: User | null) => void): Unsubscribe {
    const auth = getAuthClient();
    return onAuthStateChanged(auth, callback);
  }

  /**
   * ユーザーがログイン済みか確認
   */
  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  /**
   * ユーザーが匿名ユーザーか確認
   */
  isAnonymousUser(): boolean {
    const user = this.getCurrentUser();
    return user?.isAnonymous ?? false;
  }
}

// シングルトンインスタンス
let authServiceInstance: FirebaseAuthService | null = null;

/**
 * FirebaseAuthServiceのインスタンスを取得
 */
export function getFirebaseAuthService(): FirebaseAuthService {
  if (!authServiceInstance) {
    authServiceInstance = new FirebaseAuthService();
  }
  return authServiceInstance;
}