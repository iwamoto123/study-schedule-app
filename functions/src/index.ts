///functions/src/index.ts

import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import * as crypto from "crypto";

if (!admin.apps.length) admin.initializeApp();

const LINE_CHANNEL_ACCESS_TOKEN = defineSecret("LINE_CHANNEL_ACCESS_TOKEN");
const LINE_LIFF_ID              = defineSecret("LINE_LIFF_ID");

/** Secrets */
const LINE_CHANNEL_ID     = defineSecret("LINE_CHANNEL_ID");
const LINE_CHANNEL_SECRET = defineSecret("LINE_CHANNEL_SECRET");

/** 許可オリジン */
const PROJECT_ID = process.env.GCP_PROJECT_ID || process.env.GCLOUD_PROJECT || "study-schedule-app";
const ALLOWED_ORIGINS = [
  `https://${PROJECT_ID}.web.app`,
  `https://${PROJECT_ID}.firebaseapp.com`,
];

function setCors(req: any, res: any) {
  const origin = req.headers.origin as string | undefined;
  res.set("Access-Control-Allow-Origin", origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]);
  res.set("Vary", "Origin");
  res.set("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
}

function readSecretParam(param: any, envKeys: string[]) {
  try {
    const v = typeof param?.value === "function" ? param.value() : undefined;
    return (v || envKeys.map(k => process.env[k]).find(Boolean)) as string | undefined;
  } catch {
    return envKeys.map(k => process.env[k]).find(Boolean) as string | undefined;
  }
}

/** LINE: code→token を手動交換（client_secret_post 方式） */
async function exchangeLineToken(args: {
  code: string;
  redirectUri: string;
  clientId: string;
  clientSecret: string;
}) {
  const { code, redirectUri, clientId, clientSecret } = args;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
    client_id: clientId,          // ← 明示的に本文へ
    client_secret: clientSecret,  // ← 明示的に本文へ
  });

  const resp = await fetch("https://api.line.me/oauth2/v2.1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`token_exchange_failed ${resp.status} ${text}`);
  }
  return (await resp.json()) as {
    access_token: string;
    id_token?: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
    scope?: string;
  };
}

/** プロフィール取得（userId を得る） */
async function fetchLineProfile(accessToken: string) {
  const resp = await fetch("https://api.line.me/v2/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`profile_failed ${resp.status} ${text}`);
  }
  return (await resp.json()) as { userId: string; displayName: string; pictureUrl?: string };
}

/** フロント（/auth/line/callback）から { code, state, expectedState } を POST */
export const lineCallback = onRequest(
  { region: "asia-northeast1", secrets: [LINE_CHANNEL_ID, LINE_CHANNEL_SECRET] },
  async (req, res) => {
    setCors(req, res);
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST")    { res.status(405).send("Method Not Allowed"); return; }

    try {
      // Secret を取得して余分な空白を除去（← ここ重要）
      const rawId  = readSecretParam(LINE_CHANNEL_ID,     ["LINE_CHANNEL_ID","LINE_CLIENT_ID"]);
      const rawSec = readSecretParam(LINE_CHANNEL_SECRET, ["LINE_CHANNEL_SECRET","LINE_CLIENT_SECRET"]);
      const clientId     = (rawId  ?? "").trim();
      const clientSecret = (rawSec ?? "").trim();

      console.info("lineCallback cfg " + JSON.stringify({
        clientId_len: clientId.length,
        clientSecret_len: clientSecret.length,
      }));
      if (!clientId || !clientSecret) {
        res.status(500).type("text/plain; charset=utf-8").send("missing_line_config");
        return;
      }

      const { code, state, expectedState } = (req.body || {}) as {
        code?: string; state?: string; expectedState?: string;
      };
      if (!code || !state || !expectedState) {
        res.status(400).json({ error: "bad_params" });
        return;
      }

      // 呼び出し元 Origin に合わせて redirectUri を厳密一致
      const origin = (() => {
        const o = req.headers.origin as string | undefined;
        return o && ALLOWED_ORIGINS.includes(o) ? o : ALLOWED_ORIGINS[0];
      })();
      const redirectUri = `${origin}/auth/line/callback`;

      console.info("lineCallback redirect " + JSON.stringify({
        origin, redirectUri, code_len: String(code).length, state_len: String(state).length
      }));

      // 交換 → プロフィール → カスタムトークン
      const token = await exchangeLineToken({ code, redirectUri, clientId, clientSecret });
      const prof  = await fetchLineProfile(token.access_token);

      const uid = `line:${prof.userId}`;
      const customToken = await admin.auth().createCustomToken(uid, {
        provider: "line",
        displayName: prof.displayName ?? "",
        pictureUrl:  prof.pictureUrl  ?? "",
      });

      res.json({ customToken });
    } catch (err: any) {
      console.error("lineCallback error " + JSON.stringify({
        message: err?.message, stack: err?.stack
      }));
      res.set("Content-Type", "text/plain; charset=utf-8");
      res.status(500).send(`server_error: ${err?.message ?? ""}`);
    }
  }
);

/** 診断用 */
export const lineDiag = onRequest(
  { region: "asia-northeast1", secrets: [LINE_CHANNEL_ID, LINE_CHANNEL_SECRET] },
  async (_req, res) => {
    const id  = (readSecretParam(LINE_CHANNEL_ID,     ["LINE_CHANNEL_ID","LINE_CLIENT_ID"]) || "").trim();
    const sec = (readSecretParam(LINE_CHANNEL_SECRET, ["LINE_CHANNEL_SECRET","LINE_CLIENT_SECRET"]) || "").trim();
    res.json({ ok: true, clientId_len: id.length, clientSecret_len: sec.length, origins: ALLOWED_ORIGINS });
  }
);

// 追加 Secret（Messaging API の Channel secret）
const LINE_MESSAGING_CHANNEL_SECRET = defineSecret("LINE_MESSAGING_CHANNEL_SECRET");

// 生ボディで署名検証
function verifySignatureRaw(raw: Buffer, signature: string, channelSecret: string) {
  const hmac = crypto.createHmac("sha256", channelSecret);
  hmac.update(raw); // ★JSON.stringifyではなく“生のrawBody”
  const digest = hmac.digest("base64");
  return digest === signature;
}

export const lineWebhook = onRequest(
  { region: "asia-northeast1", secrets: [LINE_MESSAGING_CHANNEL_SECRET] },
  async (req, res) => {
    if (req.method !== "POST") { res.status(405).send("Method Not Allowed"); return; }

    // 署名検証（LINEは常にx-line-signatureを送ってくる）
    const signature = req.headers["x-line-signature"] as string | undefined;
    const secret = (readSecretParam(LINE_MESSAGING_CHANNEL_SECRET, ["LINE_MESSAGING_CHANNEL_SECRET"]) || "").trim();
    const raw = (req as any).rawBody as Buffer; // ★ Cloud Functionsで利用可
    if (!signature || !secret || !raw || !verifySignatureRaw(raw, signature, secret)) {
      res.status(400).send("Bad signature");
      return;
    }

    try {
      const events = (req.body?.events ?? []) as any[];
      for (const ev of events) {
        console.info(`event type=${ev.type} source=${ev.source?.type}`);

        if (ev.type === "join" && ev.source?.type === "group") {
          const gid = ev.source.groupId as string;
          await admin.firestore().doc(`line_groups/${gid}`).set({
            joinedAt: admin.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
        }
        // その他のイベントは特に処理しなくてもOK
      }
      // ★ 常に200を返す（Verifyはここが大事）
      res.json({ ok: true });
      
    } catch (e:any) {
      console.error("lineWebhook error", e?.message);
      res.status(500).json({ error: "server_error" });
    }
  }
);



/**notifyProgressDaily：全グループに Flex を Push*/
export const notifyProgressDaily = onRequest(
  { region: "asia-northeast1", secrets: [LINE_CHANNEL_ACCESS_TOKEN, LINE_LIFF_ID] },
  async (_req, res) => {
    try {
      const accessToken = (readSecretParam(LINE_CHANNEL_ACCESS_TOKEN, ["LINE_CHANNEL_ACCESS_TOKEN"]) || "").trim();
      const liffId      = (readSecretParam(LINE_LIFF_ID, ["LINE_LIFF_ID"]) || "").trim();

      const now   = new Date();
      const yyyy  = now.getFullYear();
      const mm    = String(now.getMonth()+1).padStart(2,"0");
      const dd    = String(now.getDate()).padStart(2,"0");
      const ymd   = `${yyyy}${mm}${dd}`;

      const ver   = `${yyyy}${mm}${dd}${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;
      const base  = liffId
      ? `https://liff.line.me/${liffId}`
      : `https://${PROJECT_ID}.web.app`;
       const uri   = `${base}?path=/progress&liff=1&date=${ymd}&v=${ver}`;
      // const uri   = liffId
      //   ? `https://liff.line.me/${liffId}?path=/progress&liff=1&date=${ymd}`
      //   : `https://${PROJECT_ID}.web.app/progress?liff=1&date=${ymd}`;

      const flex = {
        type: "bubble",
        size: "kilo",
        header: { type:"box", layout:"vertical", contents:[
          { type:"text", text:"今日の進捗入力", weight:"bold", size:"lg" },
          { type:"text", text:`${yyyy}/${mm}/${dd}`, size:"sm", color:"#666666" }
        ]},
        body: { type:"box", layout:"vertical", contents:[
          { type:"text", text:"タップしてそのまま入力できます", size:"sm", wrap:true }
        ]},
        footer: { type:"box", layout:"vertical", contents:[
          { type:"button", style:"primary", action:{ type:"uri", label:"入力する", uri } }
        ]}
      };

      const groupsSnap = await admin.firestore().collection("line_groups").get();
      const groupIds   = groupsSnap.docs.map(d => d.id);

      const push = async (to: string) => {
        const body = {
          to,
          messages: [{ type:"flex", altText:"今日の進捗入力", contents: flex }]
        };
        const r = await fetch("https://api.line.me/v2/bot/message/push", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(body)
        });
        if (!r.ok) {
          const t = await r.text().catch(()=> "");
          console.error("push error", to, r.status, t);
        }
      };

      await Promise.all(groupIds.map(push));
      res.json({ ok: true, groups: groupIds.length });
    } catch (e:any) {
      console.error("notifyProgressDaily error", e?.message);
      res.status(500).json({ error: "server_error" });
    }
  }
);


/**exchangeLiffToken：LIFFのIDトークン→Custom Token*/

export const exchangeLiffToken = onRequest(
  { region: "asia-northeast1", secrets: [LINE_CHANNEL_ID] },
  async (req, res) => {
    setCors(req, res);
    if (req.method === "OPTIONS") { res.status(204).send(""); return; }
    if (req.method !== "POST")    { res.status(405).send("Method Not Allowed"); return; }

    try {
      const { idToken } = req.body || {};
      if (!idToken) { res.status(400).json({ error: "bad_params" }); return; }

      const clientId = (readSecretParam(LINE_CHANNEL_ID, ["LINE_CHANNEL_ID","LINE_CLIENT_ID"]) || "").trim();

      // LINEのIDトークン検証
      const params = new URLSearchParams({ id_token: idToken, client_id: clientId });
      const vr = await fetch("https://api.line.me/oauth2/v2.1/verify", {
        method: "POST",
        headers: { "Content-Type":"application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      if (!vr.ok) {
        const txt = await vr.text().catch(()=> "");
        throw new Error(`id_token_verify_failed ${vr.status} ${txt}`);
      }
      const payload = await vr.json() as { sub: string, name?: string, picture?: string };

      const uid = `line:${payload.sub}`;
      const customToken = await admin.auth().createCustomToken(uid, {
        provider: "line",
        displayName: payload.name ?? "",
        pictureUrl:  payload.picture ?? "",
      });

      res.json({ customToken });
    } catch (e:any) {
      console.error("exchangeLiffToken error", e?.message);
      res.status(500).json({ error: "server_error", message: e?.message });
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

