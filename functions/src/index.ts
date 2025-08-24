// functions/src/index.ts
import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import * as admin from "firebase-admin";
import { createLineAuthHandler } from "@aid-on/auth-providers";

if (!admin.apps.length) admin.initializeApp();

// Secrets（そのまま流用OK）
const LINE_CHANNEL_ID     = defineSecret("LINE_CHANNEL_ID");
const LINE_CHANNEL_SECRET = defineSecret("LINE_CHANNEL_SECRET");

// Host/Callback をプロジェクトから導出
const PROJECT_ID   = process.env.GCP_PROJECT_ID || process.env.GCLOUD_PROJECT || "study-schedule-app";
const HOSTING_ORIGIN = `https://${PROJECT_ID}.web.app`;
const CALLBACK_PATH  = "/auth/line/callback";
const REGION = "asia-northeast1";

// CORS許可（本番ホストのみ）
function setCors(res: any) {
  res.set("Access-Control-Allow-Origin", HOSTING_ORIGIN);
  res.set("Vary", "Origin");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

// ✅ Nextの /auth/line/callback から JSON POST を受け、customToken を返す
export const lineCallback = onRequest(
  { region: REGION, secrets: [LINE_CHANNEL_ID, LINE_CHANNEL_SECRET] },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST")    { res.status(405).send("Method Not Allowed"); return; }

    try {
      const channelId     = LINE_CHANNEL_ID.value();
      const channelSecret = LINE_CHANNEL_SECRET.value();
      if (!channelId || !channelSecret) {
        logger.error("Missing LINE secrets");
        res.status(500).json({ error: "missing_line_config" });
        return;
      }

      // Next 側から受け取る
      const { code, state, expectedState } = (req.body || {}) as {
        code?: string; state?: string; expectedState?: string;
      };
      if (!code || !state || !expectedState) {
        res.status(400).json({ error: "bad_params" }); return;
      }

      // 新パッケージのサーバ側ハンドラで処理（state検証＋トークン交換＋ユーザー取得）
      const handler = createLineAuthHandler({
        clientId: channelId,
        clientSecret: channelSecret,
        redirectUri: `${HOSTING_ORIGIN}${CALLBACK_PATH}`, // ← LINEに登録したURLと完全一致
      });

      const { user /*, tokens*/ } = await handler.handleCallback({ code, state, expectedState });

      // Firebase UID を作る（user.id or user.userId など、ライブラリの戻り値に合わせて）
      const uid = `line:${(user as any).id ?? (user as any).userId}`;
      const customToken = await admin.auth().createCustomToken(uid, {
        provider: "line",
        displayName: (user as any).displayName ?? "",
        pictureUrl:  (user as any).pictureUrl  ?? "",
      });

      // （任意）プロフィールをFirestoreに保存したい場合
      // await admin.firestore().doc(`users/${uid}`).set(
      //   { displayName: user.displayName ?? "", pictureUrl: user.pictureUrl ?? "", provider: "line", updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      //   { merge: true }
      // );

      res.json({ customToken });
    } catch (err: any) {
      logger.error("lineCallback error", err);
      res.status(500).json({ error: "server_error", message: err?.message });
    }
  }
);


// /**
//  * Import function triggers from their respective submodules:
//  *
//  * import {onCall} from "firebase-functions/v2/https";
//  * import {onDocumentWritten} from "firebase-functions/v2/firestore";
//  *
//  * See a full list of supported triggers at https://firebase.google.com/docs/functions
//  */

// // functions/src/index.ts
// import { onRequest } from "firebase-functions/v2/https";
// import { defineSecret } from "firebase-functions/params";
// import { logger } from "firebase-functions";
// import * as admin from "firebase-admin";
// import { FieldValue } from "firebase-admin/firestore";

// // Initialize Firebase Admin
// if (!admin.apps.length) {
//   admin.initializeApp();
// }

// const adminAuth = admin.auth();
// const adminDb = admin.firestore();

// // Define secrets for LINE configuration
// const lineChannelId = defineSecret("LINE_CHANNEL_ID");
// const lineChannelSecret = defineSecret("LINE_CHANNEL_SECRET");

// /**
//  * Ping 用の簡単な HTTP 関数
//  *   デプロイ後:  https://<project-id>.cloudfunctions.net/hello
//  */
// export const hello = onRequest(
//   { region: "asia-northeast1" },
//   (req, res) => {
//     logger.info("Hello function called!", { structuredData: true });
//     res.status(200).send("Hello from Cloud Functions!");
//   }
// );

// /**
//  * LINE OAuth callback handler
//  * デプロイ後: https://<region>-<project-id>.cloudfunctions.net/lineCallback
//  */
// export const lineCallback = onRequest(
//   { 
//     region: "asia-northeast1",
//     secrets: [lineChannelId, lineChannelSecret]
//   },
//   async (req, res) => {
//     logger.info("[LINE Callback] Started", { structuredData: true });

//     try {
//       // Get configuration from secrets
//       const channelId = lineChannelId.value();
//       const channelSecret = lineChannelSecret.value();
      
//       logger.info("[LINE Callback] Channel ID:", channelId ? `${channelId.substring(0, 6)}...` : 'undefined');
//       logger.info("[LINE Callback] Channel Secret:", channelSecret ? 'defined' : 'undefined');
      
//       // Check required configuration
//       if (!channelId || !channelSecret) {
//         logger.error("[LINE Callback] Missing LINE configuration");
//         res.status(500).json({ error: "Missing LINE configuration" });
//         return;
//       }

//       // Get Firebase Hosting URL (Next.js app)
//       const projectId = process.env.GCP_PROJECT_ID || process.env.GCLOUD_PROJECT || "study-schedule-app";
//       const base = `https://${projectId}.web.app`;
//       logger.info("[LINE Callback] Base URL:", base);

//       const code = req.query.code as string;
//       const state = req.query.state as string;

//       if (!code || !state) {
//         logger.error("[LINE code/state missing]");
//         res.redirect(`${base}/?error=state`);
//         return;
//       }

//       // Retrieve codeVerifier from Firestore
//       const authSessionDoc = await admin
//         .firestore()
//         .collection("line_auth_sessions")
//         .doc(state)
//         .get();

//       if (!authSessionDoc.exists) {
//         logger.error("[LINE state not found]", { state });
//         res.redirect(`${base}/?error=state`);
//         return;
//       }

//       const authSession = authSessionDoc.data();
//       const codeVerifier = authSession?.codeVerifier;

//       if (!codeVerifier) {
//         logger.error("[LINE codeVerifier not found]", { state });
//         res.redirect(`${base}/?error=state`);
//         return;
//       }

//       // Delete the session after retrieving
//       await authSessionDoc.ref.delete();

//       // Exchange code for token (PKCE/S256)
//       // Get region for constructing the callback URL
//       const region = process.env.FUNCTION_REGION || "asia-northeast1";
//       const callbackUrl = `https://${region}-${projectId}.cloudfunctions.net/lineCallback`;
      
//       const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
//         method: "POST",
//         headers: { "Content-Type": "application/x-www-form-urlencoded" },
//         body: new URLSearchParams({
//           grant_type: "authorization_code",
//           code,
//           redirect_uri: callbackUrl,
//           client_id: channelId,
//           client_secret: channelSecret,
//           code_verifier: codeVerifier,
//         }),
//       });

//       if (!tokenRes.ok) {
//         const errorText = await tokenRes.text();
//         logger.error("[LINE token]", errorText);
//         res.redirect(`${base}/?error=token`);
//         return;
//       }

//       const { access_token, id_token } = (await tokenRes.json()) as {
//         access_token: string;
//         id_token: string;
//       };

//       // Extract LINE UID from id_token
//       const [, payloadB64] = id_token.split(".");
//       const payload = JSON.parse(
//         Buffer.from(payloadB64, "base64url").toString()
//       );
//       const uid: string = payload.sub;

//       // Get user profile
//       const profRes = await fetch("https://api.line.me/v2/profile", {
//         headers: { Authorization: `Bearer ${access_token}` },
//       });

//       if (!profRes.ok) {
//         const errorText = await profRes.text();
//         logger.error("[LINE profile]", errorText);
//         res.redirect(`${base}/?error=profile`);
//         return;
//       }

//       const profile = (await profRes.json()) as {
//         displayName: string;
//         pictureUrl: string;
//       };

//       // Upsert user to Firestore
//       await adminDb.doc(`users/${uid}`).set(
//         {
//           displayName: profile.displayName,
//           pictureUrl: profile.pictureUrl,
//           provider: "line",
//           updatedAt: FieldValue.serverTimestamp(),
//         },
//         { merge: true }
//       );

//       // Create Firebase Custom Token
//       const customToken = await adminAuth.createCustomToken(uid);

//       // Return token based on request method
//       if (req.method === 'POST') {
//         // Return JSON response for POST requests
//         logger.info("[LINE Callback] Success, returning token via JSON");
//         res.status(200).json({ customToken });
//       } else {
//         // Redirect for GET requests
//         const redirect = new URL("/materials", base);
//         redirect.searchParams.set("token", customToken);
//         logger.info(
//           "[LINE Callback] Success, redirecting to:",
//           redirect.toString()
//         );
//         res.redirect(redirect.toString());
//       }
//     } catch (error) {
//       logger.error("[LINE Callback] Error:", error);
//       const projectId = process.env.GCP_PROJECT_ID || process.env.GCLOUD_PROJECT || "study-schedule-app";
//       const errorBase = `https://${projectId}.web.app`;
      
//       if (req.method === 'POST') {
//         res.status(500).json({ error: 'Server error' });
//       } else {
//         res.redirect(`${errorBase}/?error=server`);
//       }
//     }
//   }
// );



// // Start writing functions
// // https://firebase.google.com/docs/functions/typescript

// // export const helloWorld = onRequest((request, response) => {
// //   logger.info("Hello logs!", {structuredData: true});
// //   response.send("Hello from Firebase!");
// // });

