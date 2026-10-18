import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { motion } from '../../theme/motion';
import { PopIn } from './PopIn';

interface StaggeredEntryProps {
  index?: number;
  delayStep?: number;
  baseDelay?: number;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}

/**
 * @deprecated Use PopIn directly. This is now an alias so the whole app shares
 * one entrance physics — it previously used a separate layout-animation path
 * whose stagger rhythm drifted from PopIn's.
 */
export function StaggeredEntry({
  index = 0,
  delayStep = motion.stagger,
  baseDelay = 0,
  style,
  children,
}: StaggeredEntryProps) {
  return (
    <PopIn index={index} delayStep={delayStep} baseDelay={baseDelay} style={style}>
      {children}
    </PopIn>
  );
}
