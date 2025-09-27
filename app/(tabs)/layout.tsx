// app/layout.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AuthWrapper from '@/components/AuthWrapper';
import BottomNav   from '@/components/BottomNav';
import { getCustomTokenHandler } from '@auth/authAdapter';


/* ------------------------------------------------------------
 * TabsLayout
 * - /(tabs)/~~~ 配下の各ページを <AuthWrapper> で保護
 * - ?token=... で戻るケースに対応（現状維持）
 * ----------------------------------------------------------- */
export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  /* ---------- CustomToken → Firebase Auth（現状維持） ---------- */
  useEffect(() => {
    const handle = getCustomTokenHandler();
    if (!handle) return;

    const url   = new URL(window.location.href);
    const token = url.searchParams.get('token');
    if (!token) return;

    handle({ token, url, router }).catch(err => {
      console.error('[Auth] Custom token handling failed:', err);
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
