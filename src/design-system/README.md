# Calmly Design System

One source of truth for spacing, color, type, shape, motion and UI components.
Screens compose **semantic tokens** — never raw hex values or off-scale numbers.

Reach the live reference in-app: **Settings → About → Design System**
(route `DesignSystem`, `src/design-system/DesignSystemScreen.tsx`).

## Architecture

```
src/theme/
  palette.ts              raw color source (resolveColors(theme, accent))
  tints.ts, fontStore.ts, motion.ts   existing subsystems
  tokens/                 design tokens (theme-independent)
    spacing.ts   4pt scale (0–16 keys → 0/4/8/…/64) + layout rhythms
    radius.ts    radius scale + per-component `shape` intents
    sizes.ts     control heights, icon sizes, avatars, border widths
    shadows.ts   resolveShadow(level, isDark, shadowColor) + elevation intents
    opacity.ts   disabled/pressed/hover/scrim opacity values
    typography.ts resolveTextStyle(variant), TextVariant, TextTone
    icons.ts     iconSizes, resolveIconColor(tone, colors), IconTone
    motion.ts    re-exports src/theme/motion + motionPresets + pressScale
    colors.ts    withAlpha(), tonalRamps (docs/showcase only)
  themes/                semantic color layer
    types.ts       AppThemeColors + AppTheme shapes
    createTheme.ts createAppTheme(raw) — the ONLY raw→semantic mapping
    light.ts / dark.ts  canonical themes (sage accent)
  ThemeContext.tsx   ThemeProvider exposes `tokens: AppTheme`; `useAppTheme()`
src/components/ui/     the component library (see inventory below)
```

### The two hooks

| Hook            | Returns                                            | Use for                                |
| --------------- | -------------------------------------------------- | -------------------------------------- |
| `useAppTheme()` | `{ mode, isDark, accent, colors, raw }`            | **Everything new** — semantic tokens   |
| `useThemeColors()` | `ResolvedColors` (legacy raw palette)           | Existing screens during migration      |

`useAppTheme()` never throws — outside the provider it falls back to the
canonical light theme (safe in boot screens and error boundaries).

### Color rules

- Components read only `theme.colors.*` semantic roles:
  `primary`, `secondary`, `accents`, `background`, `surface`, `text`,
  `border`, `status.{success,warning,error,info}`, `interactive`, `overlay`,
  `disabled`.
- Switching theme or accent re-derives every semantic color instantly —
  there is no per-screen color logic to update.
- `theme.raw` is an escape hatch for legacy code paths only.

### Fonts & icons

- **One active app font, everywhere.** `src/theme/fontStore.ts` holds the
  active face; a global Text/TextInput patch (`fontPatcher.ts`) re-renders all
  typography instantly when the font changes (Settings → Typography).
- Default and recommended face: **Plus Jakarta Sans**. Bundled faces:
  Plus Jakarta Sans, Newsreader, Patrick Hand, **Doto** and **Handjet**
  (dot-matrix / pixel display fonts in the Nothing-phone spirit; Nothing's
  official Ndot fonts are proprietary and not bundled). 1,500+ more Google
  Fonts download on demand via `src/services/googleFonts.ts`.
- **Icons are static vectors only** — `AppIcon` (no Lottie, no animations).
  Primary set is Ionicons (`i-*` names or bare glyph names); mood faces use
  MaterialCommunityIcons (`m-*`, via `moodIcon()`). Legacy `l-*` names still
  resolve to their static vector equivalents. The `animated`/`loop` props are
  deprecated no-ops.

### Motion

Built on the [Reanimated fundamentals](https://docs.swmansion.com/react-native-reanimated/docs/category/fundamentals/)
model: shared values + `useAnimatedStyle`, spring/timing configs from tokens,
work executed on the UI thread.

- **Tokens live in `src/theme/motion.ts`** (`duration`, `spring.{gentle,screen,pop,snappy}`,
  `ease`, `rise`, `popScale`, `stagger`). Never write inline timing/spring literals.
- **`PopIn`** is the single entrance primitive for cards, sections and list rows:
  `withDelay(index * motion.stagger, withSpring(1, motion.spring.pop))`.
  `StaggeredEntry` is a deprecated alias of it — one physics app-wide.
- **`TactilePressable`** is the only tap primitive: spring press-in/out on the UI
  thread via `motion.spring.snappy`, `scaleDownTo`, `hapticStyle`, a11y passthrough.
  Its `style` prop is a plain array (no `pressed` style functions).
- Everything respects `useReducedMotion()` / `useAppReducedMotion()` — entrances
  collapse to a short fade, presses stop scaling.

## Component inventory (`src/components/ui`)

Import from `../../components/ui` (or the root barrel `../../components`,
except the note below).

| Component                         | Highlights                                                    |
| --------------------------------- | ------------------------------------------------------------- |
| `AppText` / `Heading`             | 13 text variants, 12 semantic tones, live font switching       |
| `Button`                          | 5 variants × 3 sizes, loading, icons (auto-colored), haptics   |
| `IconButton`                      | ghost/subtle/outline/solid, a11y label required                |
| `Surface`                         | background/border/radius/elevation/padding/tone container      |
| `Card` … (`CardHeader/Content/Footer`) | token-driven, pastel `tone`, pressable variant            |
| `TextInput` / `SearchInput`       | label, helper, error, icons, sizes, focus ring                 |
| `Checkbox` / `RadioButton` + `RadioGroup` / `Switch` | full a11y states                     |
| `Chip` / `Badge`                  | filters, labels, status tones                                  |
| `Avatar`                          | initials / icon / image, tint tones, 6 sizes                   |
| `Divider`                         | horizontal/vertical, optional centered label                   |
| `ListItem` / `SectionHeader`      | settings rows, sections, chevrons, value text                  |
| `ScreenHeader`                    | canonical stack-screen header: back chip + title/subtitle + `right`/`center` slots |
| `PageHeader`                      | canonical tab-page title block: `h1` in the active font + subtitle + `right` slot |
| `EmptyState`                      | tinted icon plate, optional CTA                                |
| `InlineAlert`                     | neutral/success/warning/error/info with dismiss                |
| `LoadingIndicator` / `LoadingOverlay` | spinners + blocking overlay                                |
| `SkeletonLine/Text/Avatar/Card/List/Form` | semantic wrappers over the existing shimmer      |
| `ProgressBar`                     | animated fill, label + percent, a11y progressbar               |
| `Modal` / `ConfirmDialog` / `BottomSheet` | animated mount/unmount, backdrop dismiss, reduced-motion safe |

> Note: `SkeletonText`/`SkeletonCard` exist in both the legacy
> `interactive/Skeleton` module and `ui/SkeletonLoader`. The root barrel keeps
> the legacy pair; import `{ SkeletonText, SkeletonCard } from '.../components/ui'`
> for the design-system versions.

## Usage

```tsx
import { AppText, Button, Card, CardContent } from '../../components/ui';
import { spacing } from '../../theme/tokens';

function Example() {
  return (
    <Card variant="elevated">
      <CardContent>
        <AppText variant="title">Evening reflection</AppText>
        <AppText variant="body" tone="secondary" style={{ marginTop: spacing[1] }}>
          How did today feel?
        </AppText>
        <Button title="Start" fullWidth onPress={start} />
      </CardContent>
    </Card>
  );
}
```

## Migration notes

- `src/components/Card.tsx` and `src/components/PrimaryButton.tsx` are now thin
  shims over the design system with identical public APIs — existing imports
  keep working and already get the new implementation.
- Screens can migrate incrementally: swap `useThemeColors()` for
  `useAppTheme()`, replace hardcoded paddings with `spacing`, and adopt
  `ui/*` components where behavior matches.

## Adding a component

1. Build on existing primitives (`Surface`, `TactilePressable`, `AppText`,
   `AppIcon`); never introduce a new shadow/color literal.
2. Every interactive element: `accessibilityRole`, `accessibilityLabel`,
   `accessibilityState`, hit target ≥ 44 (use `sizes.hitSlop` when smaller).
3. Animate with Reanimated and gate on `useAppReducedMotion()`.
4. Export a named component + props interface from its own file, then add it
   to `src/components/ui/index.ts` (and the root barrel if there is no clash).
5. Feature it in `DesignSystemScreen.tsx` so it is exercised in both themes.
