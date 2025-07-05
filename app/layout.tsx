import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

/* ---------------- フォント ---------------- */
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

/* ---------------- メタデータ ---------------- */
export const metadata: Metadata = {
  title: 'Study Schedule App',
  description: 'Progress manager',
};

/* ---------------- ルートレイアウト ---------------- */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${geistSans.variable} ${geistMono.variable}`}>
      {/* flex で縦方向に 100vh を確保し、main を flex-1 で伸ばす */}
      <body className="flex min-h-screen flex-col antialiased bg-white">
        <main className="flex-1 flex flex-col">{children}</main>
      </body>
    </html>
  );
}
