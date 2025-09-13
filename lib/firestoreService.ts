/* =====================================================================
 * Firestore Service Class - 実験的な接続テスト用
 * ===================================================================== */
'use client';

import {
  collection,
  getDocs,
  addDoc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { getCurrentEncodedUID, isSafeUID } from '@/lib/uidUtils';

export class FirestoreService {
  private static instance: FirestoreService;

  private constructor() {}

  static getInstance(): FirestoreService {
    if (!FirestoreService.instance) {
      FirestoreService.instance = new FirestoreService();
    }
    return FirestoreService.instance;
  }

  /* ------------------------------------------------------------------ */
  /*                           認証状態確認                            */
  /* ------------------------------------------------------------------ */
  private async ensureAuth(): Promise<string> {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // IDトークンを強制リフレッシュして取得
    try {
      const token = await user.getIdToken(true);
      const originalUID = user.uid;

      console.log('🔑 FirestoreService - Fresh token obtained:', !!token);
      console.log('🔑 Token preview:', token.substring(0, 50) + '...');
      console.log('🔑 Original User UID:', originalUID);

      // UID安全性チェック
      const isUIDSafe = isSafeUID(originalUID);
      console.log('🔧 UID safety check:', { originalUID, isUIDSafe });

      // エンコードされたUIDを取得
      const encodedUID = getCurrentEncodedUID(auth);
      console.log('🔧 Encoded UID for Firestore:', encodedUID);

      console.log('🔑 User details:', {
        uid: originalUID,
        encodedUID,
        email: user.email,
        displayName: user.displayName,
        providerId: user.providerData?.[0]?.providerId,
        emailVerified: user.emailVerified,
        isAnonymous: user.isAnonymous,
        metadata: {
          creationTime: user.metadata.creationTime,
          lastSignInTime: user.metadata.lastSignInTime
        }
      });

      // トークンペイロードの確認
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        console.log('🔑 Token payload:', {
          iss: tokenPayload.iss,
          aud: tokenPayload.aud,
          auth_time: tokenPayload.auth_time,
          user_id: tokenPayload.user_id,
          sub: tokenPayload.sub,
          iat: tokenPayload.iat,
          exp: tokenPayload.exp,
          firebase: tokenPayload.firebase
        });
      } catch (e) {
        console.log('🔑 Could not parse token payload:', e);
      }

      // エンコードされたUIDを返す（Firestoreパス用）
      return encodedUID || originalUID;
    } catch (error) {
      console.error('❌ FirestoreService - Token error:', error);
      throw new Error('Failed to get authentication token');
    }
  }

  /* ------------------------------------------------------------------ */
  /*                           基本的な読み取りテスト                    */
  /* ------------------------------------------------------------------ */
  async testBasicRead(): Promise<void> {
    try {
      console.log('🧪 FirestoreService - Starting basic read test...');

      // 認証スキップモード - まず認証なしでルートコレクションをテスト
      console.log('🧪 Testing root collection access (no auth)...');
      const rootTestRef = collection(db, 'test');

      try {
        const rootSnapshot = await getDocs(rootTestRef);
        console.log('✅ Root collection accessible (no auth):', {
          empty: rootSnapshot.empty,
          size: rootSnapshot.size
        });
      } catch (rootError) {
        console.error('❌ Root collection failed (no auth):', rootError);
        const errorObj = rootError as { code?: string; message?: string };
        console.error('❌ Root collection error details:', {
          code: errorObj.code,
          message: errorObj.message
        });
      }

      // 認証ありモード
      try {
        const uid = await this.ensureAuth();
        console.log('🧪 Authenticated as:', uid);

        // Materials コレクションの読み取りテスト
        const materialsRef = collection(db, 'users', uid, 'materials');
        console.log('🧪 Materials collection reference created');
        console.log('🧪 Full collection path:', `users/${uid}/materials`);

        const snapshot = await getDocs(materialsRef);
        console.log('🧪 Materials snapshot obtained:', {
          empty: snapshot.empty,
          size: snapshot.size
        });

        snapshot.forEach(doc => {
          console.log('🧪 Material doc:', doc.id, doc.data());
        });

        console.log('✅ Basic read test completed successfully');
      } catch (authError) {
        console.error('❌ Authentication failed:', authError);
        const errorObj = authError as { code?: string; message?: string };
        console.error('❌ Auth error details:', {
          code: errorObj.code,
          message: errorObj.message
        });
        throw authError;
      }
    } catch (error) {
      console.error('❌ Basic read test failed:', error);
      throw error;
    }
  }

  /* ------------------------------------------------------------------ */
  /*                           基本的な書き込みテスト                    */
  /* ------------------------------------------------------------------ */
  async testBasicWrite(): Promise<string> {
    try {
      console.log('🧪 FirestoreService - Starting basic write test...');

      const uid = await this.ensureAuth();
      console.log('🧪 Authenticated as:', uid);

      // テストデータを作成
      const testData = {
        title: 'Test Material - ' + new Date().toISOString(),
        subject: 'math',
        unitType: 'pages',
        totalCount: 100,
        startDate: '2025-01-01',
        deadline: '2025-12-31',
        dailyPlan: 1,
        createdAt: serverTimestamp()
      };

      // Materials コレクションに書き込み
      const materialsRef = collection(db, 'users', uid, 'materials');
      console.log('🧪 Materials collection reference created');

      const docRef = await addDoc(materialsRef, testData);
      console.log('🧪 Document written with ID:', docRef.id);

      console.log('✅ Basic write test completed successfully');
      return docRef.id;
    } catch (error) {
      console.error('❌ Basic write test failed:', error);
      throw error;
    }
  }

  /* ------------------------------------------------------------------ */
  /*                           Todosテスト                             */
  /* ------------------------------------------------------------------ */
  async testTodosRead(): Promise<void> {
    try {
      console.log('🧪 FirestoreService - Starting todos read test...');

      const uid = await this.ensureAuth();
      console.log('🧪 Authenticated as:', uid);

      const todayKey = new Date().toISOString().split('T')[0].replace(/-/g, '');
      console.log('🧪 Today key:', todayKey);

      // Todos items コレクションの読み取り
      const itemsRef = collection(db, 'users', uid, 'todos', todayKey, 'items');
      console.log('🧪 Todos items path:', `users/${uid}/todos/${todayKey}/items`);

      const snapshot = await getDocs(itemsRef);
      console.log('🧪 Todos items snapshot:', {
        empty: snapshot.empty,
        size: snapshot.size
      });

      snapshot.forEach(doc => {
        console.log('🧪 Todo item:', doc.id, doc.data());
      });

      console.log('✅ Todos read test completed successfully');
    } catch (error) {
      console.error('❌ Todos read test failed:', error);
      throw error;
    }
  }

  /* ------------------------------------------------------------------ */
  /*                           リアルタイムリスナーテスト                 */
  /* ------------------------------------------------------------------ */
  async testRealtimeListener(): Promise<Unsubscribe> {
    try {
      console.log('🧪 FirestoreService - Starting realtime listener test...');

      const uid = await this.ensureAuth();
      console.log('🧪 Authenticated as:', uid);

      const materialsRef = collection(db, 'users', uid, 'materials');
      console.log('🧪 Setting up realtime listener...');

      const unsubscribe = onSnapshot(
        materialsRef,
        (snapshot) => {
          console.log('🧪 Realtime update received:', {
            empty: snapshot.empty,
            size: snapshot.size,
            docChanges: snapshot.docChanges().length
          });

          snapshot.docChanges().forEach((change) => {
            console.log('🧪 Document change:', change.type, change.doc.id);
          });
        },
        (error) => {
          console.error('❌ Realtime listener error:', error);
        }
      );

      console.log('✅ Realtime listener setup completed');
      return unsubscribe;
    } catch (error) {
      console.error('❌ Realtime listener test failed:', error);
      throw error;
    }
  }

  /* ------------------------------------------------------------------ */
  /*                           認証なしテスト（緊急デバッグ用）            */
  /* ------------------------------------------------------------------ */
  async testWithoutAuth(): Promise<void> {
    try {
      console.log('🧪 FirestoreService - Testing without authentication...');

      // 1. ルートコレクションテスト
      console.log('🧪 Testing root collection access (no auth)...');
      const rootTestRef = collection(db, 'test');

      try {
        const rootSnapshot = await getDocs(rootTestRef);
        console.log('✅ Root collection accessible (no auth):', {
          empty: rootSnapshot.empty,
          size: rootSnapshot.size
        });
      } catch (rootError) {
        console.error('❌ Root collection failed (no auth):', rootError);
        const errorObj = rootError as { code?: string; message?: string };
        console.error('❌ Root collection error details:', {
          code: errorObj.code,
          message: errorObj.message
        });
      }

      // 2. 既知のパスでテスト（認証なし）
      console.log('🧪 Testing materials collection (no auth)...');
      const materialsRef = collection(db, 'users', 'test-user', 'materials');

      try {
        const materialsSnapshot = await getDocs(materialsRef);
        console.log('✅ Materials collection accessible (no auth):', {
          empty: materialsSnapshot.empty,
          size: materialsSnapshot.size
        });
      } catch (materialsError) {
        console.error('❌ Materials collection failed (no auth):', materialsError);
        const errorObj = materialsError as { code?: string; message?: string };
        console.error('❌ Materials error details:', {
          code: errorObj.code,
          message: errorObj.message
        });
      }

      console.log('✅ No-auth test completed');
    } catch (error) {
      console.error('❌ No-auth test failed:', error);
      throw error;
    }
  }

  /* ------------------------------------------------------------------ */
  /*                           すべてのテストを実行                      */
  /* ------------------------------------------------------------------ */
  async runAllTests(): Promise<void> {
    console.log('🧪 FirestoreService - Running all tests...');

    try {
      // 1. 認証なしテスト
      await this.testWithoutAuth();

      // 2. 基本読み取りテスト
      await this.testBasicRead();

      // 3. 基本書き込みテスト
      const docId = await this.testBasicWrite();
      console.log('🧪 Test document created:', docId);

      // 4. Todosテスト
      await this.testTodosRead();

      // 5. リアルタイムリスナーテスト
      const unsubscribe = await this.testRealtimeListener();

      // 5秒後にリスナーを停止
      setTimeout(() => {
        unsubscribe();
        console.log('🧪 Realtime listener stopped');
      }, 5000);

      console.log('✅ All tests completed successfully');
    } catch (error) {
      console.error('❌ Tests failed:', error);
      throw error;
    }
  }
}

// シングルトンインスタンスをエクスポート
export const firestoreService = FirestoreService.getInstance();