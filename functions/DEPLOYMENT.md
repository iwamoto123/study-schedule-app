# LINE Callback Cloud Function Deployment Guide

## Overview
This Cloud Function handles LINE OAuth callbacks and creates Firebase custom tokens for authenticated users.

## Environment Variables Required

### For Manual Deployment
Before deploying, set the following environment variables:

```bash
# Set LINE OAuth credentials
firebase functions:config:set line.channel_id="YOUR_LINE_CHANNEL_ID"
firebase functions:config:set line.channel_secret="YOUR_LINE_CHANNEL_SECRET"

# Or use the provided script
./set-config.sh
```

### For GitHub Actions (Automated Deployment)
Add the following secrets to your GitHub repository:
- `LINE_CHANNEL_ID`: Your LINE Channel ID
- `LINE_CHANNEL_SECRET`: Your LINE Channel Secret
- `NEXT_PUBLIC_GCP_PROJECT_ID`: Your GCP Project ID
- `NEXT_PUBLIC_USE_CLOUD_FUNCTIONS`: Set to `true` to enable Cloud Functions
- `GCP_SA_KEY`: Base64 encoded service account key for deployment

The GitHub Actions workflow will automatically deploy both hosting and functions with the correct configuration.

## Deployment Steps

1. Build the functions:
```bash
npm run build
```

2. Deploy to Firebase:
```bash
firebase deploy --only functions:lineCallback
```

3. The function will be available at:
```
https://asia-northeast1-<YOUR_PROJECT_ID>.cloudfunctions.net/lineCallback
```

## Update LINE OAuth Settings
Update your LINE Login channel settings to use the Cloud Function URL:
- Callback URL: `https://asia-northeast1-<YOUR_PROJECT_ID>.cloudfunctions.net/lineCallback`

## Frontend Configuration
In your Next.js app, set the following environment variable to use Cloud Functions:
```bash
# In .env.local
NEXT_PUBLIC_USE_CLOUD_FUNCTIONS=true
```

To switch back to using Next.js API routes, set it to `false` or remove it.

## Testing
To test locally:
```bash
firebase emulators:start --only functions
```

The local function will be available at:
```
http://localhost:5001/<YOUR_PROJECT_ID>/asia-northeast1/lineCallback
```

## Notes
- The function uses Firebase Admin SDK to create custom tokens
- It stores user profiles in Firestore under the `users` collection
- Cookie parsing is implemented inline to avoid additional dependencies
- The function redirects to `/materials` with the custom token as a query parameter