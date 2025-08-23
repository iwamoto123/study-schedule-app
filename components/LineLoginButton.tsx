// components/LineLoginButton.tsx
'use client';

import { useState } from 'react';
import classNames from 'classnames';
import { LineAuthClient } from '@aid-on/auth-providers';

/**
 * LINE Login Button Component
 * Using @aid-on/auth-providers for secure OAuth flow
 */
interface Props {
  className?: string;
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

    // Initialize LINE Auth Client (client-side safe operations only)
    const lineAuth = new LineAuthClient({
      clientId,
      clientSecret: '', // Not needed for authorization URL generation
      redirectUri: '' // Will be set below
    });

    // Generate secure state for CSRF protection
    const state = lineAuth.generateState();

    // For Firebase integration, store state in cookies for server-side verification
    document.cookie = `line_state=${state}; path=/; max-age=600; samesite=lax`;

    // Determine redirect URI based on environment
    const projectId = process.env.NEXT_PUBLIC_GCP_PROJECT_ID;
    const region = process.env.NEXT_PUBLIC_GCP_REGION || 'asia-northeast1';
    
    // Use Cloud Functions URL in production, local API route in development
    const redirectUri = projectId && process.env.NODE_ENV === 'production'
      ? `https://${region}-${projectId}.cloudfunctions.net/lineCallback`
      : `${window.location.origin}/api/auth/line/callback`;

    // Generate authorization URL with proper parameters
    const authUrl = lineAuth.getAuthorizationUrl({
      state,
      scope: 'profile openid',
      redirectUri,
      // Optional: Add bot_prompt for LINE official account friendship
      botPrompt: 'normal'
    });

    // Optional: Store state in Firestore for Cloud Functions (if needed)
    if (projectId && process.env.NODE_ENV === 'production') {
      try {
        const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase');
        
        await setDoc(doc(db, 'line_auth_sessions', state), {
          createdAt: serverTimestamp(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        });
      } catch (error: unknown) {
        console.error('Failed to store auth session in Firestore:', error);
        // Continue anyway - server-side will use cookies
      }
    }

    // Redirect to LINE authorization page
    window.location.assign(authUrl);
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={classNames(
        'flex w-full items-center justify-center gap-3 rounded-lg border p-3 font-medium',
        'hover:bg-green-50 disabled:opacity-60 transition',
        'border-green-500 text-green-700',
        className
      )}
      aria-label="Sign in with LINE"
    >
      {/* LINE Icon */}
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden fill="#06C755">
        <path d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10a9.96 9.96 0 0 1-4.477-1.06L4 22l1.097-3.934A9.959 9.959 0 0 1 2 12Z" />
        <path fill="#fff" d="M7.8 9.6h1.2v3.6H7.8V9.6Zm3 0h1.2v3.6h-1.2V9.6Zm5.4 0v3.6h-1.2l-1.8-2.4v2.4h-1.2V9.6h1.2l1.8 2.4V9.6h1.2Z" />
      </svg>
      
      <span className="font-semibold">
        {loading ? 'リダイレクト中...' : 'LINEでログイン'}
      </span>
    </button>
  );
}