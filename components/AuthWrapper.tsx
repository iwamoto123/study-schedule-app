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
