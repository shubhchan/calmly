# Calmly: Firebase sign-in and user-owned Google Drive backups

## What is and is not implemented

Calmly remains local-first. **Settings → Google Account & Drive** provides optional native Google sign-in, a Firebase authenticated user session, permission-limited Google Drive access, and *manual* encrypted backup/merge of **mood check-ins and text-only journal entries**. A folder named **Calmly Backups** is created in the Google Drive account selected at sign-in. Choosing another account means signing out and signing in again with that Google account.

There is **no executable backend deployed in Google Drive**. Drive provides file storage, not application servers or database transactions. Google Drive's `appDataFolder` is hidden and cannot be browsed in Drive UI; this implementation instead uses the app-created *visible* Calmly Backups folder with the narrower `drive.file` OAuth scope. Users cannot currently pick arbitrary pre-existing folders (that would require a Google Picker flow and additional authorization handling). Data is available on a different device via **Restore** after sign-in and passphrase entry. There is no automatic/two-way background sync, conflict resolution, media-attachment sync, or sync of the other Calmly modules yet.

## 1. Configure Firebase and Google Cloud

1. Create a Firebase project. Add Android (package `com.anonymous.calmly` unless you change it) and iOS app registrations. In **Authentication → Sign-in method**, enable **Google** and configure the project support email.
2. In Google Cloud Console, ensure the **Google Drive API** is enabled for the same project. Set up an OAuth consent screen, and add the scope `https://www.googleapis.com/auth/drive.file`. Configure/test allowed Google users according to your app's publishing state. Do not request full Drive permissions.
3. Create the appropriate Google OAuth clients for Android, iOS, and **Web application**. For Android provide SHA-1 signatures for both local/development and Play App Signing certificates. For iOS use the correct bundle identifier and reversed client ID scheme.
4. Copy `.env.example` to `.env` and supply the Firebase **public app configuration**, **Web OAuth client ID**, and iOS reversed-client-ID URL scheme. These are client identifiers; **never embed OAuth client secrets, Firebase service account keys, or refresh tokens**.
5. `app.config.js` enables the native Google Sign-In config plugin only when `EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME` is provided. iOS needs the real reversed client ID. If Firebase Android configuration or platform builds require native Firebase plist/json files, follow the Google sign-in library instructions for the selected setup. Do not commit those files unless consistent with your organization's policy.

## 2. Install and build

```bash
cp .env.example .env
npm install
npx expo prebuild --clean
npx expo run:android
# or npx expo run:ios on macOS
```

`npm install` is needed to resolve newly introduced dependencies and update the original package lock. **The uploaded lockfile predates these dependencies.** Re-run `npm install` and commit the regenerated `package-lock.json` before using `npm ci` in CI. A native development/production build is required for Google Sign-In; it **does not work in Expo Go**. Ensure Google OAuth redirect configuration matches your native package and app signing certificates.

## 3. Use in app

1. Open **Settings → Google Account & Drive**, then tap **Continue with Google**. Google login creates/uses a Firebase Auth session; it does *not* upload journal data.
2. Choose your desired Google account. To switch Drive accounts, sign out and sign in with the other account.
3. Enter a **unique backup passphrase of at least 12 characters**; store this somewhere safe yourself. Tap **Back up now**. The app captures mood and text-journal records, encrypts with PBKDF2-SHA256 (210,000 iterations) and AES-256-GCM, then uploads ciphertext to the app-created Drive folder.
4. On a different device, sign in with the matching Google account. Tap **refresh** to list backups. Enter the **same passphrase** and tap a backup to merge it locally. Existing entry IDs are preserved; duplicate IDs are skipped.
5. Backups are separate snapshots. Erasing the app's local data will **not** erase Drive backups; remove the snapshots manually in Drive if you no longer want them.

**Privacy:** Existing local fallback repositories still store records in AsyncStorage, which is not end-to-end encrypted. The app PIN is a screen lock, not encryption of the local database. Drive **snapshots** use encryption, but this work does not retroactively encrypt every record on the device. Journal audio/image attachments and other modules are not included. Backup passphrases are not stored or sent to Firebase/Drive, so losing the passphrase means the backup cannot be recovered.

## 4. Validation

```bash
npm run test:reports
npx tsc --noEmit
npx expo start --dev-client
```

Real-device validation checklist: sign-in/out/account switching; revoked permission; first-time Drive folder creation; repeated backups; wrong passphrase; restore on second device; offline UI; application lock; Android/iOS reduced-motion accessibility; shared transitions on device. Test both release and debug builds. Do not assume native Firebase OAuth is verified until tested with your actual credentials.

## 5. If you later need a true backend

Deploy a separately hosted FastAPI/Node API on **Cloud Run, a VPS, or another compute host**. Users could choose their own backend endpoint in a future settings screen. Firebase ID tokens must be verified server-side; do not trust client-provided user IDs. Google Drive can remain an encrypted backup destination, but is unsuitable as a multi-client transactional database or execution environment. Decide whether to introduce server-side storage only after a privacy/security review.
