import React from 'react';
import { ZenIllustrationProps, ZenNatureScene } from './ZenNatureScene';

/** Zen landscape variant: journal. */
export function JournalReflectionIllustration({ width = 140, height = 120, style }: ZenIllustrationProps) {
  return <ZenNatureScene variant="journal" width={width} height={height} style={style} />;
}
