import { resolveColors } from '../palette';
import { createAppTheme } from './createTheme';

/** Canonical dark theme (default sage accent). See light.ts for notes. */
export const darkTheme = createAppTheme(resolveColors('dark', 'sage'));
