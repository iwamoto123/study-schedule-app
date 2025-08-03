'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function LineCallbackContent() {
  const [status, setStatus] = useState('処理中...');
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        
        if (!code || !state) {
          setStatus('認証パラメータが不正です');
          setTimeout(() => router.push('/login?error=params'), 2000);
          return;
        }

        // Get stored values from sessionStorage
        const savedState = sessionStorage.getItem('line_state');
        const codeVerifier = sessionStorage.getItem('line_cv');

        if (state !== savedState || !codeVerifier) {
          setStatus('認証状態が一致しません');
          setTimeout(() => router.push('/login?error=state'), 2000);
          return;
        }

        // Call Cloud Functions with the data
        const projectId = process.env.NEXT_PUBLIC_GCP_PROJECT_ID;
        const region = process.env.NEXT_PUBLIC_GCP_REGION || 'asia-northeast1';
        
        if (!projectId) {
          setStatus('設定エラー');
          setTimeout(() => router.push('/login?error=config'), 2000);
          return;
        }

        setStatus('トークンを交換中...');

        const response = await fetch(`https://${region}-${projectId}.cloudfunctions.net/lineCallback`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            state,
            codeVerifier,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.customToken) {
            setStatus('認証成功！リダイレクト中...');
            
            // Clean up sessionStorage
            sessionStorage.removeItem('line_state');
            sessionStorage.removeItem('line_cv');
            
            // Redirect to materials page with token
            router.push(`/materials?token=${result.customToken}`);
          } else {
            throw new Error('No custom token received');
          }
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.error('LINE callback error:', error);
        setStatus('認証に失敗しました');
        setTimeout(() => router.push('/login?error=server'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">LINE認証</h1>
        <p className="text-gray-600">{status}</p>
        <div className="mt-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}

export default function LineCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">LINE認証</h1>
          <p className="text-gray-600">読み込み中...</p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          </div>
        </div>
      </div>
    }>
      <LineCallbackContent />
    </Suspense>
  );
}