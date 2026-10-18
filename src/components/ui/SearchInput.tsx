import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { shape, spacing, type InputSize } from '../../theme/tokens';
import { IconButton } from './IconButton';
import { TextInput } from './TextInput';

export interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  size?: InputSize;
  disabled?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Search-flavored field: leading search glyph, trailing clear affordance and
 * a full-radius shell, built on the shared TextInput.
 */
export function SearchInput({
  value,
  onChangeText,
  placeholder,
  size = 'md',
  disabled = false,
  accessibilityLabel,
  style,
  testID,
}: SearchInputProps) {
  const showClear = value.length > 0;

  return (
    <View style={[styles.wrapper, style]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        leftIconName="i-search"
        size={size}
        disabled={disabled}
        returnKeyType="search"
        accessibilityLabel={accessibilityLabel ?? placeholder ?? 'Search'}
        containerStyle={{
          borderRadius: shape.searchInput,
          paddingRight: showClear ? spacing[10] : 0,
        }}
        testID={testID}
      />
      {showClear ? (
        <View style={styles.clearSlot} pointerEvents="box-none">
          <IconButton
            icon="i-close"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onPress={() => onChangeText('')}
            accessibilityLabel="Clear search"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  clearSlot: {
    position: 'absolute',
    right: spacing[1],
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});
