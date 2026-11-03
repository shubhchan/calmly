# Calmly – motion, reflections, and user-owned backup upgrade

## What changed

- **Animations:** shared element curves are calibrated to the native-stack transition duration, with the softer spring for icon transforms. Competing screen-level translate/scale entrance animations are disabled on screens that host shared tags, while `PopIn` remains available for other content. Reduced-motion support stays in place. Note: Reanimated 4 shared element transitions are still experimental, unsupported for tabs/web and unreliable between some modal/native-stack boundaries; this cannot be completely corrected with timing changes alone.
- **Lock screen:** redesigned using `ScreenContainer`, semantic `AppText`, theme colors and `TactilePressable`; responsive keypad, proper PIN progress, inline error, biometric option when enabled, and guarded duplicate unlock attempts.
- **Mood check-in:** eight more emotions: proud, motivated, relieved, connected, lonely, frustrated, uncertain, bored. Fixed selection using an out-of-date state variable, which could prevent the first tap from advancing.
- **Meaningful reflection reports:** Insights → Your reflection map. Past 7 and 30 days, genuine activity coverage, mood counts, average stress and intensity, daily chart, top moods, extracted journal themes, co-occurrence network and recent notes. Previous-period comparisons only when prior data exists. Not a diagnosis; no demo values.
- **Local data:** mood and journal repositories merge WatermelonDB and persistent fallback entries instead of making reports silently omit one source. Snapshot imports preserve IDs and merge without blindly overwriting existing local records. Data deletion also clears those fallback caches.
- **Optional identity and Drive:** Firebase authenticated Google sign-in and manual AES-GCM encrypted mood/journal snapshot upload and restore into the chosen Google account's Drive (app-created folder). See `CLOUD_SETUP.md`.

## Navigation

Settings → Google Account & Drive; Insights → Your reflection map; Google Cloud remains opt-in and local-only continues to work without credentials.

## Checks performed in this workspace

- Syntactic TypeScript transpilation for all `src/` TS/TSX files: **0 diagnostics**.
- `tests/reflectionReport.test.cjs`: **4 passing tests** covering empty-state, totals/network links, 30-day range, and comparison.
- **Not verified:** full type checking (package dependencies could not be installed in the sandbox), native build, Android/iOS screen animations, actual Firebase sign-in, real Drive API upload and restore. These require the developer's real cloud project and device builds.

## Outstanding work / honest limitations

- The user's request to **run a backend inside Drive** is impossible with Google Drive. Implemented encrypted user-owned snapshots instead, not an imaginary server deployment.
- Backups currently include **moods and journal text**, but not images/audio, habits, routines, gratitude, or full database reconciliation. This is not yet a complete automatic sync system.
- The bundled `package-lock.json` is from the original app and must be regenerated via `npm install` to incorporate the new libraries before CI uses `npm ci`.
- For production, validate credential flow, concurrent-device conflict behavior, robust recoverability, and accessibility on supported Android/iOS hardware.
