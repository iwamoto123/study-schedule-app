/* =====================================================================
 * UID Utilities - Firestore安全な文字列変換
 *
 * LINE UIDの ":" (コロン) がFirestoreパスで問題を起こすため、
 * Base64エンコード/デコードで安全な文字列に変換
 * ===================================================================== */

/**
 * UIDをFirestore安全な文字列にエンコード
 * 例: "line:U6d0fd9c7ff83651439a7655adcc68cd3" → "bGluZTpVNmQwZmQ5YzdmZjgzNjUxNDM5YTc2NTVhZGNjNjhjZDM"
 */
export function encodeUID(uid: string): string {
  try {
    // Base64エンコード（URLセーフ版）
    const encoded = btoa(uid).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    console.log('🔧 UID encoded:', { original: uid, encoded });
    return encoded;
  } catch (error) {
    console.error('❌ UID encoding failed:', error);
    // フォールバック: コロンをアンダースコアに置換
    return uid.replace(/:/g, '_');
  }
}

/**
 * エンコードされたUIDを元に戻す
 */
export function decodeUID(encodedUID: string): string {
  try {
    // URLセーフBase64を通常のBase64に戻す
    let base64 = encodedUID.replace(/-/g, '+').replace(/_/g, '/');

    // パディングを追加
    while (base64.length % 4) {
      base64 += '=';
    }

    const decoded = atob(base64);
    console.log('🔧 UID decoded:', { encoded: encodedUID, decoded });
    return decoded;
  } catch (error) {
    console.error('❌ UID decoding failed:', error);
    // フォールバック: アンダースコアをコロンに戻す
    return encodedUID.replace(/_/g, ':');
  }
}

/**
 * UIDが安全かどうかチェック
 */
export function isSafeUID(uid: string): boolean {
  // Firestoreで問題となる文字をチェック
  const unsafeChars = /[:\s/\\#\[\]]/;
  return !unsafeChars.test(uid);
}

/**
 * 現在の認証ユーザーのエンコードされたUIDを取得
 */
export function getCurrentEncodedUID(auth: { currentUser: { uid: string } | null }): string | null {
  const user = auth.currentUser;
  if (!user) return null;

  const originalUID = user.uid;

  // 既に安全なUIDならそのまま返す
  if (isSafeUID(originalUID)) {
    return originalUID;
  }

  // 安全でない場合はエンコード
  return encodeUID(originalUID);
}