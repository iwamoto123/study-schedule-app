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
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const adminAuth = admin.auth();
const adminDb = admin.firestore();

// Define secrets for LINE configuration
const lineChannelId = defineSecret("LINE_CHANNEL_ID");
const lineChannelSecret = defineSecret("LINE_CHANNEL_SECRET");

/**
 * Ping 用の簡単な HTTP 関数
 *   デプロイ後:  https://<project-id>.cloudfunctions.net/hello
 */
export const hello = onRequest(
  { region: "asia-northeast1" },
  (req, res) => {
    logger.info("Hello function called!", { structuredData: true });
    res.status(200).send("Hello from Cloud Functions!");
  }
);

/**
 * LINE OAuth callback handler
 * デプロイ後: https://<region>-<project-id>.cloudfunctions.net/lineCallback
 */
export const lineCallback = onRequest(
  { 
    region: "asia-northeast1",
    secrets: [lineChannelId, lineChannelSecret]
  },
  async (req, res) => {
    logger.info("[LINE Callback] Started", { structuredData: true });

    try {
      // Get configuration from secrets
      const channelId = lineChannelId.value();
      const channelSecret = lineChannelSecret.value();
      
      // Check required configuration
      if (!channelId || !channelSecret) {
        logger.error("[LINE Callback] Missing LINE configuration");
        res.status(500).json({ error: "Missing LINE configuration" });
        return;
      }

      // Get Firebase Hosting URL (Next.js app)
      const projectId = process.env.GCP_PROJECT_ID || process.env.GCLOUD_PROJECT || "study-schedule-app";
      const base = `https://${projectId}.web.app`;
      logger.info("[LINE Callback] Base URL:", base);

      const code = req.query.code as string;
      const state = req.query.state as string;

      if (!code || !state) {
        logger.error("[LINE code/state missing]");
        res.redirect(`${base}/?error=state`);
        return;
      }

      // Retrieve codeVerifier from Firestore
      const authSessionDoc = await admin
        .firestore()
        .collection("line_auth_sessions")
        .doc(state)
        .get();

      if (!authSessionDoc.exists) {
        logger.error("[LINE state not found]", { state });
        res.redirect(`${base}/?error=state`);
        return;
      }

      const authSession = authSessionDoc.data();
      const codeVerifier = authSession?.codeVerifier;

      if (!codeVerifier) {
        logger.error("[LINE codeVerifier not found]", { state });
        res.redirect(`${base}/?error=state`);
        return;
      }

      // Delete the session after retrieving
      await authSessionDoc.ref.delete();

      // Exchange code for token (PKCE/S256)
      // Get region for constructing the callback URL
      const region = process.env.FUNCTION_REGION || "asia-northeast1";
      const callbackUrl = `https://${region}-${projectId}.cloudfunctions.net/lineCallback`;
      
      const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: callbackUrl,
          client_id: channelId,
          client_secret: channelSecret,
          code_verifier: codeVerifier,
        }),
      });

      if (!tokenRes.ok) {
        const errorText = await tokenRes.text();
        logger.error("[LINE token]", errorText);
        res.redirect(`${base}/?error=token`);
        return;
      }

      const { access_token, id_token } = (await tokenRes.json()) as {
        access_token: string;
        id_token: string;
      };

      // Extract LINE UID from id_token
      const [, payloadB64] = id_token.split(".");
      const payload = JSON.parse(
        Buffer.from(payloadB64, "base64url").toString()
      );
      const uid: string = payload.sub;

      // Get user profile
      const profRes = await fetch("https://api.line.me/v2/profile", {
        headers: { Authorization: `Bearer ${access_token}` },
      });

      if (!profRes.ok) {
        const errorText = await profRes.text();
        logger.error("[LINE profile]", errorText);
        res.redirect(`${base}/?error=profile`);
        return;
      }

      const profile = (await profRes.json()) as {
        displayName: string;
        pictureUrl: string;
      };

      // Upsert user to Firestore
      await adminDb.doc(`users/${uid}`).set(
        {
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
          provider: "line",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Create Firebase Custom Token
      const customToken = await adminAuth.createCustomToken(uid);

      // Return token based on request method
      if (req.method === 'POST') {
        // Return JSON response for POST requests
        logger.info("[LINE Callback] Success, returning token via JSON");
        res.status(200).json({ customToken });
      } else {
        // Redirect for GET requests
        const redirect = new URL("/materials", base);
        redirect.searchParams.set("token", customToken);
        logger.info(
          "[LINE Callback] Success, redirecting to:",
          redirect.toString()
        );
        res.redirect(redirect.toString());
      }
    } catch (error) {
      logger.error("[LINE Callback] Error:", error);
      const projectId = process.env.GCP_PROJECT_ID || process.env.GCLOUD_PROJECT || "study-schedule-app";
      const errorBase = `https://${projectId}.web.app`;
      
      if (req.method === 'POST') {
        res.status(500).json({ error: 'Server error' });
      } else {
        res.redirect(`${errorBase}/?error=server`);
      }
    }
  }
);



// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// export const helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });
