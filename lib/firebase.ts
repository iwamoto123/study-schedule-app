/**
 * @deprecated このファイルは廃止予定です
 * 代わりに src/infrastructure/firebase を使用してください
 *
 * 移行ガイド:
 * - import { auth, db } from '@/lib/firebase'
 * + import { getAuthClient, getFirestoreClient } from '@infrastructure/firebase'
 *
 * または、より高レベルのサービスを使用:
 * + import { getFirebaseAuthService, getFirestoreService } from '@infrastructure/firebase'
 */

'use client';

import { getAuthClient, getFirestoreClient, getFirebaseApp } from '@infrastructure/firebase';

// 既存のコードとの互換性のためにエクスポート
export const auth = getAuthClient();
export const db = getFirestoreClient();
export const app = getFirebaseApp();