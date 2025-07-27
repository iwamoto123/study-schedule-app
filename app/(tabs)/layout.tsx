'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithCustomToken } from 'firebase/auth';

import { auth } from '@/lib/firebase';
import AuthWrapper from '@/components/AuthWrapper';
import BottomNav   from '@/components/BottomNav';

/* ------------------------------------------------------------
 * TabsLayout
 * - ルート /(tabs)/~~~ 配下の各ページを <AuthWrapper> で保護
 * - LINE 認証から戻る際 ?token=... が付与されるので
 *   CustomToken サインインして /materials へリダイレクト
 * ----------------------------------------------------------- */
export default function TabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  /* ---------- CustomToken → Firebase Auth ---------- */
  useEffect(() => {
    const url   = new URL(window.location.href);
    const token = url.searchParams.get('token');
    if (!token) return;

    // サインインしてからクエリを除去し /materials に寄せる
    signInWithCustomToken(auth, token)
      .catch(console.error)
      .finally(() => {
        url.searchParams.delete('token');
        router.replace('/materials');
      });
  }, [router]);

  return (
    <AuthWrapper>
      <div className="pb-16">
        {children}         {/* 各タブのページ本体 */}
      </div>
      <BottomNav />        {/* 画面下部フッターナビ */}
    </AuthWrapper>
  );
}
