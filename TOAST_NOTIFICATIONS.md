# Toast Notifications Implementation

## Behavior

Toast notifications in this app automatically disappear after a set duration, similar to Flutter Toast:

- **Success messages**: 3 seconds visibility
- **Info messages**: 3 seconds visibility
- **Error messages**: 5 seconds visibility (longer to allow reading error details)

## Implementation Details

### Configuration Files
- [config/firebaseConfig.ts](file:///Users/wendevlife/ReactNativeProjects/LeARn/config/firebaseConfig.ts) - Firebase initialization toasts
- [hooks/useFirebaseWithToast.ts](file:///Users/wendevlife/ReactNativeProjects/LeARn/hooks/useFirebaseWithToast.ts) - Component-level toasts
- [utils/firebaseHelpers.ts](file:///Users/wendevlife/ReactNativeProjects/LeARn/utils/firebaseHelpers.ts) - Authentication action toasts

### Settings Used
```typescript
{
  visibilityTime: 3000, // 3 seconds for success/info
  autoHide: true,       // Automatically hide after visibilityTime
}
```

```typescript
{
  visibilityTime: 5000, // 5 seconds for errors
  autoHide: true,       // Automatically hide after visibilityTime
}
```

## Toast Types

1. **Success** - Green notification for successful operations
2. **Info** - Blue notification for informational messages
3. **Error** - Red notification for error conditions

## Usage Examples

### Firebase Initialization
When the app starts, users will see:
- "Firebase Initialized" (success) - 3 seconds
- "Firebase Already Initialized" (info) - 3 seconds
- "Firebase Initialization Failed" (error) - 5 seconds

### Authentication Actions
- "Signed In" - 3 seconds
- "Signed Out" - 3 seconds
- "Sign In Failed" - 5 seconds
- "Sign Out Failed" - 5 seconds

## Customization

To modify the duration of toast notifications, change the `visibilityTime` property in any Toast.show() call:
- Value is in milliseconds (1000 = 1 second)
- Recommended range: 2000-5000ms for best UX

## Components Using Toasts

1. **Splash Screen** - Shows Firebase initialization status
2. **Main View** - Shows Firebase connection status
3. **Flash Card Library** - Authentication action feedback
4. **FirebaseExample Component** - Complete authentication UI with feedback