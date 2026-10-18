import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import { avatarSizes, iconSizes, pressScale, radius, shape, sizes, spacing } from '../../theme/tokens';
import { AppIcon } from '../AppIcon';
import { TactilePressable } from '../interactive/TactilePressable';
import { AppText } from './AppText';

export type ListItemDensity = 'compact' | 'regular';

export interface ListItemProps {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  leftIconName?: string;
  right?: React.ReactNode;
  valueText?: string;
  chevron?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  density?: ListItemDensity;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Standard tappable row with optional leading plate, trailing value and chevron. */
export function ListItem({
  title,
  subtitle,
  left,
  leftIconName,
  right,
  valueText,
  chevron = false,
  onPress,
  disabled = false,
  density = 'regular',
  style,
  testID,
}: ListItemProps) {
  const theme = useAppTheme();
  const c = theme.colors;

  const leftNode = left ? (
    left
  ) : leftIconName ? (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: avatarSizes.md,
        height: avatarSizes.md,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: c.primary.subtle,
      }}
    >
      <AppIcon name={leftIconName} size={iconSizes.md} color={c.primary.default} animated={false} />
    </View>
  ) : null;

  const trailingNode = right ? (
    right
  ) : valueText || chevron ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
      {valueText ? (
        <AppText variant="bodySmall" tone="tertiary" numberOfLines={1}>
          {valueText}
        </AppText>
      ) : null}
      {chevron ? (
        <AppIcon name="i-chevron-forward" size={iconSizes.md} color={c.text.tertiary} animated={false} />
      ) : null}
    </View>
  ) : null;

  const rowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    borderRadius: shape.listItem,
    paddingVertical: density === 'compact' ? spacing[2] : spacing[3],
    minHeight: density === 'regular' ? sizes.touchTarget : undefined,
  };

  const content = (
    <>
      {leftNode}
      <View style={{ flex: 1, gap: spacing[1] }}>
        <AppText variant="body" tone={disabled ? 'disabled' : 'primary'} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="bodySmall" tone="tertiary" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {trailingNode}
    </>
  );

  if (onPress && !disabled) {
    return (
      <TactilePressable
        onPress={onPress}
        hapticStyle="light"
        scaleDownTo={pressScale.card}
        accessibilityRole="button"
        accessibilityLabel={title}
        hitSlop={density === 'compact' ? sizes.hitSlop : undefined}
        testID={testID}
        style={[rowStyle, style]}
      >
        {content}
      </TactilePressable>
    );
  }

  return (
    <View
      style={[rowStyle, style]}
      testID={testID}
      accessibilityState={disabled ? { disabled: true } : undefined}
    >
      {content}
    </View>
  );
}
