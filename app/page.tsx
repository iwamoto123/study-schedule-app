// /app/page.tsx
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/progress');   // トップ→/progress へ即リダイレクト
  return null;             // 型チェック用に戻り値を置いておく
}
