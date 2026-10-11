---
name: Warm Stone & Linen
colors:
  surface: '#fff8f4'
  surface-dim: '#e0d9d4'
  surface-bright: '#fff8f4'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#faf2ed'
  surface-container: '#f4ece7'
  surface-container-high: '#eee7e2'
  surface-container-highest: '#e8e1dc'
  on-surface: '#1e1b18'
  on-surface-variant: '#434843'
  inverse-surface: '#33302d'
  inverse-on-surface: '#f7efea'
  outline: '#737872'
  outline-variant: '#c3c8c0'
  surface-tint: '#4e6452'
  primary: '#293d2d'
  on-primary: '#ffffff'
  primary-container: '#3f5443'
  on-primary-container: '#afc7b2'
  inverse-primary: '#b5cdb7'
  secondary: '#934a33'
  on-secondary: '#ffffff'
  secondary-container: '#ffa185'
  on-secondary-container: '#783520'
  tertiary: '#40362d'
  on-tertiary: '#ffffff'
  tertiary-container: '#584d43'
  on-tertiary-container: '#cebeb2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d1e9d2'
  primary-fixed-dim: '#b5cdb7'
  on-primary-fixed: '#0c2012'
  on-primary-fixed-variant: '#374c3b'
  secondary-fixed: '#ffdbd1'
  secondary-fixed-dim: '#ffb59f'
  on-secondary-fixed: '#3a0a00'
  on-secondary-fixed-variant: '#75331e'
  tertiary-fixed: '#f0e0d2'
  tertiary-fixed-dim: '#d4c4b7'
  on-tertiary-fixed: '#221a12'
  on-tertiary-fixed-variant: '#50453b'
  background: '#fff8f4'
  on-background: '#1e1b18'
  surface-variant: '#e8e1dc'
typography:
  display-lg:
    fontFamily: Newsreader
    fontSize: 48px
    fontWeight: '400'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Newsreader
    fontSize: 36px
    fontWeight: '400'
    lineHeight: 44px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Newsreader
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Newsreader
    fontSize: 26px
    fontWeight: '400'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Newsreader
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 30px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.04em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 3rem
  margin-tablet: 2rem
  margin-mobile: 1.25rem
  space-xs: 0.375rem
  space-sm: 0.75rem
  space-md: 1.25rem
  space-lg: 2rem
  space-xl: 3.5rem
---

## Brand & Style

This design system embodies mindful presence, intentional slowness, and tactile grounding. Designed for daily mindfulness, structured breathwork sessions, and mental restoration, the interface acts as a quiet sanctuary rather than a demanding digital tool. 

The aesthetic is Tactile Minimalist with organic material influences: stone paper, unbleached linen, and soft clay ceramics. The interface emphasizes quietude through deliberate pauses in layout, generous negative space, gentle transitions, and soft physical boundaries. It completely eschews artificial high-gloss gradients, sharp neon states, and urgent interactions in favor of warm, muted tactility that calms the nervous system on sight.

## Colors

The palette is rooted in tranquil, earthy, and organic tones:
- **Primary (`#3F5443` — Tranquil Matcha):** Used for focal elements, active states, serene CTAs, and completed breath intervals. Provides an anchoring, grounding presence.
- **Secondary (`#BD6B52` — Soft Terracotta):** Used selectively for warmth, highlights, mindful progression marks, and warm accents without inducing urgency.
- **Tertiary (`#82756A` — Raw Clay):** Bridges structural UI elements, inactive indicators, muted iconography, and secondary metadata.
- **Neutral (`#272421` — Smoked Umber):** The primary text color, softer and more organic than pure black, ensuring deep contrast without optical harshness.

### Supporting Canvas & Surface Tones
- **Canvas Base:** `#FBF9F5` (Stone Paper)
- **Surface Layer 1:** `#F5F2EB` (Warm Linen)
- **Surface Layer 2:** `#EEEAE0` (Pressed Sand)
- **Subtle Border:** `#EAE5DB` (Soft Mineral Rim)

## Typography

The type system blends the contemplative, editorial warmth of `Newsreader` (headlines, meditative mantras, session prompts) with the clear, open, and approachable geometry of `Plus Jakarta Sans` (body, functional copy, and control labels). 

Headlines utilize regular and medium weights with relaxed proportions to evoke physical book printing. Body copy prioritizes generous line-heights to support effortless scanning and cognitive calm. Text contrast adheres strictly to accessibility standards against stone and linen backgrounds while avoiding harsh black-and-white cuts.

## Layout & Spacing

The layout model uses an unhurried, breathable fluid grid that shifts from a 4-column framework on mobile, to 8 columns on tablet, up to 12 columns on desktop (max canvas width constrained to 1200px to maintain intimate readability).

Whitespace is treated as an active calming agent rather than empty space:
- Vertical stack sequences maintain at least `space-lg` to separate discrete thoughts or exercise routines.
- Containers preserve generous internal padding to let type breathe against stone card backings.
- Dynamic responsive margins pull content inward to prevent edge collision and promote optical focus.

## Elevation & Depth

Depth is tactile and warm, modeled after soft natural daylight filtering onto matte stone and linen. Traditional harsh dropshadows and stark black alpha layers are entirely avoided.

- **Tonal Layers:** The foundation rests on `#FBF9F5` (Stone Paper). Elevated cards and surfaces layer upon it using `#F5F2EB` and `#EEEAE0`.
- **Ambient Warm Shadows:** Raised interactive objects cast wide, diffused shadows tinted with burnt umber and clay: `0 8px 30px -4px rgba(78, 64, 53, 0.05), 0 2px 8px -2px rgba(78, 64, 53, 0.03)`.
- **Soft Mineral Outlines:** Cards and structured surfaces employ a 1px hairline border in `#EAE5DB` to define edge boundaries gently without creating visual noise.

## Shapes

Corner radii draw inspiration from river-smoothed stones and hand-molded ceramics. Roundedness is set to level `2`:
- Base interactive components (inputs, list rows, small containers) use `0.5rem` (`8px`).
- Medium and large tactile cards leverage `rounded-lg` (`1rem` / `16px`).
- Feature breathing modules, focal visualizers, and hero sheets employ `rounded-xl` (`1.5rem` / `24px`).
- Breathwork guidance indicators, sound filter chips, and circular audio controls utilize soft pill contours (`9999px`).

## Components

### Buttons
- **Primary:** Filled with Tranquil Matcha (`#3F5443`), label in `#FBF9F5`, padding `0.875rem 1.75rem`, subtle warm hover expansion with no sharp color shifts.
- **Secondary:** Surface `#F5F2EB` with a 1px border in `#EAE5DB`, label in `#272421`.
- **Ghost:** Minimalist text button in `#3F5443` or `#BD6B52` with underline or gentle background tint on hover.

### Chips & Filters
- Compact pill-shaped pills with a 1px border (`#EAE5DB`).
- Unselected: Canvas-toned (`#F5F2EB`) with `#82756A` text.
- Selected: Soft Matcha wash (`rgba(63, 84, 67, 0.1)`) with `#3F5443` text and a subtle matching border.

### Cards
- Backed with Linen `#F5F2EB`, bordered with 1px `#EAE5DB`, curved to `1rem` or `1.5rem`.
- Padding set to `space-md` or `space-lg`.
- Hover state raises elevation slightly with the ambient warm shadow and an imperceptible surface highlight (`#FAF8F3`).

### Form Controls (Inputs, Checkboxes, Radios)
- **Text Inputs:** Recessed stone background (`#EEEAE0`), border in `#EAE5DB`, transition to `#3F5443` focus rings with soft ambient diffusion.
- **Checkboxes & Radios:** Curved or circular containers with soft terracotta (`#BD6B52`) or tranquil matcha (`#3F5443`) fills upon check, featuring smooth easing transitions.

### Lists
- Separated by soft hairline dividers (`#EAE5DB`) or discrete stone card rows. Generous vertical spacing (`0.875rem` vertical padding per item) to prevent crowded touch targets.

### Specialized Mindful Components
- **Breathwork Orb / Pacer:** Concentric harmonic circles using tranquil matcha and soft terracotta fills at low opacities (`rgba(63, 84, 67, 0.08)` to `0.25`), expanding and contracting with gentle sinus easing curves.
- **Linen Audio Player:** Floating horizontal bar rounded to `9999px`, featuring matte terracotta playback progress sliders and tactile haptic controls.