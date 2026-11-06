import React from 'react';
import { ZenIllustrationProps, ZenNatureScene } from './ZenNatureScene';

/** Zen landscape variant: meditation. */
export function MeditationHeroIllustration({ width = 160, height = 140, style }: ZenIllustrationProps) {
  return <ZenNatureScene variant="meditation" width={width} height={height} style={style} />;
}
