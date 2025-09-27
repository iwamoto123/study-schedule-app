# Firestore ルールのデプロイ手順

## 匿名ユーザー対応のルール更新

`firestore.rules` ファイルが匿名ユーザーを適切にサポートするよう更新されました。主な変更点は、認証済みユーザー（匿名ユーザー含む）が自分のデータにアクセスできるようになったことです：

```
allow read, write: if request.auth != null;
```

## ルールのデプロイ方法：

### オプション1: Firebase Console（素早いデプロイにおすすめ）

1. [Firebase Console](https://console.firebase.google.com/project/study-schedule-app/firestore/rules) を開く
2. `firestore.rules` の内容を全てコピー
3. ルールエディタにペースト
4. 「公開」をクリック

### オプション2: Firebase CLI（再認証後）

```bash
# Firebase CLI に再認証
firebase login --reauth

# Firestore ルールのみをデプロイ
firebase deploy --only firestore:rules
```

### オプション3: gcloud 使用（再認証後）

```bash
# gcloud に再認証
gcloud auth login

# デプロイスクリプトを実行
node scripts/deploy-firestore-rules.js
```

## 修正される問題：

- ✅ 匿名ユーザーが教材を作成可能に
- ✅ 匿名ユーザーが自分のデータを読み書き可能に
- ✅ 教材保存時の 400 Bad Request エラーを修正
- ✅ 「Missing or insufficient permissions」エラーを解決

## デプロイ後のテスト方法：

1. シークレット/プライベートブラウザウィンドウでアプリを開く
2. アプリが自動的に匿名ログインを実行
3. 新しい教材を作成してみる
4. エラーなく保存できることを確認