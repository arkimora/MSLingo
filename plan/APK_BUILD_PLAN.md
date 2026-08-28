# APK Build Plan — MSLingo PWA → Signed Android APK

> Converting the MSLingo Progressive Web App into a signed Android APK using Google's **Trusted Web Activity (TWA)** via the official Bubblewrap CLI. This gives a native APK experience (icon on home screen, splash screen, no browser chrome) while keeping the web app as the source of truth.

---

## Overview

| Layer | Tool | Purpose |
|---|---|---|
| Web app | Vite + vite-plugin-pwa | Already builds to `dist/` with a service worker |
| APK shell | Bubblewrap CLI (`@aspect-dev/bubblewrap`) | Generates a minimal Android Studio project from `dist/` |
| Native wrapper | androidx.webkit.WebView | Renders the PWA in a Trusted Web Activity |
| Signing | `keytool` + `apksigner` (JDK) | Creates a Play Store–ready signed APK |

**Why TWA over a WebView wrapper?**
- TWA uses the system's browser engine (Chromium via Android System WebView) — no JS bridge overhead
- Chrome verifies the TWA publisher URL matches the site origin
- Better Play Store compliance and trust signals than a raw WebView

---

## Prerequisites

### 1. Java Development Kit (JDK) 17+

```bash
# Verify
java -version
# Should be 17.x or higher

# If on Windows and using Winget:
winget install EclipseAdoptium.Temurin17JDK
```

### 2. Android SDK (Command Line Tools)

```bash
# Download from:
# https://developer.android.com/studio#command-line-tools-only

# Set ANDROID_HOME (Windows PowerShell):
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', "$env:USERPROFILE\AppData\Local\Android\Sdk", 'User')

# Set ANDROID_HOME (Linux/macOS/bash):
export ANDROID_HOME=~/Android/Sdk

# Verify
echo $ANDROID_HOME
ls $ANDROID_HOME/cmdline-tools/
```

### 3. Bubblewrap CLI

```bash
npm install -g @aspect-dev/bubblewrap
# or
npx @aspect-dev/bubblewrap --version

# Verify
bubblewrap --version
# Should be >= 1.x
```

### 4. Web Manifest (already done)

The app's `vite.config.ts` already configures `vite-plugin-pwa` with a manifest containing:
- `name: "MSLingo — Монгол дохионы хэл"`
- `short_name: "MSLingo"`
- `start_url: "/"`
- `display: "standalone"`
- `theme_color: "#c2410c"` (saffron)
- `background_color: "#fbf8f3"` (sand light) / `#1a0f15` (dark)

**Action needed**: Add a `public/manifest.json` override with the full dark mode background color for the splash screen:

```json
{
  "name": "MSLingo — Монгол дохионы хэл",
  "short_name": "MSLingo",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#c2410c",
  "background_color": "#fbf8f3",
  "orientation": "portrait-primary",
  "categories": ["education", "language"]
}
```

---

## Step 1 — Build the PWA

```bash
cd MSLingo

# Production build (creates dist/)
npm run build

# Verify dist/ was created
ls dist/
# Should contain: index.html, sw.js, assets/, manifest.webmanifest
```

---

## Step 2 — Generate the Android Project with Bubblewrap

```bash
bubblewrap init \
  --manifest https://mnsl.mn/manifest.webmanifest \
  --directory ./android
```

> **Important**: Bubblewrap fetches the manifest from the live URL. If the app is behind authentication or hasn't been deployed yet, you can pass `--manifest dist/manifest.webmanifest` directly if using a local file path, or use the `--metaManifest` flag to point to a custom manifest.

If the manifest fetch fails (e.g. site is localhost), copy it locally:

```bash
# Copy the generated manifest to a known location
cp dist/manifest.webmanifest public/manifest.json

# Then init with the local file using a simple Python server
# (bubblewrap expects a URL, so deploy first or use --keymap option)

# Alternative: use Android Studio's New > Project > Trusted Web Activity
# and paste the contents of dist/ into the assets/ folder manually.
```

### If Bubblewrap init fails

Use the **manual approach** (Android Studio GUI):

1. Open Android Studio
2. File → New → New Project → Empty Activity
3. Add the TWA library to `app/build.gradle`:
   ```groovy
   dependencies {
       implementation 'androidx.webkit:webkit:1.10.0'
       implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'
   }
   ```
4. Copy `dist/` contents to `app/src/main/assets/`
5. Replace `MainActivity.kt` with the TWA launcher (see Android Studio TWA template)

---

## Step 3 — Create a Signing Key

You need a **release keystore** to sign the APK. This key identifies you as the publisher.

```bash
keytool \
  -genkeypair \
  -v \
  -keystore ./android/keystore.jks \
  -alias mslingo \
  -keyalg RSA \
  -keysize 4096 \
  -validity 36500 \
  -storepass YOUR_SECURE_STORE_PASSWORD \
  -keypass YOUR_SECURE_KEY_PASSWORD \
  -dname "CN=MSLingo, OU=Development, O=MSLingo, L=Ulaanbaatar, ST=Mongolia, C=MN"
```

> **⚠️ Critical**: Replace `YOUR_SECURE_STORE_PASSWORD` and `YOUR_KEY_PASSWORD` with strong passwords. Store them in a password manager. **If you lose this keystore, you can never update the APK on the Play Store.**

### Key store best practices

| Do | Don't |
|---|---|
| Store `keystore.jks` in a git-ignored secrets folder | Commit it to git |
| Use 36500-day validity (100 years) | Let it expire while the app is live |
| Back up to a YubiKey or encrypted USB | Keep only one copy on the dev machine |
| Rotate via Play Store App Signing by Google | Ship with a brand-new key for every release |

---

## Step 4 — Configure Signing in Bubblewrap / Gradle

Edit `android/app/build.gradle`:

```groovy
android {
    signingConfigs {
        release {
            storeFile file("keystore.jks")
            storePassword "YOUR_STORE_PASSWORD"
            keyAlias "mslingo"
            keyPassword "YOUR_KEY_PASSWORD"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
        }
    }
}
```

---

## Step 5 — Build the Release APK

```bash
cd android

# If using Gradle directly:
./gradlew assembleRelease

# If Bubblewrap is available:
bubblewrap build
```

Output: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

---

## Step 6 — Align and Sign the APK

```bash
# Align (optimizes zipalign)
zipalign -v -p 4 \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  app/build/outputs/apk/release/app-release-aligned.apk

# Sign
apksigner sign \
  --ks keystore.jks \
  --ks-pass pass:YOUR_STORE_PASSWORD \
  --key-pass pass:YOUR_KEY_PASSWORD \
  --out app/build/outputs/apk/release/mslingo-v1.0.0-signed.apk \
  app/build/outputs/apk/release/app-release-aligned.apk

# Verify the signature
apksigner verify -v app/build/outputs/apk/release/mslingo-v1.0.0-signed.apk
```

Expected output:
```
Verified using signer #1: CN=MSLingo...
Warnings: None
```

---

## Step 7 — Generate Play Store Assets

### App icon (required)

Android requires an adaptive icon in **5 densities**:

```
android/app/src/main/res/mipmap-anydpi-v26/  ← adaptive icons (XML masks)
android/app/src/main/res/mipmap-mdpi/        ← 48dp
android/app/src/main/res/mipmap-hdpi/        ← 72dp
android/app/src/main/res/mipmap-xhdpi/       ← 96dp
android/app/src/main/res/mipmap-xxhdpi/      ← 144dp
android/app/src/main/res/mipmap-xxxhdpi/     ← 192dp
```

Generate from a 1024×1024 master PNG:

```bash
# Using ImageMagick (install: winget install ImageMagick)
magick convert icon-1024.png \
  -resize 48x48   android/app/src/main/res/mipmap-mdpi/ic_launcher.png
magick convert icon-1024.png \
  -resize 72x72   android/app/src/main/res/mipmap-hdpi/ic_launcher.png
magick convert icon-1024.png \
  -resize 96x96   android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
magick convert icon-1024.png \
  -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
magick convert icon-1024.png \
  -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
```

### Feature graphic (optional, 1024×500)

```bash
magick convert feature-graphic-1024x500.png \
  android/app/src/main/res/drawable/feature_graphic.png
```

### Screenshot assets for Play Store

Required minimum:
- Phone screenshots: 1080×1920 px (at least 2)
- 7-inch tablet screenshot (optional)
- 10-inch tablet screenshot (optional)

### App signing key for Play Store

If publishing on Google Play, use **Play App Signing** (recommended):

1. Opt in during Play Console setup → Setup → App signing
2. Upload the **unsigned/unaligned** APK
3. Play Console generates a signing key you never see
4. You always sign upload artifacts with your upload key (keep this!)

---

## Step 8 — CI/CD Script (GitHub Actions)

Save as `.github/workflows/release-apk.yml`:

```yaml
name: Build Android APK

on:
  push:
    tags:
      - 'v*'

jobs:
  build-apk:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Setup JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Install Android SDK
        run: |
          echo "ANDROID_HOME=$HOME/android-sdk" >> $GITHUB_ENV
          mkdir -p $HOME/android-sdk/cmdline-tools
          wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O /tmp/cmdline-tools.zip
          unzip -q /tmp/cmdline-tools.zip -d $HOME/android-sdk/cmdline-tools
          mv $HOME/android-sdk/cmdline-tools/cmdline-tools $HOME/android-sdk/cmdline-tools/latest
          yes | $HOME/android-sdk/cmdline-tools/latest/bin/sdkmanager --licenses > /dev/null 2>&1 || true
          $HOME/android-sdk/cmdline-tools/latest/bin/sdkmanager "platforms;android-34" "build-tools;34.0.0" "platform-tools" > /dev/null

      - name: Install Bubblewrap
        run: npm install -g @aspect-dev/bubblewrap

      - name: Install dependencies
        run: npm ci

      - name: Build PWA
        run: npm run build

      - name: Generate Android project
        run: bubblewrap init --manifest https://your-domain.com/manifest.webmanifest --directory ./android || echo "Manual project setup required"

      - name: Build APK
        run: |
          cd android
          ./gradlew assembleRelease --no-daemon 2>&1 | tail -20

      - name: Sign APK
        run: |
          echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > android/keystore.jks
          zipalign -v -p 4 android/app/build/outputs/apk/release/app-release-unsigned.apk android/app/build/outputs/apk/release/aligned.apk
          apksigner sign \
            --ks android/keystore.jks \
            --ks-pass pass:${{ secrets.KEYSTORE_PASSWORD }} \
            --key-pass pass:${{ secrets.KEYSTORE_PASSWORD }} \
            --out mslingo-${{ github.ref_name }}.apk \
            android/app/build/outputs/apk/release/aligned.apk

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: mslingo-${{ github.ref_name }}
          path: mslingo-${{ github.ref_name }}.apk
```

Add these GitHub Actions secrets:
- `KEYSTORE_BASE64`: Base64-encoded keystore (`cat keystore.jks | base64 -w0`)
- `KEYSTORE_PASSWORD`: The store password

---

## Step 9 — Play Store Submission

### Store listing

| Field | Mongolian (MN) | English (EN) |
|---|---|---|
| Title | MSLingo — Монгол дохионы хэл | MSLingo — Mongolian Sign Language |
| Short description | mnsl.mn-ийн дохионуудыг сурах | Learn Mongolian Sign Language from mnsl.mn |
| Full description | See Play Store docs | See Play Store docs |
| Category | Education | Education |
| Content rating | All ages | All ages |

### Privacy policy URL

Required. Point to a hosted privacy policy (e.g. Netlify/Vercel deploy):

```markdown
# MSLingo Privacy Policy

MSLingo stores all data locally on your device.
No personal data is collected, transmitted, or shared.
Progress data (signs learned, review history) is stored in your browser's IndexedDB.
No accounts, no analytics, no third-party tracking.
```

### Featured graphic

1024×500 px. Use a high-quality sign video still frame + app name overlay.

---

## Troubleshooting

### "Digital asset link mismatch"

```
Chrome cannot verify that this app truly comes from your site.
The assetlinks.json file is not fetched or is incorrect.
```

Fix: Ensure `public/.well-known/assetlinks.json` is served at:
```
https://your-domain.com/.well-known/assetlinks.json
```

Bubblewrap generates the JSON. Check it matches the `package_name` and `sha256_cert_fingerprints` in Play Console → Setup → App signing.

### "minSdkVersion is too low"

Bubblewrap defaults to `18` (Android 4.3). TWA requires `21+`. Fix in `android/app/build.gradle`:

```groovy
android {
    defaultConfig {
        minSdkVersion 21
    }
}
```

### Slow emulator / no ARM translation

```bash
# Install ARM emulation support
sdkmanager "system-images;android-34;google_apis;x86_64"
# Use x86_64 image for Intel machines without HAXM
```

### APK size too large (>150 MB)

The content JSON (1.4 MB) is fine. Check for duplicate native libs:

```groovy
android {
    packagingOptions {
        pickFirst 'lib/x86/libc++_shared.so'
        pickFirst 'lib/x86_64/libc++_shared.so'
    }
}
```

---

## Checklist

Before publishing, verify:

- [ ] `npm run build` completes without errors
- [ ] `dist/` contains `index.html`, `sw.js`, `manifest.webmanifest`
- [ ] Bubblewrap / TWA project builds with `./gradlew assembleRelease`
- [ ] `apksigner verify` passes with no warnings
- [ ] Adaptive icon shows correctly in Android 8+ (with mask)
- [ ] App launches in TWA (not fallback browser)
- [ ] PWA install prompt works on desktop Chrome
- [ ] Privacy policy URL is live and accessible
- [ ] Screenshots uploaded to Play Console
- [ ] Test flight: installed on a physical device, not just emulator
- [ ] Deeplinks (`mslingo://`) work if implemented
- [ ] Offline: content signs are cached by service worker after first load
