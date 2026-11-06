import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

interface PopInProps {
  /** Legacy stagger props — accepted for API compatibility, ignored. */
  index?: number;
  delayStep?: number;
  baseDelay?: number;
  rise?: number;
  scaleFrom?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * Static content wrapper.
 *
 * Screens already play a single entry animation from the native route
 * transition, so wrapping individual cards or rows in another fade makes the
 * page stutter. This component keeps its old props for compatibility but no
 * longer animates.
 */
export function PopIn({ style, children }: PopInProps) {
  return <View style={style}>{children}</View>;
}
