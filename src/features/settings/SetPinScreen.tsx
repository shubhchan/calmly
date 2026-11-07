import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, BackHandler } from 'react-native';
import { Alert } from '../../services/appAlert';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { settingsRepository } from '../../database/repositories/settingsRepository';
import { appLockService } from '../../services/appLock';
import { useAppTheme } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AppText, ScreenHeader, TactilePressable } from '../../components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'SetPin'>['navigation'];

const KEYPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'backspace'],
];

/**
 * Set PIN — a calm six-digit keypad.
 *
 * The page has one job: enter six digits, then confirm them. Dots carry the
 * progress; the keypad is a quiet grid of plates.
 */
export function SetPinScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [stage, setStage] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState(false);
  const [originalPin, setOriginalPin] = useState('');

  const submitVerification = async (enteredConfirm: string) => {
    if (enteredConfirm !== originalPin) {
      setError(true);
      setConfirmPin('');
      return;
    }
    try {
      await settingsRepository?.setPin?.(enteredConfirm);
      appLockService?.lock?.();
      (navigation as any)?.goBack?.();
    } catch (err) {
      console.error('Failed to set PIN:', err);
      Alert.alert('Error', 'Failed to save security PIN. Please try again.');
    }
  };

  const handlePinPress = useCallback(
    (digit: string) => {
      if (stage === 'enter') {
        if ((pin ?? '').length < 6) {
          const nextPin = (pin ?? '') + (digit ?? '');
          setPin(nextPin);
          setError(false);
          if (nextPin.length === 6) {
            setOriginalPin(nextPin);
            setStage('confirm');
            setConfirmPin('');
          }
        }
      } else {
        if ((confirmPin ?? '').length < 6) {
          const nextConfirm = (confirmPin ?? '') + (digit ?? '');
          setConfirmPin(nextConfirm);
          setError(false);
          if (nextConfirm.length === 6) {
            void submitVerification(nextConfirm);
          }
        }
      }
    },
    [stage, pin, confirmPin, originalPin]
  );

  const handleDelete = useCallback(() => {
    if (stage === 'enter') {
      setPin((prev) => (prev ?? '').slice(0, -1));
    } else {
      setConfirmPin((prev) => (prev ?? '').slice(0, -1));
    }
    setError(false);
  }, [stage]);

  useEffect(() => {
    const subscription = BackHandler?.addEventListener?.('hardwareBackPress', () => {
      if (stage === 'confirm') {
        setStage('enter');
        setConfirmPin('');
        setError(false);
        return true;
      }
      return false;
    });
    return () => subscription?.remove?.();
  }, [stage]);

  const value = stage === 'enter' ? pin : confirmPin;

  return (
    <ScreenContainer scroll={false} backgroundColor={colors.background.default}>
      <ScreenHeader
        onBack={() => {
          if (stage === 'confirm') {
            setStage('enter');
            setConfirmPin('');
            setError(false);
          } else {
            navigation.goBack();
          }
        }}
      />

      <View style={[styles.content, { paddingBottom: insets.bottom + 24 }]}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <View style={[styles.iconPlate, { backgroundColor: colors.primary.subtle }]}>
            <Ionicons
              name={stage === 'enter' ? 'lock-closed-outline' : 'shield-checkmark-outline'}
              size={26}
              color={colors.primary.default}
            />
          </View>
          <AppText variant="h2" center>
            {stage === 'enter' ? 'Create a PIN' : 'Confirm your PIN'}
          </AppText>
          <AppText variant="body" tone="secondary" center style={{ maxWidth: 280 }}>
            {stage === 'enter'
              ? 'Six digits that only you know.'
              : 'Enter the same six digits once more.'}
          </AppText>
        </View>

        <View style={styles.pinDots}>
          {[...Array(6)].map((_, i) => {
            const filled = i < (value ?? '').length;
            const tone = error ? colors.status.error.default : colors.primary.default;
            return (
              <View
                key={i}
                style={[
                  styles.pinDot,
                  {
                    borderColor: error ? tone : filled ? tone : colors.border.strong,
                    backgroundColor: filled ? tone : 'transparent',
                  },
                ]}
              />
            );
          })}
        </View>

        <View style={{ minHeight: 24, justifyContent: 'center' }}>
          {error ? (
            <AppText variant="bodySmall" tone="error" center>
              {stage === 'confirm' ? 'The PINs do not match. Try again.' : 'Enter six digits.'}
            </AppText>
          ) : (
            <AppText variant="caption" tone="tertiary" center>
              {stage === 'enter'
                ? `${pin.length} of 6 digits`
                : `${confirmPin.length} of 6 digits`}
            </AppText>
          )}
        </View>

        <View style={styles.keypad}>
          {KEYPAD.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {(row ?? []).map((key, keyIndex) => {
                if (key === '') return <View key={keyIndex} style={styles.keypadButton} />;
                const isDelete = key === 'backspace';
                return (
                  <TactilePressable
                    key={keyIndex}
                    onPress={() => (isDelete ? handleDelete() : handlePinPress(key))}
                    scaleDownTo={0.94}
                    hapticStyle="light"
                    accessibilityRole="button"
                    accessibilityLabel={isDelete ? 'Delete' : key}
                    style={[
                      styles.keypadButton,
                      {
                        backgroundColor: isDelete
                          ? 'transparent'
                          : colors.surface.default,
                      },
                    ]}
                  >
                    {isDelete ? (
                      <Ionicons name="backspace-outline" size={24} color={colors.text.secondary} />
                    ) : (
                      <AppText variant="h2" center>
                        {key}
                      </AppText>
                    )}
                  </TactilePressable>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, paddingHorizontal: 32, justifyContent: 'center', gap: 24 },
  iconPlate: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDots: { flexDirection: 'row', justifyContent: 'center', gap: 14 },
  pinDot: { width: 15, height: 15, borderRadius: 8, borderWidth: 1.5 },
  keypad: { gap: 10 },
  keypadRow: { flexDirection: 'row', justifyContent: 'space-around' },
  keypadButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
