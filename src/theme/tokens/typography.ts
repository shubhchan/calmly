/**
 * Typography scale — semantic text styles resolved from the ACTIVE font.
 *
 * Every style, including display type, follows the user's chosen font.
 * Styles are produced by a function so a font change takes effect immediately
 * without remounting the app.
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
      return { fontFamily: fontFamilies.sans.regular, fontSize: 48, lineHeight: 60, letterSpacing: -0.96, paddingBottom: 4 };
    case 'h1':
      return { fontFamily: fontFamilies.sans.regular, fontSize: 40, lineHeight: 52, letterSpacing: -0.8, paddingBottom: 4 };
    case 'h2':
      return { fontFamily: fontFamilies.sans.regular, fontSize: 32, lineHeight: 44, letterSpacing: -0.64, paddingBottom: 3 };
    case 'h3':
      return { fontFamily: fontFamilies.sans.regular, fontSize: 24, lineHeight: 36, letterSpacing: -0.48, paddingBottom: 3 };
    case 'title':
      return { fontFamily: fontFamilies.sans.semiBold, fontSize: 17, lineHeight: 25, letterSpacing: 0, fontWeight: '600', paddingBottom: 2 };
    case 'bodyLarge':
      return { fontFamily: fontFamilies.sans.regular, fontSize: 17, lineHeight: 26, letterSpacing: 0, paddingBottom: 1 };
    case 'body':
      return { fontFamily: fontFamilies.sans.regular, fontSize: 15, lineHeight: 23, letterSpacing: 0 };
    case 'bodySmall':
      return { fontFamily: fontFamilies.sans.regular, fontSize: 13, lineHeight: 20, letterSpacing: 0 };
    case 'label':
      return { fontFamily: fontFamilies.sans.semiBold, fontSize: 12, lineHeight: 17, letterSpacing: 0.2, fontWeight: '600' };
    case 'labelSmall':
      return { fontFamily: fontFamilies.sans.semiBold, fontSize: 11, lineHeight: 15, letterSpacing: 0.4, fontWeight: '600' };
    case 'caption':
      return { fontFamily: fontFamilies.sans.regular, fontSize: 12, lineHeight: 17, letterSpacing: 0.1 };
    case 'overline':
      return { fontFamily: fontFamilies.sans.semiBold, fontSize: 11, lineHeight: 15, letterSpacing: 1.2, fontWeight: '600', textTransform: 'uppercase' };
    case 'button':
      return { fontFamily: fontFamilies.sans.semiBold, fontSize: 15, lineHeight: 21, letterSpacing: 0.1, fontWeight: '600' };
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
