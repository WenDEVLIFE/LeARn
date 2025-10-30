# How to Build APK for LeARn

This guide will help you build an APK file for your React Native Expo app.

## Method 1: EAS Build (Recommended - Cloud Build)

EAS Build is Expo's cloud build service that builds your app in the cloud. This is the easiest method.

### Prerequisites

1. **Expo Account**: Create a free account at [https://expo.dev](https://expo.dev)
2. **EAS CLI**: Already set up (use `npx eas-cli`)

### Steps:

1. **Login to Expo**:
   ```bash
   npx eas-cli login
   ```

2. **Configure your project** (if not already done):
   ```bash
   npx eas-cli build:configure
   ```
   The `eas.json` file has already been created for you.

3. **Build APK for Android**:
   ```bash
   npx eas-cli build --platform android --profile preview
   ```
   
   This will:
   - Create a preview APK (not AAB for Play Store)
   - Upload to Expo servers
   - Build in the cloud
   - Provide a download link when complete

4. **Wait for build to complete** (usually 10-15 minutes)

5. **Download APK**: Once complete, you'll get a link to download the APK file.

### Alternative: Build for production (AAB format for Play Store)
```bash
npx eas-cli build --platform android --profile production
```

---

## Method 2: Local Build (Advanced)

If you prefer to build locally on your machine, you'll need Android Studio and the Android SDK.

### Prerequisites:

1. **Android Studio** installed
2. **Java Development Kit (JDK)** version 17 or higher
3. **Android SDK** configured

### Steps:

1. **Generate native Android code**:
   ```bash
   npx expo prebuild --platform android
   ```

2. **Build APK locally**:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

3. **Find your APK**:
   The APK will be located at:
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

4. **For Debug APK** (for testing):
   ```bash
   ./gradlew assembleDebug
   ```
   Location: `android/app/build/outputs/apk/debug/app-debug.apk`

---

## Method 3: Local Build with Expo (Quick Testing)

For a quick development APK:

```bash
npx expo run:android --variant release
```

This will build and install the release APK directly on a connected Android device or emulator.

---

## Build Profiles Explained

Based on `eas.json`:

- **development**: Development build with dev client (for testing)
- **preview**: Preview APK for internal testing (this is what you want for APK)
- **production**: Production AAB for Play Store submission

---

## Troubleshooting

### If EAS Build fails:

1. Check your `app.json` configuration
2. Ensure all dependencies are properly installed
3. Review build logs in Expo dashboard

### If local build fails:

1. Make sure Android Studio is installed
2. Verify `ANDROID_HOME` environment variable is set
3. Check Java version: `java -version` (should be 17+)
4. Try cleaning: `cd android && ./gradlew clean`

---

## Important Notes

- **APK vs AAB**: APK is for direct installation, AAB is required for Google Play Store
- **Signing**: Production builds require signing keys. EAS handles this automatically.
- **Firebase**: Your Firebase config is already in `app.json` - builds will use it automatically.

---

## Quick Reference

```bash
# EAS Build - APK
npx eas-cli build --platform android --profile preview

# EAS Build - Production AAB
npx eas-cli build --platform android --profile production

# Local Release Build
npx expo run:android --variant release

# Check build status
npx eas-cli build:list
```

