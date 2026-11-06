import React from 'react';
import { ZenIllustrationProps, ZenNatureScene } from './ZenNatureScene';

/** Zen landscape variant: privacy. */
export function PrivacySanctuaryIllustration({ width = 150, height = 130, style }: ZenIllustrationProps) {
  return <ZenNatureScene variant="privacy" width={width} height={height} style={style} />;
}
