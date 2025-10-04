#!/usr/bin/env node

/**
 * Firebase設定を環境変数に生成するスクリプト
 *
 * 使用方法:
 * 1. Firebase Consoleからプロジェクト設定を取得
 * 2. このスクリプトに設定を記載
 * 3. npm run generate:config で実行
 */

const fs = require('fs');
const path = require('path');

// Firebase設定（Firebase Consoleから取得）
const firebaseConfig = {
  projectId: "study-schedule-app",
  appId: "1:86208137541:web:ba3e09baff201ceaad962c",
  storageBucket: "study-schedule-app.firebasestorage.app",
<<<<<<< HEAD
  apiKey: "AIzaSyBuI7Uv3bMm7aI-HwHC_FGfwp4qSmVMTGo",
=======
  apiKey: process.env.FIREBASE_API_KEY || "",  // 環境変数から取得
>>>>>>> origin/fix/firebase-auth-and-firestore-rules
  authDomain: "study-schedule-app.firebaseapp.com",
  messagingSenderId: "86208137541",
  measurementId: "G-B8G6M3R9BW"
};

// プロジェクト設定
const projectConfig = {
  projectId: "study-schedule-app",
  region: "asia-northeast1",
  lineChannelId: "2006530074",
  authProviders: "line,email,dev",
  useCloudFunctions: true,
  emulator: false
};

function generateEnvContent() {
  const lines = [];

  // Firebase設定をJSON文字列として保存
  lines.push(`# Firebase Configuration (Auto-generated - DO NOT EDIT MANUALLY)`);
  lines.push(`# Generated at: ${new Date().toISOString()}`);
  lines.push(`NEXT_PUBLIC_FIREBASE_CONFIG='${JSON.stringify(firebaseConfig)}'`);
  lines.push('');

  // プロジェクト設定
  lines.push(`# Project Configuration`);
  lines.push(`NEXT_PUBLIC_GCP_PROJECT_ID=${projectConfig.projectId}`);
  lines.push(`NEXT_PUBLIC_GCP_REGION=${projectConfig.region}`);
  lines.push('');

  // 認証設定
  lines.push(`# Authentication Configuration`);
  lines.push(`NEXT_PUBLIC_USE_CLOUD_FUNCTIONS=${projectConfig.useCloudFunctions}`);
  lines.push(`NEXT_PUBLIC_LINE_CHANNEL_ID=${projectConfig.lineChannelId}`);
  lines.push(`NEXT_PUBLIC_AUTH_PROVIDERS=${projectConfig.authProviders}`);
  lines.push('');

  // 開発設定
  lines.push(`# Development Configuration`);
  lines.push(`NEXT_PUBLIC_EMULATOR=${projectConfig.emulator}`);

  return lines.join('\n');
}

function updateEnvFile() {
  const envPath = path.join(process.cwd(), '.env.local');
  const envContent = generateEnvContent();

  // バックアップを作成
  if (fs.existsSync(envPath)) {
    const backupPath = `${envPath}.backup.${Date.now()}`;
    fs.copyFileSync(envPath, backupPath);
    console.log(`✅ Backup created: ${backupPath}`);
  }

  // 新しい設定を書き込み
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Environment file updated: ${envPath}`);

  // 設定内容を表示
  console.log('\n📋 Generated Configuration:');
  console.log('----------------------------------------');
  console.log(`Project ID: ${firebaseConfig.projectId}`);
  console.log(`Auth Domain: ${firebaseConfig.authDomain}`);
<<<<<<< HEAD
=======
  console.log(`API Key: ${firebaseConfig.apiKey ? '[CONFIGURED]' : '[NOT SET - Please set FIREBASE_API_KEY env var]'}`);
>>>>>>> origin/fix/firebase-auth-and-firestore-rules
  console.log(`Region: ${projectConfig.region}`);
  console.log(`Auth Providers: ${projectConfig.authProviders}`);
  console.log('----------------------------------------');
}

// メイン処理
try {
<<<<<<< HEAD
=======
  // 環境変数からAPI Keyを取得する場合のメッセージ
  if (!process.env.FIREBASE_API_KEY) {
    console.log('\n⚠️  FIREBASE_API_KEY environment variable is not set.');
    console.log('   Using the API key from .env.local if it exists.');
  }

>>>>>>> origin/fix/firebase-auth-and-firestore-rules
  updateEnvFile();
  console.log('\n🎉 Firebase configuration generated successfully!');
  console.log('👉 Run "npm run dev" to start the application');
} catch (error) {
  console.error('❌ Error generating configuration:', error.message);
  process.exit(1);
}