'use client';

import type { ReactNode } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context';
import type { ReadonlyURLSearchParams } from 'next/navigation';
import { signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import clsx from 'clsx';

import LineLoginButton from '@/components/LineLoginButton';
import { auth } from '@/lib/firebase';
import { AUTH_MODES, type AuthMode } from '@auth/authMode';

interface HandleCustomTokenArgs {
  token: string;
  url: URL;
  router: AppRouterInstance;
}

interface HandleLineCallbackArgs {
  searchParams: ReadonlyURLSearchParams;
  router: AppRouterInstance;
  setStatus: (status: string) => void;
  signal: AbortSignal;
}

export interface AuthAdapter {
  id: AuthMode;
  label: string;
  federatedLoginEnabled: boolean;
  renderPrimaryLoginAction?: (props: { className?: string; router: AppRouterInstance }) => ReactNode;
  handleCustomToken?: (args: HandleCustomTokenArgs) => Promise<void>;
  supportsLineCallback: boolean;
  handleLineCallback?: (args: HandleLineCallbackArgs) => Promise<void>;
}

type PrimaryActionProps = { className?: string; router: AppRouterInstance };

const LinePrimaryAction = ({ className }: PrimaryActionProps) => (
  <LineLoginButton className={className} />
);

const lineAuthAdapter: AuthAdapter = {
  id: 'line',
  label: 'LINE 連携',
  federatedLoginEnabled: true,
  renderPrimaryLoginAction: (props) => <LinePrimaryAction {...props} />,
  handleCustomToken: async ({ token, url, router }) => {
    try {
      await signInWithCustomToken(auth, token);
      console.log('[Auth] Successfully signed in with custom token');
      url.searchParams.delete('token');
      router.replace('/materials');
    } catch (error) {
      console.error('[Auth] Failed to sign in with custom token:', error);
      alert('認証エラーが発生しました。もう一度ログインしてください。');
      router.replace('/login');
    }
  },
  supportsLineCallback: true,
  handleLineCallback: async ({ searchParams, router, setStatus, signal }) => {
    try {
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      if (!code || !state) {
        setStatus('認証パラメータが不正です');
        setTimeout(() => router.replace('/login?error=params'), 1200);
        return;
      }

      const expectedState = sessionStorage.getItem('line_state');
      if (state !== expectedState) {
        setStatus('認証状態が一致しません');
        setTimeout(() => router.replace('/login?error=state'), 1200);
        return;
      }

      const region = process.env.NEXT_PUBLIC_GCP_REGION || 'asia-northeast1';
      const projectId = process.env.NEXT_PUBLIC_GCP_PROJECT_ID;
      if (!projectId) {
        setStatus('設定エラー（プロジェクトID 未設定）');
        setTimeout(() => router.replace('/login?error=config'), 1200);
        return;
      }

      const url = `https://${region}-${projectId}.cloudfunctions.net/lineCallback`;
      setStatus('トークン交換中...');

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, state, expectedState }),
        signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('lineCallback response:', text);
        throw new Error(`HTTP ${res.status} ${text}`);
      }

      type CallbackResponse = { customToken?: string };
      const data: CallbackResponse = await res.json().catch(() => ({} as CallbackResponse));
      const customToken = data.customToken;
      if (!customToken) throw new Error('No customToken');

      setStatus('サインイン中...');
      await signInWithCustomToken(auth, customToken);

      sessionStorage.removeItem('line_state');
      router.replace('/materials');
    } catch (error) {
      if ((error as DOMException).name === 'AbortError') return;
      console.error('LINE callback error:', error);
      setStatus('認証に失敗しました');
      setTimeout(() => router.replace('/login?error=server'), 1400);
    }
  },
};

const emailAuthAdapter: AuthAdapter = {
  id: 'email',
  label: 'メールアドレス',
  federatedLoginEnabled: false,
  supportsLineCallback: false,
};
const DevPrimaryAction = ({ className, router }: PrimaryActionProps) => (
  <button
    type="button"
    onClick={async () => {
      try {
        await signInAnonymously(auth);
        console.info('[Auth] Signed in anonymously (dev mode)');
        router.replace('/materials');
      } catch (error) {
        console.error('[Auth] Anonymous sign-in failed:', error);
        const code =
          typeof error === 'object' && error && 'code' in error
            ? String((error as { code: unknown }).code)
            : null;
        if (code === 'auth/operation-not-allowed') {
          alert('Firebase の匿名認証が無効になっています。Firebase コンソールで Anonymous provider を有効にしてください。');
        } else if (code === 'auth/network-request-failed') {
          alert('ネットワークエラーで匿名ログインに失敗しました。接続を確認して再度お試しください。');
        } else {
          alert('匿名ログインに失敗しました。詳細はコンソールを参照してください。');
        }
      }
    }}
    className={clsx(
      'flex w-full items-center justify-center gap-3 rounded-lg border border-dashed border-gray-400 bg-gray-100 p-3 text-sm font-medium text-gray-600',
      'hover:bg-gray-200 transition-colors',
      className,
    )}
  >
    開発モード：匿名ログイン
  </button>
);

const devAuthAdapter: AuthAdapter = {
  id: 'dev',
  label: '開発モード',
  federatedLoginEnabled: false,
  renderPrimaryLoginAction: (props) => <DevPrimaryAction {...props} />,
  supportsLineCallback: false,
};

const ADAPTER_MAP: Record<AuthMode, AuthAdapter> = {
  line: lineAuthAdapter,
  email: emailAuthAdapter,
  dev: devAuthAdapter,
};

export const authAdapters: AuthAdapter[] = AUTH_MODES.map((mode) => ADAPTER_MAP[mode]).filter(
  Boolean,
) as AuthAdapter[];

export const federatedAuthAdapters = authAdapters.filter(
  (adapter) => typeof adapter.renderPrimaryLoginAction === 'function',
);

export const passwordAuthEnabled = authAdapters.some((adapter) => adapter.id === 'email');

export const getCustomTokenHandler = () =>
  authAdapters.find((adapter) => adapter.handleCustomToken)?.handleCustomToken ?? null;

export const getLineCallbackHandler = () =>
  authAdapters.find((adapter) => adapter.supportsLineCallback && adapter.handleLineCallback)
    ?.handleLineCallback ?? null;
