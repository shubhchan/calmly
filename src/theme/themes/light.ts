import { resolveColors } from '../palette';
import { createAppTheme } from './createTheme';

/**
 * Canonical light theme (default sage accent). The ThemeProvider builds the
 * live theme from the user's accent via `createAppTheme(resolveColors(...))`;
 * this export exists for documentation, the showcase and non-React usage.
 */
export const lightTheme = createAppTheme(resolveColors('light', 'sage'));
