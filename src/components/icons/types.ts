// Mirrors animateicons.in's `IconHandle` convention (startAnimation/stopAnimation
// via ref) so the same calling code works whether an icon is driven by a press,
// a parent state change, or triggered imperatively from a button handler.
export interface IconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

export interface AnimatedIconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  // If true, the icon animates itself on press (mobile has no hover state,
  // so "animate on hover" from the web libraries becomes "animate on press").
  animateOnPress?: boolean;
  onPress?: () => void;
}
