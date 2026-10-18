import React, { forwardRef, useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { useAppTheme } from '../../theme/ThemeContext';
import {
  borderWidths,
  iconSizes,
  inputSizes,
  resolveTextStyle,
  shape,
  spacing,
  type InputSize,
} from '../../theme/tokens';
import { AppIcon } from '../AppIcon';
import { AppText } from './AppText';

export interface TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  helperText?: string;
  errorText?: string;
  leftIconName?: string;
  rightIconName?: string;
  size?: InputSize;
  disabled?: boolean;
  secureTextEntry?: boolean;
  multiline?: boolean;
  keyboardType?: RNTextInputProps['keyboardType'];
  autoCapitalize?: RNTextInputProps['autoCapitalize'];
  autoCorrect?: boolean;
  maxLength?: number;
  returnKeyType?: RNTextInputProps['returnKeyType'];
  onBlur?: RNTextInputProps['onBlur'];
  onFocus?: RNTextInputProps['onFocus'];
  accessibilityLabel?: string;
  containerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<TextStyle>;
  testID?: string;
}

/**
 * Themed text field with label, helper/error messaging, leading/trailing
 * icons, a focus ring and full disabled styling — all token-driven.
 */
export const TextInput = forwardRef<RNTextInput, TextInputProps>(function TextInput(
  {
    value,
    onChangeText,
    placeholder,
    label,
    helperText,
    errorText,
    leftIconName,
    rightIconName,
    size = 'md',
    disabled = false,
    secureTextEntry = false,
    multiline = false,
    keyboardType,
    autoCapitalize,
    autoCorrect,
    maxLength,
    returnKeyType,
    onBlur,
    onFocus,
    accessibilityLabel,
    containerStyle,
    style,
    testID,
  }: TextInputProps,
  ref,
) {
  const theme = useAppTheme();
  const c = theme.colors;
  const [focused, setFocused] = useState(false);
  const sizeSpec = inputSizes[size];
  const hasError = Boolean(errorText);
  const iconColor = disabled ? c.disabled.foreground : c.text.tertiary;

  const borderColor = hasError
    ? c.status.error.default
    : focused
      ? c.border.focus
      : disabled
        ? c.disabled.border
        : c.border.default;

  return (
    <View style={styles.root}>
      {label ? (
        <AppText variant="label" tone="secondary">
          {label}
        </AppText>
      ) : null}
      <View
        style={[
          styles.field,
          {
            minHeight: sizeSpec.height,
            paddingHorizontal: sizeSpec.paddingHorizontal,
            borderRadius: shape.input,
            backgroundColor: disabled ? c.disabled.background : c.surface.default,
            borderColor,
            borderWidth: focused || hasError ? borderWidths.medium : borderWidths.thin,
          },
          multiline && styles.fieldMultiline,
          containerStyle,
        ]}
      >
        {leftIconName ? (
          <AppIcon name={leftIconName} size={iconSizes.md} color={iconColor} animated={false} />
        ) : null}
        <RNTextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={disabled ? c.disabled.foreground : c.text.tertiary}
          editable={!disabled}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          maxLength={maxLength}
          returnKeyType={returnKeyType}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          accessibilityLabel={accessibilityLabel ?? label ?? placeholder}
          accessibilityState={{ disabled }}
          testID={testID}
          style={[
            resolveTextStyle('body'),
            styles.input,
            {
              fontSize: sizeSpec.fontSize,
              color: disabled ? c.disabled.foreground : c.text.primary,
            },
            multiline && styles.inputMultiline,
            style,
          ]}
        />
        {rightIconName ? (
          <AppIcon name={rightIconName} size={iconSizes.md} color={iconColor} animated={false} />
        ) : null}
      </View>
      {errorText ? (
        <AppText variant="bodySmall" tone="error">
          {errorText}
        </AppText>
      ) : helperText ? (
        <AppText variant="bodySmall" tone="tertiary">
          {helperText}
        </AppText>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    gap: spacing[2],
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  fieldMultiline: {
    alignItems: 'flex-start',
    paddingVertical: spacing[3],
  },
  input: {
    flex: 1,
    padding: 0,
  },
  inputMultiline: {
    textAlignVertical: 'top',
  },
});
