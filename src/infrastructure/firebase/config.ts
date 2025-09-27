import type { FirebaseOptions } from 'firebase/app';

/**
 * Firebase設定を環境変数から取得
 */
export function getFirebaseConfig(): FirebaseOptions {
  const configString = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;

  if (!configString) {
    const msg = '[Firebase] NEXT_PUBLIC_FIREBASE_CONFIG is not defined. Set valid JSON string in .env.local.';
    console.error(msg);
    throw new Error(msg);
  }

  try {
    return JSON.parse(configString) as FirebaseOptions;
  } catch (error) {
    const msg = '[Firebase] Failed to parse NEXT_PUBLIC_FIREBASE_CONFIG. Ensure it is a valid JSON string.';
    console.error(msg, error);
    throw new Error(msg);
  }
}

/**
 * Firebase プロジェクトIDを取得
 */
export function getProjectId(): string {
  const projectId = process.env.NEXT_PUBLIC_GCP_PROJECT_ID;
  if (!projectId) {
    throw new Error('[Firebase] NEXT_PUBLIC_GCP_PROJECT_ID is not defined');
  }
  return projectId;
}

/**
 * GCPリージョンを取得
 */
export function getRegion(): string {
  return process.env.NEXT_PUBLIC_GCP_REGION || 'asia-northeast1';
}