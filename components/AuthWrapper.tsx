'use client';

import { ReactNode, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter, usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';

/**
 * すべてのページを認証必須にしたい場合に使うラッパー。
 * ── 挙動 ──────────────────────────────────────────────
 * 1. Firebase の認証状態を監視  
 * 2. 未ログインかつ /login 以外 ⇒ /login へリダイレクト  
 * 3. 判定中はフルスクリーンで「読み込み中...」を表示
 * --------------------------------------------------- */
export default function AuthWrapper({ children }: { children: ReactNode }) {
  /** onAuthStateChanged 完了済みかどうか */
  const [checking, setChecking] = useState(true);

  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    /** 認証状態を監視 */
    const unsubscribe = onAuthStateChanged(auth, user => {
      setChecking(false);

      // デバッグ: 認証状態を詳細にログ出力
      console.log('🔐 AuthWrapper - User state changed:', {
        user: !!user,
        uid: user?.uid,
        providerId: user?.providerData?.[0]?.providerId,
        pathname,
        timestamp: new Date().toISOString()
      });

      // IDトークン取得（詳細内容のログ出力は抑制）
      if (user) {
        user.getIdToken(true).then(token => {
          console.log('🔑 Fresh ID Token obtained:', Boolean(token));
        }).catch(err => {
          console.error('❌ ID Token error:', err);
          // トークンエラーの場合は強制ログアウト
          auth.signOut();
        });
      }

      // 未ログインで /login 以外のページならリダイレクト
      if (!user && !pathname.startsWith('/login')) {
        router.replace('/login');
      }
    });

    return unsubscribe; // アンマウント時に購読解除
  }, [pathname, router]);

  /** 判定中はスピナー */
  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center">
        読み込み中...
      </div>
    );
  }

  /** 認証済みなら子要素を表示 */
  return <>{children}</>;
}
