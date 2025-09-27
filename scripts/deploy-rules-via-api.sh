#!/bin/bash

# Firestore ルールをREST API経由でデプロイするスクリプト

PROJECT_ID="study-schedule-app"
RULES_FILE="firestore-dev.rules"

echo "🔥 Firestore開発用ルールをデプロイ中..."

# gcloudで認証トークンを取得
ACCESS_TOKEN=$(gcloud auth print-access-token 2>/dev/null)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "❌ gcloud認証が必要です"
    echo "以下のコマンドを実行してください:"
    echo ""
    echo "  gcloud auth login"
    echo ""
    exit 1
fi

# ルールファイルの内容を読み込み
RULES_CONTENT=$(cat "$RULES_FILE")

# エスケープ処理
ESCAPED_RULES=$(echo "$RULES_CONTENT" | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g')

# APIリクエストボディを作成
REQUEST_BODY=$(cat <<EOF
{
  "source": {
    "files": [
      {
        "content": "$ESCAPED_RULES",
        "name": "firestore.rules"
      }
    ]
  }
}
EOF
)

# ルールセットを作成
echo "📝 ルールセットを作成中..."
RESPONSE=$(curl -s -X POST \
  "https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/rulesets" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$REQUEST_BODY")

# ルールセットIDを抽出
RULESET_NAME=$(echo "$RESPONSE" | grep -o '"name":[[:space:]]*"[^"]*"' | sed 's/.*"name":[[:space:]]*"\([^"]*\)".*/\1/')

if [ -z "$RULESET_NAME" ]; then
    echo "❌ ルールセットの作成に失敗しました"
    echo "$RESPONSE"
    exit 1
fi

RULESET_ID=$(echo "$RULESET_NAME" | sed 's/.*\///')
echo "✅ ルールセット作成完了: $RULESET_ID"

# ルールセットをリリース
echo "🚀 ルールをリリース中..."
RELEASE_BODY=$(cat <<EOF
{
  "release": {
    "rulesetName": "$RULESET_NAME"
  }
}
EOF
)

RELEASE_RESPONSE=$(curl -s -X PATCH \
  "https://firebaserules.googleapis.com/v1/projects/${PROJECT_ID}/releases/cloud.firestore" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$RELEASE_BODY")

# 成功確認
if echo "$RELEASE_RESPONSE" | grep -q '"rulesetName"'; then
    echo "✅ Firestoreルールのデプロイが完了しました！"
    echo ""
    echo "📋 デプロイされたルール:"
    echo "  - 認証済みユーザーは全てのユーザーデータにアクセス可能"
    echo "  - 匿名ユーザーも自分のデータを作成・読み取り可能"
    echo ""
    echo "⚠️  注意: これは開発用ルールです。本番環境では適切なルールに変更してください。"
else
    echo "❌ ルールのリリースに失敗しました"
    echo "$RELEASE_RESPONSE"
    exit 1
fi