/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// functions/src/index.ts
import { onRequest } from "firebase-functions/v2/https";
import { logger }   from "firebase-functions";

/**
 * Ping 用の簡単な HTTP 関数
 *   デプロイ後:  https://<project-id>.cloudfunctions.net/hello
 */
export const hello = onRequest(
  // ────────────────────────────────
  //  v2 では region／memory／timeout などは
  //  第 1 引数に “オプションオブジェクト” として渡します
  // ────────────────────────────────
  {
    region : "asia-northeast1",   // 東京リージョン
    memory : "256MiB",            // 例: メモリ制限を付けたい場合
    timeoutSeconds : 60           // 例: タイムアウトを付けたい場合
  },
  // ────────────────────────────────
  //  実装
  // ────────────────────────────────
  (req, res) => {
    logger.info("Hello function called!", { structuredData: true });
    res.status(200).send("Hello from Cloud Functions v2!");
  }
);


// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
