# GitHub Secrets Configuration

This document lists all the GitHub secrets required for the automated deployment workflow.

## Required Secrets

### Firebase/GCP Configuration
- **`NEXT_PUBLIC_FIREBASE_CONFIG`**: Firebase configuration JSON string
  ```json
  {
    "projectId": "your-project-id",
    "appId": "your-app-id",
    "storageBucket": "your-storage-bucket",
    "apiKey": "your-api-key",
    "authDomain": "your-auth-domain",
    "messagingSenderId": "your-sender-id",
    "measurementId": "your-measurement-id"
  }
  ```

- **`NEXT_PUBLIC_GCP_PROJECT_ID`**: Your Google Cloud Project ID
- **`NEXT_PUBLIC_GCP_REGION`**: GCP region (e.g., `asia-northeast1`)
- **`GCP_SA_KEY`**: Base64 encoded service account key with Firebase deployment permissions

### LINE OAuth Configuration
- **`LINE_CHANNEL_ID`**: Your LINE Login Channel ID
- **`LINE_CHANNEL_SECRET`**: Your LINE Login Channel Secret

### Optional
- **`NEXT_PUBLIC_USE_CLOUD_FUNCTIONS`**: Set to `true` to use Cloud Functions for LINE auth (defaults to `true`)

## How to Add Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with the appropriate name and value

## Service Account Setup

To create the `GCP_SA_KEY`:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to IAM & Admin → Service Accounts
3. Create a new service account with these roles:
   - Firebase Hosting Admin
   - Cloud Functions Developer
   - Firebase Rules Admin
   - Service Account User
4. Generate a JSON key
5. Base64 encode it: `base64 -i service-account.json | tr -d '\n'`
6. Add the encoded string as `GCP_SA_KEY` secret