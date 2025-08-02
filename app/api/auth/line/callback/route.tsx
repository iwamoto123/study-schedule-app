/* =========================================================================
 * app/api/auth/line/callback/route.ts         ★ファイル丸ごと貼り替え
 * ========================================================================= */
import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

/** ★ これを追加 ── “絶対ダイナミック” 宣言 */
export const dynamic  = 'force-dynamic';
export const runtime  = 'nodejs';           // Edge では動かない Admin SDK 用

/* ---------- Firebase Admin 初期化 (once) ---------- */
if (!admin.apps.length) {
  const projectId = process.env.GCP_PROJECT_ID || process.env.NEXT_PUBLIC_GCP_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
    });
  } else {
    console.warn('Firebase Admin not initialized: missing environment variables');
  }
}
const adminAuth = admin.apps.length > 0 ? admin.auth() : null;
const adminDb   = admin.apps.length > 0 ? admin.firestore() : null;

/* ------------------------------------------------------------------ */
/* GET /api/auth/line/callback?code=...&state=...                      */
/* ------------------------------------------------------------------ */
export async function GET(req: NextRequest) {
  console.log('[LINE Callback] Started');
  
  try {
    /* ----- Firebase Admin チェック ----- */
    if (!adminAuth || !adminDb) {
      console.error('[LINE Callback] Firebase Admin not initialized');
      const proto = req.headers.get('x-forwarded-proto') ?? 'http';
      const host  = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
      const base  = `${proto}://${host}`;
      return NextResponse.redirect(`${base}/login?error=config`);
    }
    
    /* ----- 環境変数チェック ----- */
    const requiredEnvs = ['LINE_CHANNEL_ID', 'LINE_CHANNEL_SECRET'];
    for (const env of requiredEnvs) {
      if (!process.env[env]) {
        console.error(`[LINE Callback] Missing env: ${env}`);
        return NextResponse.json({ error: `Missing ${env}` }, { status: 500 });
      }
    }
    
    /* ----- 呼び出し元オリジンを組み立て ----- */
    const proto = req.headers.get('x-forwarded-proto') ?? 'http';
    const host  = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
    const base  = `${proto}://${host}`;
    console.log('[LINE Callback] Base URL:', base);

  /* ----- state / code 検証 ----- */
  const url    = new URL(req.url);
  const code   = url.searchParams.get('code');
  const state  = url.searchParams.get('state');
  const saved  = req.cookies.get('line_state')?.value;
  if (!code || state !== saved) {
    return NextResponse.redirect(`${base}/login?error=state`);
  }
  const codeVerifier = req.cookies.get('line_cv')?.value ?? '';
  if (!codeVerifier) {
    return NextResponse.redirect(`${base}/login?error=pkce`);
  }

  /* ----- トークン交換 (PKCE/S256) ----- */
  const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method : 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body   : new URLSearchParams({
      grant_type   : 'authorization_code',
      code,
      redirect_uri : `${base}/api/auth/line/callback`,
      client_id    : process.env.LINE_CHANNEL_ID!,
      client_secret: process.env.LINE_CHANNEL_SECRET!,
      code_verifier: codeVerifier,
    }),
  });
  if (!tokenRes.ok) {
    console.error('[LINE token]', await tokenRes.text());
    return NextResponse.redirect(`${base}/login?error=token`);
  }
  const { access_token, id_token } = (await tokenRes.json()) as {
    access_token: string; id_token: string;
  };

  /* ----- id_token → LINE UID ----- */
  const [, payloadB64] = id_token.split('.');
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
  const uid: string = payload.sub;

  /* ----- プロフィール取得 ----- */
  const profRes = await fetch('https://api.line.me/v2/profile', {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!profRes.ok) {
    console.error('[LINE profile]', await profRes.text());
    return NextResponse.redirect(`${base}/login?error=profile`);
  }
  const profile = (await profRes.json()) as {
    displayName: string; pictureUrl: string;
  };

  /* ----- Firestore upsert ----- */
  await adminDb.doc(`users/${uid}`).set(
    {
      displayName: profile.displayName,
      pictureUrl : profile.pictureUrl,
      provider   : 'line',
      updatedAt  : FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  /* ----- Firebase Custom Token ----- */
  const customToken = await adminAuth.createCustomToken(uid);

  /* ----- フロントへリダイレクト ----- */
  const redirect = new URL('/materials', base);
  redirect.searchParams.set('token', customToken);
  console.log('[LINE Callback] Success, redirecting to:', redirect.toString());
  return NextResponse.redirect(redirect);
  
  } catch (error) {
    console.error('[LINE Callback] Error:', error);
    const proto = req.headers.get('x-forwarded-proto') ?? 'http';
    const host  = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
    const base  = `${proto}://${host}`;
    return NextResponse.redirect(`${base}/login?error=server`);
  }
}
