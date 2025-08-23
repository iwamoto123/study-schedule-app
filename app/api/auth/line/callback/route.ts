/**
 * LINE OAuth Callback Handler with Firebase Integration
 * Using @aid-on/auth-providers for LINE authentication
 */
import { NextRequest, NextResponse } from 'next/server';
import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { LineAuthClient } from '@aid-on/auth-providers';

// Force dynamic rendering for Firebase Admin SDK
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/* ---------- Firebase Admin initialization ---------- */
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
const adminDb = admin.apps.length > 0 ? admin.firestore() : null;

/* ---------- LINE Auth Client initialization ---------- */
// Dynamic redirect URI based on environment
function getRedirectUri(req: NextRequest): string {
  if (process.env.LINE_REDIRECT_URI) {
    return process.env.LINE_REDIRECT_URI;
  }
  const proto = req.headers.get('x-forwarded-proto') ?? 'http';
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  return `${proto}://${host}/api/auth/line/callback`;
}

/**
 * GET /api/auth/line/callback?code=...&state=...
 * Handles LINE OAuth callback and creates Firebase custom token
 */
export async function GET(req: NextRequest) {
  console.log('[LINE Callback] Started');
  
  try {
    // Check Firebase Admin initialization
    if (!adminAuth || !adminDb) {
      console.error('[LINE Callback] Firebase Admin not initialized');
      const proto = req.headers.get('x-forwarded-proto') ?? 'http';
      const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
      const base = `${proto}://${host}`;
      return NextResponse.redirect(`${base}/login?error=config`);
    }
    
    // Check required environment variables
    const requiredEnvs = ['LINE_CHANNEL_ID', 'LINE_CHANNEL_SECRET'];
    for (const env of requiredEnvs) {
      if (!process.env[env]) {
        console.error(`[LINE Callback] Missing env: ${env}`);
        return NextResponse.json({ error: `Missing ${env}` }, { status: 500 });
      }
    }
    
    // Build base URL
    const proto = req.headers.get('x-forwarded-proto') ?? 'http';
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
    const base = `${proto}://${host}`;
    console.log('[LINE Callback] Base URL:', base);

    // Extract and validate state/code
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const savedState = req.cookies.get('line_state')?.value;
    
    if (!code) {
      console.error('[LINE Callback] Missing authorization code');
      return NextResponse.redirect(`${base}/login?error=code`);
    }
    
    // Initialize LINE Auth Client with dynamic redirect URI
    const lineAuth = new LineAuthClient({
      clientId: process.env.LINE_CHANNEL_ID!,
      clientSecret: process.env.LINE_CHANNEL_SECRET!,
      redirectUri: getRedirectUri(req)
    });
    
    // Verify state for CSRF protection
    if (!lineAuth.verifyState(state || '', savedState || '')) {
      console.error('[LINE Callback] State mismatch');
      return NextResponse.redirect(`${base}/login?error=state`);
    }
    
    // Exchange code for access token using the library
    console.log('[LINE Callback] Exchanging code for token');
    const tokens = await lineAuth.getAccessToken(code);
    
    // Get user profile from LINE
    console.log('[LINE Callback] Fetching user profile');
    const profile = await lineAuth.getUserProfile(tokens.access_token);
    
    console.log('[LINE Callback] User profile:', {
      userId: profile.userId,
      displayName: profile.displayName
    });
    
    // Upsert user data to Firestore
    await adminDb.doc(`users/${profile.userId}`).set(
      {
        displayName: profile.displayName,
        pictureUrl: profile.pictureUrl,
        provider: 'line',
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    
    // Create Firebase custom token
    const customToken = await adminAuth.createCustomToken(profile.userId, {
      provider: 'line',
      displayName: profile.displayName
    });
    
    // Clear auth cookies
    const response = NextResponse.redirect(new URL(`/materials?token=${customToken}`, base));
    response.cookies.delete('line_state');
    response.cookies.delete('line_cv'); // Remove PKCE verifier if used
    
    console.log('[LINE Callback] Success, redirecting to materials page');
    return response;
    
  } catch (error) {
    console.error('[LINE Callback] Error:', error);
    const proto = req.headers.get('x-forwarded-proto') ?? 'http';
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
    const base = `${proto}://${host}`;
    
    // Determine error type for better user feedback
    let errorType = 'server';
    if (error instanceof Error) {
      if (error.message.includes('token')) errorType = 'token';
      if (error.message.includes('profile')) errorType = 'profile';
    }
    
    return NextResponse.redirect(`${base}/login?error=${errorType}`);
  }
}