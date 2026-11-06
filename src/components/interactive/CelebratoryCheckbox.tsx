import React, { useEffect } from 'react';
import { View, Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withSpring,
  withTiming,
  interpolate,
  Easing,
  useReducedMotion,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { hapticFeedback } from '../../utils/haptics';

const AnimatedPath = Animated.createAnimatedComponent(Path);

const CHECK_PATH = 'M5 12.5 L10 17.5 L19 7.5';
const CHECK_LENGTH = 22;

interface CelebratoryCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
  borderColor?: string;
  particleColors?: string[];
  style?: StyleProp<ViewStyle>;
}

/**
 * Tactile checkbox that draws its checkmark on when checked.
 *
 * The fill and the check line are the only motion: one scale spring and one
 * stroke draw per toggle. Haptics supply the celebration.
 */
export function CelebratoryCheckbox({
  checked,
  onToggle,
  size = 28,
  activeColor = '#3E7B52',
  inactiveColor = 'transparent',
  borderColor = '#C2DCBF',
  style,
}: CelebratoryCheckboxProps) {
  const reducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const checkProgress = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    if (checked && !reducedMotion) {
      scale.value = withSpring(1.12, { mass: 0.4, damping: 12, stiffness: 260 }, () => {
        scale.value = withSpring(1, { mass: 0.4, damping: 12, stiffness: 220 });
      });
      checkProgress.value = 0;
      checkProgress.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) });
    } else {
      scale.value = 1;
      checkProgress.value = checked ? 1 : 0;
    }
  }, [checked, reducedMotion]);

  const handlePress = () => {
    if (!checked) {
      hapticFeedback.medium();
    } else {
      hapticFeedback.light();
    }
    onToggle();
  };

  const animatedBoxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const checkAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CHECK_LENGTH * (1 - checkProgress.value),
  }));

  return (
    <View style={[{ width: size + 16, height: size + 16, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Pressable
        onPress={handlePress}
        hitSlop={12}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        accessibilityLabel={checked ? 'Mark as not done' : 'Mark as done'}
      >
        <Animated.View
          style={[
            {
              width: size,
              height: size,
              borderRadius: size * 0.32,
              borderWidth: checked ? 0 : 2,
              borderColor: borderColor,
              backgroundColor: checked ? activeColor : inactiveColor,
              alignItems: 'center',
              justifyContent: 'center',
            },
            animatedBoxStyle,
          ]}
        >
          {checked && (
            <Svg width={size * 0.7} height={size * 0.7} viewBox="0 0 24 24" fill="none">
              <AnimatedPath
                d={CHECK_PATH}
                stroke="#FFFFFF"
                strokeWidth={3.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={CHECK_LENGTH}
                animatedProps={checkAnimatedProps}
              />
            </Svg>
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
}
