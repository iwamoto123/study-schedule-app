
# ローカル環境構築手順

新規参画メンバーの皆様がスムーズに環境構築できるよう、本プロジェクトのセットアップ方法をまとめています。  
以下の手順に従っていただき、開発を始めてください。

---

## 前提条件

- **Node.js** v18.18.0 以上 (このプロジェクトでは `.nvmrc` がないため、Node バージョンはプロジェクトルート直下の `package.json` や公式ドキュメントなどを参考に適宜合わせてください)
- **npm** (バージョンは自由ですが、プロジェクトには `package-lock.json` が含まれています)
- （任意）エディターにて以下の設定や拡張機能を導入すると開発が快適です
  - **ESLint** などの Lint 機能
  - **Prettier** などのフォーマッター

---

## 1. リポジトリのクローン

ローカルにクローンしたいディレクトリに移動し、以下のコマンドを実行してリポジトリを取得してください。

```bash
git clone <このリポジトリのURL>
```

その後、取得したリポジトリのディレクトリに移動します。

```bash
cd study-schedule-app
```

---

## 2. 依存関係のインストール

初回セットアップ時は、プロジェクトルートで以下のコマンドを実行して依存関係をインストールしてください。

```bash
npm install
```

（このプロジェクトでは `package-lock.json` を使用しているため、npm を推奨しています）

---

## 3. 環境変数の設定 (必要があれば)

本プロジェクトでは Next.js の[エンバイロンメント変数](https://nextjs.org/docs/basic-features/environment-variables)が必要な場合、`.env.local` などに記載することで開発環境で利用できます。  
通常の開発やビルドの実行で特別な環境変数が必要なければ、このステップは不要です。

- 環境変数を追加したい場合は、`/.gitignore` に記載されているように、`.env` 系ファイルはリポジトリにコミットされないようになっています。
- 例: `.env.local` ファイルを作り、そこに `API_KEY=xxxxx` などの設定を追加

---

## 4. 開発サーバーの起動

以下のコマンドで開発用サーバーを起動できます。  
(TurboPack が有効になっているので、変更が即時反映される高速開発環境です)

```bash
npm run dev
```

- 起動に成功すると、自動的に以下のようなメッセージが表示されます  
  **Local:**   `http://localhost:3000`  
- ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスして動作をご確認ください。

---

## 5. フォルダ構成

本プロジェクトの主なフォルダ構成と役割は以下のとおりです。

```bash
study-schedule-app/
├── .gitignore               # Git で追跡しないファイル/フォルダを定義
├── README.md                # プロジェクト説明・セットアップ手順等（このファイル）
├── app/
│   ├── favicon.ico          # Favicon 画像
│   ├── globals.css          # 全体で読み込むグローバルスタイル
│   ├── layout.tsx           # Next.js App Router のルートレイアウト
│   └── page.tsx             # ルート (`/`) ページ
├── eslint.config.mjs        # ESLint の設定
├── next.config.ts           # Next.js の設定
├── package-lock.json        # npm ロックファイル
├── package.json             # スクリプトや依存関係の定義
├── postcss.config.mjs       # PostCSS (TailwindCSS) の設定
├── public/
│   ├── file.svg             # 画像・アイコンなどの静的ファイル
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
└── tsconfig.json            # TypeScript のコンパイラ設定
```

- **`app/`** ディレクトリ
  - Next.js App Router で使用されるメインのページやレイアウトを格納しています
  - `globals.css` には TailwindCSS を読み込む設定を含み、全体スタイルを定義
  - `layout.tsx` は各ページをラップする共通レイアウト
  - `page.tsx` はトップレベルのルーティング (`/`) を表すページコンポーネント

- **`public/`** ディレクトリ
  - 直接参照可能な静的ファイルが含まれます

---

## 6. スクリプト一覧

### `npm run dev`

- Next.js の開発用サーバーを起動します  
- [http://localhost:3000](http://localhost:3000) でアクセス  
- ファイル編集時はホットリロードが走ります

### `npm run build`

- 本番用ビルドを行います  
- `.next/` フォルダに最適化されたビルド成果物が作成されます

### `npm run start`

- `build` コマンドで生成された成果物を使って本番サーバーを起動します  
- 主に本番環境もしくはビルド後の動作確認時に使用します

### `npm run lint`

- ESLint によるコードチェックを実行します  
- エラーや警告は適宜修正してください

---

## 7. テスト (任意)

現在このリポジトリにはテストスクリプトが設定されていません。  
将来的にユニットテストや統合テストを導入する場合は、`tests/` ディレクトリの作成や `npm run test` スクリプトの追加などを行います。

---

## 8. デプロイ

to do

---

## 9. お問い合わせ・不明点

セットアップや開発フローに不明点があれば、以下を参照またはチームメンバーへご相談ください。

- [Next.js 公式ドキュメント](https://nextjs.org/docs)  
- [TailwindCSS 公式ドキュメント](https://tailwindcss.com/docs)  
- [TypeScript 公式ドキュメント](https://www.typescriptlang.org/docs/)  

どうぞよろしくお願いいたします！

