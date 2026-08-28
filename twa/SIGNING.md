# MSLingo — Signed APK & GitHub Releases Guide

This document explains **every step** required to build a signed (Beta) APK and publish it as a GitHub Release. There are two paths: a fully automated CI path (recommended) and a fully local path (when you want to test before pushing).

---

## Table of contents

1. [Concept: what "signing" means](#concept)
2. [Generate a release keystore](#keystore)
3. [Configure signing locally (one-time)](#local-config)
4. [Build a signed release APK locally](#local-build)
5. [Push to GitHub Releases via CI](#ci-release)
6. [Push to GitHub Releases locally with `gh`](#gh-release)
7. [Verifying the signed APK](#verify)
8. [Publishing on Google Play (later)](#play)
9. [Troubleshooting](#troubleshooting)

---

## 1. Concept: what "signing" means {#concept}

Android requires every APK installed on a device to be **digitally signed**. The signature is what allows:

- **Updates** — Google Play (and the Android installer) only accepts updates signed with the *same* key as the original install.
- **Trust** — the device knows the APK came from a known publisher and wasn't tampered with.
- **Identity** — Play Store listings are tied to the certificate.

There are two types of keys:

| Key | When | Where it lives |
|---|---|---|
| **Debug keystore** | Local development, `assembleDebug` | `~/.android/debug.keystore` — auto-generated, **never ship this** |
| **Release keystore** | Production / Beta / Play Store | You generate it once, **keep it forever**, back it up somewhere safe |

> ⚠️ If you ever lose your release keystore you can never update your app on the Play Store. You'll have to publish a new app with a new package name. Treat the `.jks`/`.keystore` file like a passport.

---

## 2. Generate a release keystore {#keystore}

You'll use `keytool`, which ships with the JDK (the same one used to build the project: Eclipse Adoptium 17, located at `C:\Program Files\Eclipse Adoptium\jdk-17.0.20.8-hotspot`).

### macOS / Linux

```bash
keytool -genkey -v \
  -keystore mslingo-release.keystore \
  -alias mslingo \
  -keyalg RSA -keysize 2048 -validity 10000
```

### Windows (PowerShell or Git Bash)

```bash
keytool -genkey -v \
  -keystore mslingo-release.keystore \
  -alias mslingo \
  -keyalg RSA -keysize 2048 -validity 10000
```

The tool will ask you a series of questions interactively:

```
Enter keystore password:           <-- pick a strong password, save it!
Re-enter new password:              <-- same
What is your first and last name?   <-- e.g. "Mongolian Sign Language Project"
What is the name of your org unit?  <-- e.g. "Engineering"
What is the name of your org?       <-- e.g. "MSLingo"
What is the name of your City?      <-- e.g. "Ulaanbaatar"
What is the name of your State?     <-- e.g. "Ulaanbaatar"
What is the two-letter country code?<-- e.g. "MN"
```

It will then print a long certificate fingerprint. **Save all of these somewhere safe** (1Password, Bitwarden, KeePass, encrypted USB stick — your call):

- Keystore file path
- Keystore password
- Key alias (`mslingo` in the example)
- Key password
- SHA-256 fingerprint (needed for Play Store Digital Asset Links)

> The keystore is valid for 10,000 days (~27 years). The Play Store will accept it forever, but renew the upload key every 25 years to be safe.

---

## 3. Configure signing locally (one-time) {#local-config}

Move your freshly generated `mslingo-release.keystore` into the Android project so the build can find it. The path is gitignored:

```bash
# from the repo root
mkdir -p twa/app/keystore
mv mslingo-release.keystore twa/app/keystore/
```

Create `twa/app/keystore/keystore.properties` (also gitignored — never commit this):

```properties
storeFile=keystore/mslingo-release.keystore
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=mslingo
keyPassword=YOUR_KEY_PASSWORD
```

> Both files (`keystore.properties` and `*.keystore`) are already in `.gitignore` at the repo root. The CI workflow will recreate them from GitHub Secrets — never paste your real password anywhere that gets committed.

Verify the build script reads the file by running the build (next step).

---

## 4. Build a signed release APK locally {#local-build}

From the project root:

```bash
cd twa
export JAVA_HOME="C:/Program Files/Eclipse Adoptium/jdk-17.0.20.8-hotspot"
export ANDROID_HOME="C:/Users/erkhe/AppData/Local/Android/Sdk"
./gradlew assembleRelease --no-daemon
```

This produces a signed, **obfuscated** (`minifyEnabled true`), **resource-shrunk** (`shrinkResources true`) APK at:

```
twa/app/build/outputs/apk/release/app-release.apk
```

Typical size: ~1.5–2 MB (debug was 3 MB).

The build is **signed** because the `signingConfigs.release` block in `twa/app/build.gradle` reads your `keystore.properties`.

> For a Play Store-ready **AAB** (Android App Bundle) instead of an APK, run `./gradlew bundleRelease`. The output lands at `twa/app/build/outputs/bundle/release/app-release.aab`.

---

## 5. Push to GitHub Releases via CI (recommended) {#ci-release}

The repo has a workflow at `.github/workflows/release.yml` that builds a signed APK in GitHub Actions and creates a Release automatically. It reads the keystore and passwords from **encrypted Secrets**.

### One-time setup — add the secrets

#### a) Base64-encode your keystore file

```bash
# macOS / Linux
base64 -w 0 twa/app/keystore/mslingo-release.keystore > keystore.b64

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("twa/app/keystore/mslingo-release.keystore")) | Out-File -Encoding ascii keystore.b64

# Windows Git Bash
base64 twa/app/keystore/mslingo-release.keystore > keystore.b64
```

`keystore.b64` is a single very long string of text. Don't commit it.

#### b) Add 4 secrets to GitHub

Go to: `https://github.com/arkimora/MSLingo/settings/secrets/actions` → **New repository secret** → add each of these:

| Secret name | Value |
|---|---|
| `KEYSTORE_BASE64` | The entire content of `keystore.b64` |
| `KEYSTORE_PASSWORD` | The keystore password you picked |
| `KEY_ALIAS` | `mslingo` (or whatever you chose) |
| `KEY_PASSWORD` | The key password (often same as keystore) |

#### c) Trigger a release

Two ways:

**Option 1 — push a tag (cleanest, fully reproducible):**

```bash
git tag v0.1.0-beta.1
git push origin v0.1.0-beta.1
```

**Option 2 — manual run from the Actions tab:**

1. Go to `https://github.com/arkimora/MSLingo/actions/workflows/release.yml`
2. Click **Run workflow**
3. Type a tag name like `v0.1.0-beta.1`
4. Click **Run workflow**

Either way, within ~5 minutes you'll have a new release at:

```
https://github.com/arkimora/MSLingo/releases/tag/v0.1.0-beta.1
```

It will be marked **prerelease** (the "Beta" label) and contain:

- `app-release.apk` — installable
- `mapping.txt` — needed to deobfuscate stack traces from users

---

## 6. Push to GitHub Releases locally with `gh` (no CI) {#gh-release}

If you already built a signed APK locally and want to attach it to a release without re-running CI:

```bash
cd twa
./gradlew assembleRelease --no-daemon
cd ..

# Create a release with the APK attached
gh release create v0.1.0-beta.1 \
  --title "v0.1.0-beta.1" \
  --notes "First public beta of MSLingo. PWA wrapped in TWA. Source: mnsl.mn" \
  --prerelease \
  twa/app/build/outputs/apk/release/app-release.apk
```

The release is marked `--prerelease` which displays the **Beta** badge on GitHub. Users will see a clear warning that this isn't a stable production build.

> Tip: add `--target main` to make GitHub mark this as "the latest pre-release" automatically.

---

## 7. Verifying the signed APK {#verify}

After building, verify the signature is correct:

```bash
# Use apksigner (part of Android build-tools)
$ANDROID_HOME/build-tools/34.0.0/apksigner verify --print-certs twa/app/build/outputs/apk/release/app-release.apk
```

You should see a `SHA-256 Fingerprint` line — **this is the value Play Store needs** for Digital Asset Links in `twa/.well-known/assetlinks.json`.

For an even more thorough check, install on a real device:

```bash
adb install twa/app/build/outputs/apk/release/app-release.apk
```

And confirm the app launches and connects to your TWA target URL.

---

## 8. Publishing on Google Play (later) {#play}

When you're ready to ship to the Play Store:

1. **Create a Google Play Developer account** ($25 one-time fee)
2. In Play Console, create a new app, fill in the store listing
3. Upload `app-release.aab` (the **bundle**, not the APK) to the Internal Testing track first
4. Promote through Closed → Open Testing → Production
5. For TWA, you need to set up **Digital Asset Links** — see `twa/.well-known/assetlinks.json` and the [Bubblewrap verification docs](https://github.com/GoogleChromeLabs/bubblewrap/blob/main/docs/verification.md)
6. The Play Store uses Play App Signing, which means you upload with your upload key, and Google manages the app signing key. To enroll, run:

```bash
java -jar pepk.jar \
  --keystore=mslingo-release.keystore \
  --alias=mslingo \
  --output=encrypted_private_key_path \
  --encryptionkey=YOUR_ENCRYPTION_KEY_FROM_PLAY_CONSOLE
```

Then upload the resulting encrypted key file to Play Console under **App signing**.

---

## 9. Troubleshooting {#troubleshooting}

### "Keystore was tampered with, or password was incorrect"

The `keystore.properties` password doesn't match the actual `.keystore` file. Re-check the password you entered during `keytool -genkey`.

### "Execution failed for task ':app:packageRelease'"

Means signing failed. The most common cause is `keystore.properties` not found at `twa/app/keystore/keystore.properties`. Run:

```bash
ls -la twa/app/keystore/
cat twa/app/keystore/keystore.properties
```

### "INSTALL_FAILED_UPDATE_INCOMPATIBLE" on `adb install`

You're trying to install the signed APK on top of a debug build (or a build signed with a different key). Uninstall first:

```bash
adb uninstall app.mslingo.twa
adb install twa/app/build/outputs/apk/release/app-release.apk
```

### CI build fails with "Cannot find keystore.properties"

The four GitHub Secrets (`KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`) are not set. Go back to [step 5b](#ci-release).

### The release APK crashes on launch

Two things to check:

1. **Digital Asset Links** — without valid `assetlinks.json` at `https://your-domain/.well-known/assetlinks.json` matching the SHA-256 of your signing key, Android shows a "this app is not trusted" toast and exits. Generate the file with Bubblewrap: `bubblewrap verify`.

2. **Target URL mismatch** — `twa/app/src/main/AndroidManifest.xml` has a trusted host. Make sure it matches the domain you're actually deploying to (e.g. `https://mslingo.vercel.app`).

---

## Quick reference — full happy path

```bash
# 1. Generate keystore (once)
keytool -genkey -v -keystore mslingo-release.keystore -alias mslingo \
  -keyalg RSA -keysize 2048 -validity 10000
mv mslingo-release.keystore twa/app/keystore/

# 2. Create keystore.properties
cat > twa/app/keystore/keystore.properties <<EOF
storeFile=keystore/mslingo-release.keystore
storePassword=YOUR_PASSWORD
keyAlias=mslingo
keyPassword=YOUR_KEY_PASSWORD
EOF

# 3. Add 4 GitHub Secrets (one time)

# 4. Build & release
git tag v0.1.0-beta.1
git push origin v0.1.0-beta.1

# 5. Within ~5 min, your release is live:
#    https://github.com/arkimora/MSLingo/releases/tag/v0.1.0-beta.1
```
