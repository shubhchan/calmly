import React from 'react';
import { ZenIllustrationProps, ZenNatureScene } from './ZenNatureScene';

/** Zen landscape variant: soundscape. */
export function NatureSoundscapeIllustration({ width = 160, height = 135, style }: ZenIllustrationProps) {
  return <ZenNatureScene variant="soundscape" width={width} height={height} style={style} />;
}
