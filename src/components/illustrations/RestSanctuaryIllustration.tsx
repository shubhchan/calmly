import React from 'react';
import { ZenIllustrationProps, ZenNatureScene } from './ZenNatureScene';

/** Zen landscape variant: rest. */
export function RestSanctuaryIllustration({ width = 150, height = 130, style }: ZenIllustrationProps) {
  return <ZenNatureScene variant="rest" width={width} height={height} style={style} />;
}
