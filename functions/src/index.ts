/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// functions/src/index.ts
import * as functions from "firebase-functions";

/**
 * Ping 用の簡単な HTTP 関数
 *   デプロイ後:  https://<project-id>.cloudfunctions.net/hello
 */
export const hello = functions
  .region("asia-northeast1")
  .https.onRequest((req, res) => {
    functions.logger.info("Hello function called!", { structuredData: true });
    res.status(200).send("Hello from Cloud Functions!");
  });


// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
