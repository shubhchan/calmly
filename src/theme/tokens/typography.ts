/**
 * Typography scale — semantic text styles resolved from the ACTIVE font.
 *
 * Styles are produced by a function (not a frozen module-level object) so the
 * in-app font browser takes effect immediately without remounting the app.
 */

import type { TextStyle } from 'react-native';
import { fontFamilies } from '../typography';

export type TextVariant =
  | 'display'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'title'
  | 'bodyLarge'
  | 'body'
  | 'bodySmall'
  | 'label'
  | 'labelSmall'
  | 'caption'
  | 'overline'
  | 'button';

export const textVariants: TextVariant[] = [
  'display',
  'h1',
  'h2',
  'h3',
  'title',
  'bodyLarge',
  'body',
  'bodySmall',
  'label',
  'labelSmall',
  'caption',
  'overline',
  'button',
];

/** Resolve a semantic text style with live font families (weight-safe). */
export function resolveTextStyle(variant: TextVariant): TextStyle {
  switch (variant) {
    case 'display':
      return { fontFamily: fontFamilies.calming.bold, fontSize: 34, lineHeight: 42, letterSpacing: 0.1, fontWeight: '700' };
    case 'h1':
      return { fontFamily: fontFamilies.calming.semiBold, fontSize: 28, lineHeight: 36, letterSpacing: 0, fontWeight: '600' };
    case 'h2':
      return { fontFamily: fontFamilies.calming.medium, fontSize: 23, lineHeight: 30, letterSpacing: 0.1, fontWeight: '500' };
    case 'h3':
      return { fontFamily: fontFamilies.sans.bold, fontSize: 20, lineHeight: 28, letterSpacing: -0.2, fontWeight: '700' };
    case 'title':
      return { fontFamily: fontFamilies.sans.semiBold, fontSize: 18, lineHeight: 24, letterSpacing: 0.1, fontWeight: '600' };
    case 'bodyLarge':
      return { fontFamily: fontFamilies.sans.regular, fontSize: 17, lineHeight: 25, letterSpacing: 0.15 };
    case 'body':
      return { fontFamily: fontFamilies.sans.regular, fontSize: 15, lineHeight: 22, letterSpacing: 0.15 };
    case 'bodySmall':
      return { fontFamily: fontFamilies.sans.regular, fontSize: 13, lineHeight: 19, letterSpacing: 0.15 };
    case 'label':
      return { fontFamily: fontFamilies.sans.semiBold, fontSize: 13, lineHeight: 18, letterSpacing: 0.2, fontWeight: '600' };
    case 'labelSmall':
      return { fontFamily: fontFamilies.sans.bold, fontSize: 12, lineHeight: 16, letterSpacing: 0.3, fontWeight: '700' };
    case 'caption':
      return { fontFamily: fontFamilies.sans.regular, fontSize: 11, lineHeight: 15, letterSpacing: 0.3 };
    case 'overline':
      return { fontFamily: fontFamilies.sans.bold, fontSize: 11, lineHeight: 14, letterSpacing: 1.2, fontWeight: '700', textTransform: 'uppercase' };
    case 'button':
      return { fontFamily: fontFamilies.sans.semiBold, fontSize: 16, lineHeight: 20, letterSpacing: 0.2, fontWeight: '600' };
  }
}

/** Semantic text color roles — resolved by AppText against the active theme. */
export type TextTone =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'inverse'
  | 'disabled'
  | 'link'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'onPrimary'
  | 'inherit';
