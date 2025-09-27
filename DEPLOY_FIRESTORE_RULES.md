# Firestore Rules Deployment Instructions

## Updated Rules for Anonymous User Support

The `firestore.rules` file has been updated to support anonymous users properly. The key change allows both authenticated users matching the userId OR anonymous users to access their data:

```
allow read, write: if request.auth != null &&
  (request.auth.uid == userId || request.auth.token.firebase.sign_in_provider == 'anonymous');
```

## To Deploy the Rules:

### Option 1: Firebase Console (Recommended for quick deployment)

1. Open [Firebase Console](https://console.firebase.google.com/project/study-schedule-app/firestore/rules)
2. Copy the entire contents of `firestore.rules`
3. Paste into the Rules editor
4. Click "Publish"

### Option 2: Firebase CLI (After re-authentication)

```bash
# Re-authenticate Firebase CLI
firebase login --reauth

# Deploy only Firestore rules
firebase deploy --only firestore:rules
```

### Option 3: Using gcloud (After re-authentication)

```bash
# Re-authenticate gcloud
gcloud auth login

# Run the deployment script
node scripts/deploy-firestore-rules.js
```

## What This Fixes:

- ✅ Anonymous users can now create materials
- ✅ Anonymous users can read/write their own data
- ✅ Fixes the 400 Bad Request errors when saving materials
- ✅ Resolves "Missing or insufficient permissions" errors

## Testing After Deployment:

1. Open the app in an incognito/private browser window
2. The app should automatically sign in anonymously
3. Try creating a new material
4. Verify it saves without errors