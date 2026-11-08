import React from 'react';
import { StyleSheet } from 'react-native';
import {
  DEFAULT_FACES,
  resolveFaceForWeight,
  useFontStore,
} from './fontStore';

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

// 2. Patch react-native-web Text.render in-place without touching module exports
if (OriginalText && typeof OriginalText.render === 'function') {
  const originalTextRender = OriginalText.render;
  OriginalText.render = function PatchedTextWebRender(props: any, ref: any) {
    const active = useFontStore((s) => s.active);
    const flat = StyleSheet.flatten(props?.style) || {};

    if (isIconFont(flat.fontFamily)) {
      return originalTextRender(props, ref);
    }

    if (isPreviewText(flat) || flat.fixedFont) {
      return originalTextRender(
        {
          ...props,
          style: [props?.style, { fontWeight: 'normal' }],
        },
        ref
      );
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

    return originalTextRender(
      {
        ...props,
        style: [props?.style, overrides],
      },
      ref
    );
  };
}

// 3. Patch react-native-web TextInput.render in-place without touching module exports
if (OriginalTextInput && typeof OriginalTextInput.render === 'function') {
  const originalInputRender = OriginalTextInput.render;
  OriginalTextInput.render = function PatchedTextInputWebRender(props: any, ref: any) {
    const active = useFontStore((s) => s.active);
    const flat = StyleSheet.flatten(props?.style) || {};

    if (isIconFont(flat.fontFamily)) {
      return originalInputRender(props, ref);
    }

    if (isPreviewText(flat) || flat.fixedFont) {
      return originalInputRender(
        {
          ...props,
          style: [props?.style, { fontWeight: 'normal' }],
        },
        ref
      );
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

    return originalInputRender(
      {
        ...props,
        style: [props?.style, overrides],
      },
      ref
    );
  };
}

export const PatchedText = OriginalText;
export const PatchedTextInput = OriginalTextInput;

// 4. Register with NativeWind cssInterop if available
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
