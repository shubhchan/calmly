import React from 'react';
import { ZenIllustrationProps, ZenNatureScene } from './ZenNatureScene';

/** Zen landscape variant: affirmation. */
export function AffirmationsRadianceIllustration({ width = 150, height = 130, style }: ZenIllustrationProps) {
  return <ZenNatureScene variant="affirmation" width={width} height={height} style={style} />;
}
