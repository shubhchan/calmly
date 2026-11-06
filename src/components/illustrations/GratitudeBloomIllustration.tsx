import React from 'react';
import { ZenIllustrationProps, ZenNatureScene } from './ZenNatureScene';

/** Zen landscape variant: bloom. */
export function GratitudeBloomIllustration({ width = 150, height = 130, style }: ZenIllustrationProps) {
  return <ZenNatureScene variant="bloom" width={width} height={height} style={style} />;
}
