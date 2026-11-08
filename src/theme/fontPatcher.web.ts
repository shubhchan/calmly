import React from 'react';
import { StyleSheet } from 'react-native';
import {
  DEFAULT_FACES,
  resolveFaceForWeight,
  useFontStore,
} from './fontStore';

// On web, require react-native (aliased to react-native-web)
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

function isPreviewText(flatStyle?: any): boolean {
  return Boolean(flatStyle && flatStyle.isPreviewFont);
}

// 1. Safe StyleSheet.create wrapper
const originalStyleSheetCreate = StyleSheet.create;
(StyleSheet as any).create = function patchedStyleSheetCreate(styles: any) {
  return originalStyleSheetCreate(styles);
};

// 2. Wrap React Native's Text component globally for Web
export const PatchedText = React.forwardRef<any, any>((props, ref) => {
  const active = useFontStore((s) => s.active);
  const flat = StyleSheet.flatten(props.style) || {};

  if (isIconFont(flat.fontFamily)) {
    return React.createElement(OriginalText, { ...props, ref });
  }

  if (isPreviewText(flat) || flat.fixedFont) {
    return React.createElement(OriginalText, {
      ...props,
      ref,
      style: [props.style, { fontWeight: 'normal' }],
    });
  }

  const resolvedFace = resolveFaceForWeight(
    active.faces,
    flat.fontWeight,
    flat.fontStyle,
    flat.fontFamily
  );

  const overrides: any = {
    fontFamily: resolvedFace,
    fontWeight: 'normal',
  };

  return React.createElement(OriginalText, {
    ...props,
    ref,
    style: [props.style, overrides],
  });
});
Object.assign(PatchedText, OriginalText);

// 3. Wrap React Native's TextInput component globally for Web
export const PatchedTextInput = React.forwardRef<any, any>((props, ref) => {
  const active = useFontStore((s) => s.active);
  const flat = StyleSheet.flatten(props.style) || {};

  if (isIconFont(flat.fontFamily)) {
    return React.createElement(OriginalTextInput, { ...props, ref });
  }

  if (isPreviewText(flat) || flat.fixedFont) {
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
    flat.fontFamily
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

// 5. Register with NativeWind cssInterop
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

