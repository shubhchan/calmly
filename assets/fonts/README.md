# Fonts Directory

This directory holds raw font files that ship inside the app bundle.

Bundled fonts are registered in `src/theme/fontRegistry.ts` (`BUNDLED_FONTS`).
Most bundled fonts come from `@expo-google-fonts/*` npm packages and need no
files here — only fonts without an npm package belong in this folder.

## Adding a custom bundled font (e.g. Nothing's Ndot-55 / Ndot-57)

Nothing's official device fonts (Ndot-55, Ndot-57, Lettera Mono) are
proprietary and are NOT included in this app. The closest free, legally
distributable alternatives ship as **Doto** and **Handjet** (both bundled via
`@expo-google-fonts` packages).

If you own the official font files and want to use them locally:

1. Copy the `.ttf` / `.otf` file into this folder (e.g. `Ndot55.ttf`).
2. Add an entry to `BUNDLED_FONTS` in `src/theme/fontRegistry.ts`:

   ```ts
   {
     key: 'ndot-55',
     label: 'Ndot 55',
     description: 'Nothing dot-matrix display',
     category: 'display',
     source: 'bundled',
     faces: { regular: 'Ndot55' },
     assets: { Ndot55: require('../../assets/fonts/Ndot55.ttf') },
   }
   ```

3. It appears in Settings → Typography automatically.
