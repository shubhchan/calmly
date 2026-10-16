import React from 'react';
import { StyleSheet } from 'react-native';
import {
  DEFAULT_FACES,
  getActiveFont,
  resolveFaceForWeight,
  useFontStore,
} from './fontStore';

// Require the actual module object of react-native directly so we patch the real export
// that all modules receive when doing `import { Text } from 'react-native'`.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ReactNative = require('react-native');
const OriginalText = ReactNative.Text;
const OriginalTextInput = ReactNative.TextInput;

/** Back-compat default face name (the bundled handwritten font). */
export const GLOBAL_APP_FONT = DEFAULT_FACES.regular;

export function isIconFont(fontFamily?: string | null): boolean {
  if (!fontFamily || typeof fontFamily !== 'string') return false;
  const lower = fontFamily.toLowerCase();
  return (
    lower.includes('icon') ||
    lower.includes('ionicons') ||
    lower.includes('feather') ||
    lower.includes('fontawesome') ||
    lower.includes('material') ||
    lower.includes('entypo') ||
    lower.includes('evilicons') ||
    lower.includes('antdesign') ||
    lower.includes('octicons') ||
    lower.includes('simplelineicons') ||
    lower.includes('zocial') ||
    lower.includes('foundation') ||
    lower.includes('monospace')
  );
}

/**
 * Checks whether a text element explicitly requests to render an isolated preview
 * (used in FontBrowserScreen cards so each font sample shows its own typeface).
 */
function isPreviewText(flatStyle?: any): boolean {
  return Boolean(flatStyle && flatStyle.isPreviewFont);
}

// 1. Monkey-patch StyleSheet.create as a safe wrapper that does NOT mutate
// or erase fontWeight, ensuring all text styles maintain their weight hierarchy.
const originalStyleSheetCreate = StyleSheet.create;
(StyleSheet as any).create = function patchedStyleSheetCreate(styles: any) {
  return originalStyleSheetCreate(styles);
};

// 2. Wrap React Native's Text component globally.
// The wrapper subscribes to useFontStore, so changing the active font in settings
// immediately re-renders every Text component across the entire app.
export const PatchedText = React.forwardRef<any, any>((props, ref) => {
  const active = useFontStore((s) => s.active);
  const flat = StyleSheet.flatten(props.style) || {};

  // Preserve icon fonts (e.g. Ionicons, Feather)
  if (isIconFont(flat.fontFamily)) {
    return React.createElement(OriginalText, { ...props, ref });
  }

  // Preserve isolated font previews in the typography browser
  if (isPreviewText(flat)) {
    return React.createElement(OriginalText, {
      ...props,
      ref,
      style: [props.style, { fontWeight: 'normal' }],
    });
  }

  // Resolve the active font face for the requested weight hierarchy
  const resolvedFace = resolveFaceForWeight(
    active.faces,
    flat.fontWeight,
    flat.fontStyle,
    flat.fontFamily,
  );

  const overrides: any = {
    fontFamily: resolvedFace,
    // Custom single-face fonts in React Native Android fall back to Roboto if
    // fontWeight is not normalized on the rendered element. The visual weight
    // is already provided by the resolvedFace (e.g. bold or medium TTF).
    fontWeight: 'normal',
  };

  return React.createElement(OriginalText, {
    ...props,
    ref,
    style: [props.style, overrides],
  });
});
Object.assign(PatchedText, OriginalText);

// 3. Wrap React Native's TextInput component globally (same subscription).
export const PatchedTextInput = React.forwardRef<any, any>((props, ref) => {
  const active = useFontStore((s) => s.active);
  const flat = StyleSheet.flatten(props.style) || {};

  if (isIconFont(flat.fontFamily)) {
    return React.createElement(OriginalTextInput, { ...props, ref });
  }

  if (isPreviewText(flat)) {
    return React.createElement(OriginalTextInput, {
      ...props,
      ref,
      style: [props.style, { fontWeight: 'normal' }],
    });
  }

  const resolvedFace = resolveFaceForWeight(
    active.faces,
    flat.fontWeight,
    flat.fontStyle,
    flat.fontFamily,
  );

  const overrides: any = {
    fontFamily: resolvedFace,
    fontWeight: 'normal',
  };

  return React.createElement(OriginalTextInput, {
    ...props,
    ref,
    style: [props.style, overrides],
  });
});
Object.assign(PatchedTextInput, OriginalTextInput);

// 4. Overwrite Text and TextInput on ReactNative with getters
try {
  Object.defineProperty(ReactNative, 'Text', {
    get: () => PatchedText,
    set: () => {},
    configurable: true,
    enumerable: true,
  });
} catch {
  ReactNative.Text = PatchedText;
}

try {
  Object.defineProperty(ReactNative, 'TextInput', {
    get: () => PatchedTextInput,
    set: () => {},
    configurable: true,
    enumerable: true,
  });
} catch {
  ReactNative.TextInput = PatchedTextInput;
}

// 5. Overwrite the module export of Libraries/Text/Text and Libraries/Components/TextInput/TextInput
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const TextModule = require('react-native/Libraries/Text/Text');
  if (TextModule) {
    TextModule.default = PatchedText;
    if (TextModule.Text) TextModule.Text = PatchedText;
  }
} catch {}

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const TextInputModule = require('react-native/Libraries/Components/TextInput/TextInput');
  if (TextInputModule) {
    TextInputModule.default = PatchedTextInput;
    if (TextInputModule.TextInput) TextInputModule.TextInput = PatchedTextInput;
  }
} catch {}

// 6. Overwrite Animated.Text on react-native and react-native-reanimated
try {
  if (ReactNative.Animated && ReactNative.Animated.createAnimatedComponent) {
    ReactNative.Animated.Text = ReactNative.Animated.createAnimatedComponent(PatchedText);
  }
} catch {}

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Reanimated = require('react-native-reanimated');
  if (Reanimated?.default?.createAnimatedComponent) {
    Reanimated.default.Text = Reanimated.default.createAnimatedComponent(PatchedText);
  }
} catch {}

// 7. Register with NativeWind cssInterop so className="..." doesn't bypass PatchedText
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { cssInterop } = require('react-native-css-interop');
  if (typeof cssInterop === 'function') {
    cssInterop(PatchedText, { className: 'style' });
    cssInterop(PatchedTextInput, {
      className: { target: 'style', nativeStyleToProp: { textAlign: true } },
    });
  }
} catch {}


