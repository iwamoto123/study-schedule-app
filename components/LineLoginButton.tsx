// components/LineLoginButton.tsx
'use client';

import { useState } from 'react';
import classNames from 'classnames';           // ★ 追加（Tailwind 併用で便利）

/* ------------------------------------------------------------
 * LINE Login へリダイレクトするボタン
 *   - PKCE (S256) 対応
 *   - state / code_verifier を Cookie に保存
 *   - 外部から className を上書き出来るよう対応
 * ---------------------------------------------------------- */
interface Props {
  className?: string;        // ★ 追加
}

export default function LineLoginButton({ className }: Props) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);

    const clientId = process.env.NEXT_PUBLIC_LINE_CHANNEL_ID;
    if (!clientId) {
      console.error('NEXT_PUBLIC_LINE_CHANNEL_ID is not defined');
      alert('LINE チャネル ID が設定されていません');
      setLoading(false);
      return;
    }
    
    // Debug Firebase config
    console.log('Firebase Config:', process.env.NEXT_PUBLIC_FIREBASE_CONFIG);
    console.log('Emulator Mode:', process.env.NEXT_PUBLIC_EMULATOR);

    const state        = randomString();
    const codeVerifier = randomString();
    const codeChallenge = await sha256ToBase64Url(codeVerifier);

    // Store state and codeVerifier in Firestore for Cloud Functions to retrieve
    try {
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      console.log('Attempting to write to Firestore with state:', state);
      
      await setDoc(doc(db, 'line_auth_sessions', state), {
        codeVerifier,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
      });
      
      console.log('Successfully stored auth session');
    } catch (error: any) {
      console.error('Failed to store auth session:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      alert(`認証情報の保存に失敗しました: ${error.message || 'Unknown error'}`);
      setLoading(false);
      return;
    }

    // Use Cloud Functions URL
    const projectId = process.env.NEXT_PUBLIC_GCP_PROJECT_ID;
    const region = process.env.NEXT_PUBLIC_GCP_REGION || 'asia-northeast1';
    
    const redirectUri = projectId
      ? `https://${region}-${projectId}.cloudfunctions.net/lineCallback`
      : `${window.location.origin}/auth/line/callback`;
    const authUrl =
      'https://access.line.me/oauth2/v2.1/authorize' +
      `?response_type=code` +
      `&client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${state}` +
      `&scope=profile%20openid` +
      `&code_challenge=${codeChallenge}` +
      `&code_challenge_method=S256`;

    window.location.assign(authUrl);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={classNames(
        'flex w-full items-center justify-center gap-3 rounded-lg border p-3 font-medium ' +
          'hover:bg-green-50 disabled:opacity-60 transition',
        className,                  // ★ 呼び出し側の className をマージ
      )}
    >
      {/* LINE アイコン */}
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden fill="#06C755">
        <path d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10a9.96 9.96 0 0 1-4.477-1.06L4 22l1.097-3.934A9.959 9.959 0 0 1 2 12Z" />
        <path fill="#fff" d="M7.8 9.6h1.2v3.6H7.8V9.6Zm3 0h1.2v3.6h-1.2V9.6Zm5.4 0v3.6h-1.2l-1.8-2.4v2.4h-1.2V9.6h1.2l1.8 2.4V9.6h1.2Z" />
      </svg>
      {loading ? 'リダイレクト中...' : 'LINEでログイン'}
    </button>
  );
}

/* ---------------- util ---------------- */
function randomString(len = 43) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(len)))
    .map(x => chars[x % chars.length])
    .join('');
}
async function sha256ToBase64Url(data: string) {
  const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  const b64  = btoa(String.fromCharCode(...new Uint8Array(buf)));
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
