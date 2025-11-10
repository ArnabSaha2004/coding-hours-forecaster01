# Mobile App Setup Guide

This guide will help you build and run the Coding Hours Forecaster app on iOS and Android devices.

## Prerequisites

### For iOS Development
- macOS (required for iOS development)
- Xcode (install from Mac App Store)
- CocoaPods: `sudo gem install cocoapods`

### For Android Development
- Android Studio (download from https://developer.android.com/studio)
- Android SDK (installed via Android Studio)
- Java Development Kit (JDK)

## Initial Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Build the web app:**
   ```bash
   npm run build
   ```

3. **Add mobile platforms:**
   ```bash
   # For iOS (macOS only)
   npm run cap:add:ios
   
   # For Android
   npm run cap:add:android
   ```

4. **Sync Capacitor:**
   ```bash
   npm run cap:sync
   ```

## Running on iOS

1. **Open in Xcode:**
   ```bash
   npm run cap:open:ios
   ```

2. **In Xcode:**
   - Select a simulator or connected device
   - Click the Run button (▶️) or press `Cmd + R`

3. **For physical device:**
   - Connect your iPhone via USB
   - Select your device in Xcode
   - You may need to configure code signing in Xcode settings

## Running on Android

1. **Open in Android Studio:**
   ```bash
   npm run cap:open:android
   ```

2. **In Android Studio:**
   - Wait for Gradle sync to complete
   - Select an emulator or connected device
   - Click the Run button (▶️) or press `Shift + F10`

3. **For physical device:**
   - Enable USB debugging on your Android device
   - Connect via USB
   - Select your device in Android Studio

## Backend Configuration for Mobile

When running on a physical device, `localhost` won't work. You need to:

1. **Find your computer's local IP address:**
   - Windows: Run `ipconfig` and look for IPv4 Address
   - Mac/Linux: Run `ifconfig` or `ip addr`

2. **Update the API URL:**
   - Option 1: Set environment variable `VITE_API_BASE_URL` in `frontend/.env`:
     ```
     VITE_API_BASE_URL=http://192.168.1.100:4000
     ```
   - Option 2: Update `frontend/src/App.jsx` directly (line 20)

3. **Ensure backend is accessible:**
   - Make sure your backend server is running
   - Ensure your device and computer are on the same network
   - Check firewall settings if connection fails

## Building for Production

### iOS
1. Open project in Xcode: `npm run cap:open:ios`
2. Select "Any iOS Device" or "Generic iOS Device"
3. Product → Archive
4. Follow Xcode's distribution wizard

### Android
1. Open project in Android Studio: `npm run cap:open:android`
2. Build → Generate Signed Bundle / APK
3. Follow Android Studio's wizard

## Troubleshooting

### "Cannot find module" errors
- Run `npm install` in the `frontend` directory
- Run `npm run cap:sync`

### API connection issues
- Verify backend is running
- Check IP address is correct
- Ensure device and computer are on same network
- Check backend CORS settings allow your device's IP

### Build errors
- Clean and rebuild: `npm run build && npm run cap:sync`
- Delete `node_modules` and reinstall
- For iOS: Clean build folder in Xcode (Cmd + Shift + K)
- For Android: Clean project in Android Studio (Build → Clean Project)

