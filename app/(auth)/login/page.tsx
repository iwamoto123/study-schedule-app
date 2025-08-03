/* =====================================================================
 * /app/(auth)/login/page.tsx
 *  - LINE ログインを最上部に大きく配置
 *  - メール / パスワードは下段に
 *  - “しんちょくん” コピー入り & ふわっと表示アニメーション
 * ===================================================================*/
'use client';

import { useState, type FormEvent } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { useRouter }    from 'next/navigation';
import { motion }       from 'framer-motion';

import { auth }         from '@/lib/firebase';
import LineLoginButton  from '@/components/LineLoginButton';
import FirebaseTest     from '@/components/FirebaseTest';

/* ------------------------------------------------------------------ */
/*                           Component                                */
/* ------------------------------------------------------------------ */
export default function LoginPage() {
  /* ------- state ------- */
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [isNew,     setIsNew]     = useState(false);
  const router                    = useRouter();

  /* ------- submit ------- */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (isNew) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      router.push('/materials');
    } catch (err: unknown) {
      console.error(err);
      alert('ログインに失敗しました');
    }
  };

  /* ---------------------------------------------------------------- */
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      {/* カード全体にフェード＋スライド */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.8, 0.25, 1] }}
        className="w-full max-w-md space-y-8 rounded-2xl bg-white/80 p-8 shadow-2xl backdrop-blur-lg"
      >
        {/* ------------ ヒーローコピー ------------- */}
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-indigo-700 drop-shadow-sm">
            しんちょくん
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            日々の学習進捗を可視化しよう！
          </p>
        </div>

        {/* ------------ LINE ログイン ------------- */}
        <LineLoginButton className="w-full scale-110 hover:scale-105 transition-transform duration-200" />

        {/* ------------ 区切り線 ------------- */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-white px-3 text-gray-500">
              またはメールで{isNew ? '登録' : 'ログイン'}
            </span>
          </div>
        </div>

        {/* ------------ メール / パスワード ------------- */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="メールアドレス"
            className="w-full rounded border p-3 focus:border-indigo-400 focus:outline-none"
          />
          <input
            type="password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="パスワード"
            className="w-full rounded border p-3 focus:border-indigo-400 focus:outline-none"
          />
          <button
            type="submit"
            className="w-full rounded bg-indigo-600 py-3 font-medium text-white hover:bg-indigo-700 transition-colors"
          >
            {isNew ? '登録' : 'ログイン'}
          </button>
        </form>

        {/* ------------ トグル ------------- */}
        <button
          type="button"
          onClick={() => setIsNew(p => !p)}
          className="w-full text-center text-sm font-medium text-indigo-600 hover:underline"
        >
          {isNew ? '既にアカウントをお持ちの方はこちら' : '新規登録はこちら'}
        </button>
      </motion.div>
      
      {/* Firebase接続テスト（開発用） */}
      <FirebaseTest />
    </main>
  );
}


// /* =============================================================
//  * /app/(auth)/login/page.tsx
//  * =========================================================== */
// 'use client';

// import { useState } from 'react';
// import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
// import { auth } from '@/lib/firebase';
// import { useRouter } from 'next/navigation';
// import LineLoginButton from '@/components/LineLoginButton';

// export default function LoginPage() {
//   /* ---------- メール／パスワード状態 ---------- */
//   const [email, setEmail]       = useState('');
//   const [password, setPassword] = useState('');
//   const [isNew, setIsNew]       = useState(false);
//   const router                  = useRouter();

//   /* ---------- 送信 ---------- */
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     try {
//       if (isNew) {
//         await createUserWithEmailAndPassword(auth, email, password);
//       } else {
//         await signInWithEmailAndPassword(auth, email, password);
//       }
//       router.push('/materials');
//     } catch (err: any) {
//       alert(err.message ?? 'エラーが発生しました');
//     }
//   };

//   /* ---------- UI ---------- */
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
//       <div className="w-full max-w-md space-y-8">
//         {/* ロゴ */}
//         <header className="text-center">
//           <h1 className="text-3xl font-bold text-gray-900">学習管理アプリ</h1>
//           <p className="text-gray-600">毎日の学習を記録しよう</p>
//         </header>

//         <div className="bg-white rounded-lg shadow-lg p-8">
//           {/* LINE ログイン */}
//           <LineLoginButton />

//           {/* 区切り線 */}
//           <div className="relative my-6">
//             <div className="absolute inset-0 flex items-center">
//               <div className="w-full border-t border-gray-300" />
//             </div>
//             <div className="relative flex justify-center text-sm">
//               <span className="bg-white px-2 text-gray-500">または</span>
//             </div>
//           </div>

//           {/* メールフォーム */}
//           <form onSubmit={handleSubmit} className="space-y-4">
//             <input
//               type="email"
//               className="w-full p-3 border rounded"
//               placeholder="メールアドレス"
//               required
//               value={email}
//               onChange={e => setEmail(e.target.value)}
//             />
//             <input
//               type="password"
//               className="w-full p-3 border rounded"
//               placeholder="パスワード（6文字以上）"
//               required
//               value={password}
//               onChange={e => setPassword(e.target.value)}
//             />

//             <button
//               type="submit"
//               className="w-full p-3 bg-indigo-600 text-white rounded disabled:opacity-50"
//             >
//               {isNew ? '登録' : 'ログイン'}
//             </button>

//             <button
//               type="button"
//               onClick={() => setIsNew(!isNew)}
//               className="w-full text-sm text-indigo-600"
//             >
//               {isNew ? 'ログインはこちら' : '新規登録はこちら'}
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }
