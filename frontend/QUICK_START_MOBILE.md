# Quick Start: Running as Mobile App

## Option 1: Using Android Studio (Recommended)

### Step 1: Install Android Studio
1. Download from: https://developer.android.com/studio
2. Install Android Studio
3. During setup, install Android SDK and tools

### Step 2: Open the Project
1. Launch Android Studio
2. Click "Open" or "Open an Existing Project"
3. Navigate to: `C:\ml_app\frontend\android`
4. Wait for Gradle sync to complete

### Step 3: Run the App
1. **On Emulator:**
   - Click "Device Manager" (phone icon in toolbar)
   - Create a new virtual device if needed
   - Select the device and click Run (▶️)

2. **On Physical Device:**
   - Enable USB debugging on your Android phone
   - Connect phone via USB
   - Select your device from the device dropdown
   - Click Run (▶️)

## Option 2: Manual Opening

If Android Studio is installed but not in PATH:

1. Open Android Studio manually
2. File → Open
3. Navigate to: `C:\ml_app\frontend\android`
4. Click OK

## Option 3: Command Line (if Android SDK is configured)

If you have Android SDK tools in your PATH:

```bash
cd android
.\gradlew assembleDebug
.\gradlew installDebug
```

## Important: Backend Configuration

**Before running on a physical device**, update the API URL:

1. Find your computer's IP:
   - Open Command Prompt
   - Run: `ipconfig`
   - Look for "IPv4 Address" (e.g., 192.168.1.100)

2. Update API URL in `frontend/src/App.jsx` (line 20):
   ```javascript
   return 'http://192.168.1.100:4000'; // Use your actual IP
   ```

3. Rebuild and sync:
   ```bash
   npm run build
   npm run cap:sync
   ```

4. Make sure your backend is running on port 4000

## Troubleshooting

### "Android Studio not found"
- Install Android Studio from the link above
- Or set `CAPACITOR_ANDROID_STUDIO_PATH` environment variable to Android Studio's path

### "Gradle sync failed"
- Make sure you have internet connection
- Check Android SDK is installed
- Try: File → Invalidate Caches / Restart

### "App won't connect to backend"
- Ensure backend is running: `cd backend && npm run dev`
- Check IP address is correct
- Ensure device and computer are on same network
- Check Windows Firewall isn't blocking port 4000

