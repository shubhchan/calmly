import React from 'react';
import { ZenIllustrationProps, ZenNatureScene } from './ZenNatureScene';

/** Zen landscape variant: planting. */
export function HabitPlantingIllustration({ width = 150, height = 130, style }: ZenIllustrationProps) {
  return <ZenNatureScene variant="planting" width={width} height={height} style={style} />;
}
