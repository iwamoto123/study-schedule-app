#!/usr/bin/env node

/**
 * Firestore ルールを直接デプロイ
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const PROJECT_ID = 'study-schedule-app';
const RULES_FILE = path.join(__dirname, '..', 'firestore-dev.rules');

// 開発用ルールを直接定義
const DEV_RULES = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    /* --- Functions専用（クライアントは全面禁止） --- */
    match /line_groups/{groupId} {
      allow read, write: if false;
    }
    match /line_auth_sessions/{document} {
      allow read, write: if false;
    }

    /* --- 開発用：認証済みユーザーは全てのユーザーデータにアクセス可（本番では絶対に使用しない） --- */
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null;
    }

    /* --- 旧トップレベルコレクションは未使用なら明示禁止で安全 --- */
    match /materials/{materialId} { allow read, write: if false; }
    match /study_schedules/{scheduleId} { allow read, write: if false; }
  }
}`;

// Firebase Admin SDK credentials from environment
const serviceAccount = {
  type: "service_account",
  project_id: PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: `firebase-adminsdk@${PROJECT_ID}.iam.gserviceaccount.com`,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
};

async function getAccessToken() {
  // Google OAuth2 token endpoint
  const tokenUrl = 'https://oauth2.googleapis.com/token';

  // Create JWT for service account authentication
  const now = Math.floor(Date.now() / 1000);
  const jwt = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: tokenUrl,
    exp: now + 3600,
    iat: now
  };

  // Note: This would normally require signing with the private key
  // For now, we'll use a simpler approach
  console.log('⚠️  認証情報が必要です。Firebase Consoleから手動でデプロイしてください。');
  return null;
}

async function deployRulesViaConsole() {
  console.log('📋 以下の手順でFirebase Consoleからルールをデプロイしてください：\n');
  console.log('1. 以下のURLをブラウザで開く:');
  console.log(`   https://console.firebase.google.com/project/${PROJECT_ID}/firestore/rules\n`);
  console.log('2. 現在のルールを全て削除して、以下のルールをコピー＆ペースト:\n');
  console.log('```');
  console.log(DEV_RULES);
  console.log('```\n');
  console.log('3. 「公開」ボタンをクリック\n');
  console.log('✅ これで匿名ユーザーも教材を保存できるようになります！');

  // ルールをファイルに保存
  fs.writeFileSync(RULES_FILE, DEV_RULES);
  console.log(`\n📝 ルールは ${RULES_FILE} にも保存されました。`);
}

// メイン処理
(async () => {
  console.log('🔥 Firestore 開発用ルールをデプロイします...\n');
  await deployRulesViaConsole();
})();