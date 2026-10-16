import React from 'react';
import * as RN from 'react-native';
import { StyleSheet, Platform } from 'react-native';

export const GLOBAL_APP_FONT = 'OddlyCalming';

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
    lower.includes('foundation')
  );
}

// 1. Monkey-patch StyleSheet.create so every style defined in the entire app
// receives fontFamily: 'OddlyCalming' and normalizes fontWeight to prevent
// Android / iOS native font manager from falling back to system Roboto / San Francisco.
const originalStyleSheetCreate = StyleSheet.create;
(StyleSheet as any).create = function patchedStyleSheetCreate(styles: any) {
  if (styles && typeof styles === 'object') {
    for (const key of Object.keys(styles)) {
      const s = styles[key];
      if (s && typeof s === 'object' && !Array.isArray(s)) {
        const hasTextProp =
          s.fontSize !== undefined ||
          s.lineHeight !== undefined ||
          s.letterSpacing !== undefined ||
          s.textAlign !== undefined ||
          s.fontFamily !== undefined ||
          s.fontWeight !== undefined;

        if (hasTextProp) {
          if (!isIconFont(s.fontFamily)) {
            // Apply Oddly Calming globally
            s.fontFamily = GLOBAL_APP_FONT;

            // In React Native (especially Android), specifying fontWeight: '700'/'800'/'bold'/'600'
            // with a single-face custom font triggers Typeface mismatch and falls back to Roboto.
            // Setting fontWeight: 'normal' guarantees OddlyCalming renders reliably everywhere.
            if (s.fontWeight && s.fontWeight !== 'normal') {
              s.fontWeight = 'normal';
            }
          }
        }
      }
    }
  }
  return originalStyleSheetCreate(styles);
};

// 2. Wrap React Native's Text component globally (for inline styles and un-patched imports)
const OriginalText = RN.Text;
export const PatchedText = React.forwardRef<any, any>((props, ref) => {
  const flat = StyleSheet.flatten(props.style) || {};

  // Preserve icon glyph fonts (Ionicons, MaterialIcons, etc.)
  if (isIconFont(flat.fontFamily)) {
    return React.createElement(OriginalText, { ...props, ref });
  }

  const overrides: any = {
    fontFamily: GLOBAL_APP_FONT,
  };
  if (flat.fontWeight && flat.fontWeight !== 'normal') {
    overrides.fontWeight = 'normal';
  }

  return React.createElement(OriginalText, {
    ...props,
    ref,
    style: [props.style, overrides],
  });
});
Object.assign(PatchedText, OriginalText);

try {
  Object.defineProperty(RN, 'Text', {
    value: PatchedText,
    configurable: true,
    enumerable: true,
    writable: true,
  });
} catch {
  (RN as any).Text = PatchedText;
}

// 3. Wrap React Native's TextInput component globally
const OriginalTextInput = RN.TextInput;
export const PatchedTextInput = React.forwardRef<any, any>((props, ref) => {
  const flat = StyleSheet.flatten(props.style) || {};
  if (isIconFont(flat.fontFamily)) {
    return React.createElement(OriginalTextInput, { ...props, ref });
  }

  const overrides: any = {
    fontFamily: GLOBAL_APP_FONT,
  };
  if (flat.fontWeight && flat.fontWeight !== 'normal') {
    overrides.fontWeight = 'normal';
  }

  return React.createElement(OriginalTextInput, {
    ...props,
    ref,
    style: [props.style, overrides],
  });
});
Object.assign(PatchedTextInput, OriginalTextInput);

try {
  Object.defineProperty(RN, 'TextInput', {
    value: PatchedTextInput,
    configurable: true,
    enumerable: true,
    writable: true,
  });
} catch {
  (RN as any).TextInput = PatchedTextInput;
}

// Patch internal exports if accessible
try {
  const textMod = require('react-native/Libraries/Text/Text');
  if (textMod) {
    textMod.default = PatchedText;
  }
} catch {}

try {
  const textInputMod = require('react-native/Libraries/Components/TextInput/TextInput');
  if (textInputMod) {
    textInputMod.default = PatchedTextInput;
  }
} catch {}
