import React from 'react';
import { ZenIllustrationProps, ZenNatureScene } from './ZenNatureScene';

/** Zen landscape variant: panic. */
export function PanicAnchorIllustration({ width = 140, height = 120, style }: ZenIllustrationProps) {
  return <ZenNatureScene variant="panic" width={width} height={height} style={style} />;
}
