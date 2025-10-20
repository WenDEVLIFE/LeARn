# Firebase Setup Guide for LeARn App

This guide explains how to properly set up Firebase for the LeARn application on Android.

## Prerequisites

1. Make sure you have added your `google-services.json` file to the project
2. Firebase dependencies are already installed via npm
3. AsyncStorage is configured for auth persistence

## Firebase Configuration Steps

### 1. Update Firebase Config

In `config/firebaseConfig.ts`, replace the placeholder values with your actual Firebase project configuration:

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

Alternatively, update the `app.json` file with your Firebase configuration in the `extra.firebase` section.

### 2. Using Firebase in Your Components

We've created helper functions in [utils/firebaseHelpers.ts](file:///Users/wendevlife/ReactNativeProjects/LeARn/utils/firebaseHelpers.ts) to make it easier to use Firebase in your components:

```typescript
import { signInAnonymouslyHelper, signOutHelper, getCurrentUser } from '@/utils/firebaseHelpers';

const handleSignIn = async () => {
  const result = await signInAnonymouslyHelper();
  if (result.success) {
    console.log('Signed in as:', result.user?.uid);
  } else {
    console.error('Firebase auth error:', result.error);
  }
};
```

We've also created a reusable [FirebaseExample](file:///Users/wendevlife/ReactNativeProjects/LeARn/components/FirebaseExample.tsx) component that demonstrates how to implement Firebase authentication with proper state management.

### 3. Available Firebase Services

The Firebase setup includes:
- Firebase Authentication (`firebase/auth`)
- Firebase Core App (`firebase/app`)

To add more Firebase services, install them via npm:

```bash
npm install firebase/[service-name]
```

For example, for Firestore:
```bash
npm install firebase/firestore
```

Then import and use in your components:
```typescript
import { getFirestore } from 'firebase/firestore';
```

## Testing Firebase Connection

1. A test button has been added to the Flash Card Library screen ([flashview.tsx](file:///Users/wendevlife/ReactNativeProjects/LeARn/app/screen/flashview.tsx)) to verify Firebase authentication is working correctly.

2. A reusable [FirebaseExample](file:///Users/wendevlife/ReactNativeProjects/LeARn/components/FirebaseExample.tsx) component is available that demonstrates complete Firebase authentication implementation with proper state management.

3. Toast notifications will automatically appear when Firebase is initialized successfully, showing "Firebase Initialized" with a success message.

4. Firebase initialization status is displayed on both the splash screen and main view screen.

## Adding Firebase to Other Screens

To add Firebase functionality to other screens:

1. Import the helper functions you need:
   ```typescript
   import { signInAnonymouslyHelper, signOutHelper, getCurrentUser } from '@/utils/firebaseHelpers';
   ```

2. Use the helper functions in your component as shown in the [FirebaseExample](file:///Users/wendevlife/ReactNativeProjects/LeARn/components/FirebaseExample.tsx) component.

## Troubleshooting

1. If you encounter issues with Firebase initialization:
   - Check that your `firebaseConfig` values are correct
   - Ensure the `google-services.json` file is properly placed (for native builds)

2. If you get authentication errors:
   - Make sure Anonymous Authentication is enabled in your Firebase Console
   - Check your internet connection

3. For production builds:
   - Make sure to use the correct `google-services.json` for your production project