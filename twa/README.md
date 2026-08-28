# MSLingo TWA (Trusted Web Activity)

This directory holds the Android shell that wraps the MSLingo PWA in a
[Trusted Web Activity](https://developer.chrome.com/docs/android/trusted-web-activity/).
The TWA is the canonical way to ship a PWA as an Android app on Google Play
**without** rebuilding the UI in Kotlin — it loads the same web app and
proves the connection via Digital Asset Links.

## Build

Requires JDK 17+ and the Android SDK (build-tools 34+, platforms 34+).

```bash
cd twa
./gradlew assembleDebug        # debug APK → app/build/outputs/apk/debug/
./gradlew assembleRelease      # release APK (needs keystore — see below)
```

Output APK: `twa/app/build/outputs/apk/debug/app-debug.apk`
            `twa/app/build/outputs/apk/release/app-release.apk`

## Digital Asset Links (mandatory for Play Store)

TWA only works if `https://mslingo.app/.well-known/assetlinks.json` matches
the SHA-256 fingerprint of the keystore that signed the APK.

1. Generate a keystore (one-time):
   ```bash
   keytool -genkey -v -keystore mslingo.keystore -alias mslingo \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Get the SHA-256 fingerprint:
   ```bash
   keytool -list -v -keystore mslingo.keystore -alias mslingo \
     | grep "SHA-256" | tr -d ' '
   ```
3. Paste the fingerprint into BOTH:
   - `twa/app/src/main/res/values/strings.xml` (in `asset_statements`)
   - `twa/.well-known/assetlinks.json`
4. Deploy the file `twa/.well-known/assetlinks.json` to
   `https://mslingo.app/.well-known/assetlinks.json`.

## Signing the release APK

The `app/build.gradle` reads signing credentials from environment variables:

```bash
export KEYSTORE_PATH=$(pwd)/mslingo.keystore
export KEYSTORE_PASSWORD=...
export KEY_ALIAS=mslingo
export KEY_PASSWORD=...
./gradlew assembleRelease
```

For CI, store these as GitHub Actions secrets and inject them via `env:` in
`.github/workflows/apk.yml`.

## Local server for development

To test the TWA against a local dev server, point the manifest target at
your LAN IP:

```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey \
  -storepass android -keypass android | grep "SHA-256"
# Paste SHA-256 into .well-known/assetlinks.json
# Edit app/src/main/AndroidManifest.xml target to your http://192.168.x.x:5173
# Run `adb reverse tcp:5173 tcp:5173`
```

## App identity

| Field           | Value                              |
| --------------- | ---------------------------------- |
| applicationId   | `app.mslingo.twa`                 |
| namespace       | `app.mslingo.twa`                 |
| versionName     | `0.1.0`                            |
| versionCode     | `1`                                |
| minSdkVersion   | `22` (Android 5.1+)                |
| targetSdkVersion| `34` (Android 14)                  |
| Web host        | `https://mslingo.app` (change as needed) |

## Play Store submission

See [`plan/APK_BUILD_PLAN.md`](../plan/APK_BUILD_PLAN.md) for the full
release checklist (Play Console, content rating, asset graphics, signing
key management, post-launch).
