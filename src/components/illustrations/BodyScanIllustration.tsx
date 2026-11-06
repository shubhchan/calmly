import React from 'react';
import { ZenIllustrationProps, ZenNatureScene } from './ZenNatureScene';

/** Zen landscape variant: bodyScan. */
export function BodyScanIllustration({ width = 140, height = 120, style }: ZenIllustrationProps) {
  return <ZenNatureScene variant="bodyScan" width={width} height={height} style={style} />;
}
