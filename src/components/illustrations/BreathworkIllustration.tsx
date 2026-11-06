import React from 'react';
import { ZenIllustrationProps, ZenNatureScene } from './ZenNatureScene';

/** Zen landscape variant: breath. */
export function BreathworkIllustration({ width = 140, height = 120, style }: ZenIllustrationProps) {
  return <ZenNatureScene variant="breath" width={width} height={height} style={style} />;
}
