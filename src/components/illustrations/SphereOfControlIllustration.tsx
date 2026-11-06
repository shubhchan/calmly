import React from 'react';
import { ZenIllustrationProps, ZenNatureScene } from './ZenNatureScene';

/** Zen landscape variant: control. */
export function SphereOfControlIllustration({ width = 160, height = 135, style }: ZenIllustrationProps) {
  return <ZenNatureScene variant="control" width={width} height={height} style={style} />;
}
