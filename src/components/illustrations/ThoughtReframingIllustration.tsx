import React from 'react';
import { ZenIllustrationProps, ZenNatureScene } from './ZenNatureScene';

/** Zen landscape variant: reframe. */
export function ThoughtReframingIllustration({ width = 160, height = 135, style }: ZenIllustrationProps) {
  return <ZenNatureScene variant="reframe" width={width} height={height} style={style} />;
}
