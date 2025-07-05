// app/(tabs)/layout.tsx
'use client';
import BottomNav from '@/components/BottomNav';
import type { ReactNode } from 'react';

export default function TabsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <div className="pb-16">{children}</div>  {/* 各ページの内容 */}
      <BottomNav />{/* 共通フッターナビ */}
    </>
  );
}
