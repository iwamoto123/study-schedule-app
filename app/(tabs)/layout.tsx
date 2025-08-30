// app/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithCustomToken } from 'firebase/auth';

import { auth } from '@/lib/firebase';
import AuthWrapper from '@/components/AuthWrapper';
import BottomNav   from '@/components/BottomNav';


/* ------------------------------------------------------------
 * TabsLayout
 * - /(tabs)/~~~ 配下の各ページを <AuthWrapper> で保護
 * - ?token=... で戻るケースに対応（現状維持）
 * ----------------------------------------------------------- */
export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  /* ---------- CustomToken → Firebase Auth（現状維持） ---------- */
  useEffect(() => {
    const url   = new URL(window.location.href);
    const token = url.searchParams.get('token');
    if (!token) return;

    signInWithCustomToken(auth, token)
      .then(() => {
        console.log('[Auth] Successfully signed in with custom token');
        url.searchParams.delete('token');
        router.replace('/materials');
      })
      .catch((error) => {
        console.error('[Auth] Failed to sign in with custom token:', error);
        alert('認証エラーが発生しました。もう一度ログインしてください。');
        router.replace('/login');
      });
  }, [router]);

  return (
    <AuthWrapper>
      {/* 画面下に「ナビ高さ+safe-area」ぶんの余白を常に確保 */}
      <div className="min-h-screen pb-[calc(5rem+env(safe-area-inset-bottom))]">
        {children}
      </div>
      <BottomNav />
    </AuthWrapper>
  );
}
