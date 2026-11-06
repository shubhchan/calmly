import React from 'react';
import { ZenIllustrationProps, ZenNatureScene } from './ZenNatureScene';

/** Zen landscape variant: landscape. */
export function MoodLandscapeIllustration({ width = 140, height = 120, style }: ZenIllustrationProps) {
  return <ZenNatureScene variant="landscape" width={width} height={height} style={style} />;
}
