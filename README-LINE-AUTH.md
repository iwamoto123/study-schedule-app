# LINE Authentication Setup with @aid-on/auth-providers

This project now uses `@aid-on/auth-providers` for LINE OAuth authentication integrated with Firebase.

## Features

- ✅ Secure LINE OAuth 2.0 flow
- ✅ Firebase Authentication integration
- ✅ CSRF protection with state validation
- ✅ Support for both local development and Firebase Cloud Functions
- ✅ TypeScript support with full type safety

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @aid-on/auth-providers
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```env
# LINE OAuth Settings
LINE_CHANNEL_ID=your-line-channel-id
LINE_CHANNEL_SECRET=your-line-channel-secret
NEXT_PUBLIC_LINE_CHANNEL_ID=your-line-channel-id

# Firebase Admin SDK
FIREBASE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

### 3. LINE Developers Console Setup

1. Go to [LINE Developers Console](https://developers.line.biz/)
2. Create or select your LINE Login channel
3. Set the callback URL:
   - Development: `http://localhost:3000/api/auth/line/callback`
   - Production: `https://your-region-your-project.cloudfunctions.net/lineCallback`

### 4. Firebase Setup

Ensure your Firebase project has:
- Authentication enabled
- Firestore database created
- Service account credentials configured

## Architecture

```
User clicks "Login with LINE"
    ↓
LineLoginButton (using @aid-on/auth-providers)
    ↓
LINE OAuth Authorization
    ↓
Callback Handler (/api/auth/line/callback)
    ↓
Token Exchange (using LineAuthClient)
    ↓
Get User Profile
    ↓
Create/Update Firestore User
    ↓
Generate Firebase Custom Token
    ↓
Redirect with Token
```

## Code Structure

### Client Component
- `components/LineLoginButton.tsx` - Initiates LINE login flow
- Uses `LineAuthClient.generateState()` for CSRF protection
- Uses `LineAuthClient.getAuthorizationUrl()` for proper OAuth URL

### Server Handler
- `app/api/auth/line/callback/route.ts` - Handles OAuth callback
- Uses `LineAuthClient.getAccessToken()` for token exchange
- Uses `LineAuthClient.getUserProfile()` for user data
- Integrates with Firebase Admin SDK

## Benefits of Using @aid-on/auth-providers

1. **Security**: Built-in CSRF protection and secure state management
2. **Simplicity**: Simplified OAuth flow with easy-to-use APIs
3. **Type Safety**: Full TypeScript support
4. **Reliability**: Battle-tested OAuth implementation
5. **Flexibility**: Works with both server-side and serverless environments

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Deploy to Firebase
firebase deploy
```

## Troubleshooting

### "Missing LINE_CHANNEL_ID" Error
- Ensure environment variables are set correctly
- Check that `.env.local` file exists and is not ignored by git

### "State mismatch" Error
- Clear browser cookies
- Ensure cookies are enabled
- Check that the callback URL matches exactly

### "Firebase Admin not initialized" Error
- Verify Firebase service account credentials
- Check FIREBASE_PRIVATE_KEY formatting (newlines must be escaped)

## Support

For issues with:
- LINE OAuth: Check [LINE Developers Documentation](https://developers.line.biz/en/docs/line-login/)
- @aid-on/auth-providers: Visit [GitHub Issues](https://github.com/Aid-On/auth-providers-ts/issues)
- Firebase: See [Firebase Documentation](https://firebase.google.com/docs)
