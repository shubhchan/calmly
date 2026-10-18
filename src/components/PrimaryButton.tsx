import React, { forwardRef } from 'react';
import { View } from 'react-native';
import { Button, type ButtonProps } from './ui/Button';

export interface PrimaryButtonProps extends Omit<ButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}

/**
 * Legacy-compatible action button. Kept as a thin wrapper over the design
 * system's `Button` (src/components/ui/Button.tsx) so every existing screen
 * gets the token-driven implementation with the same public API.
 */
export const PrimaryButton = forwardRef<View, PrimaryButtonProps>(function PrimaryButton(
  { fullWidth = true, ...props },
  ref,
) {
  return <Button ref={ref} fullWidth={fullWidth} {...props} />;
});

PrimaryButton.displayName = 'PrimaryButton';

export interface SecondaryButtonProps extends Omit<PrimaryButtonProps, 'variant'> {
  variant?: 'secondary' | 'outline' | 'ghost';
}

export const SecondaryButton = ({ variant = 'secondary', ...props }: SecondaryButtonProps) => (
  <PrimaryButton variant={variant} {...props} />
);
