import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { settingsRepository } from '../../database/repositories/settingsRepository';
import { appLockService } from '../../services/appLock';
import { useAppTheme } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ScreenHeader, TactilePressable } from '../../components';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'SetPin'>['navigation'];

export function SetPinScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useAppTheme();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [stage, setStage] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState(false);
  const [originalPin, setOriginalPin] = useState('');

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
            submitVerification(nextConfirm);
          }
        }
      }
    },
    [stage, pin, confirmPin, originalPin]
  );

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

  return (
    <ScreenContainer scroll={false} backgroundColor={colors.background.default} style={styles.container}>
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

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primary.default + '18' }]}>
            <Ionicons
              name={stage === 'enter' ? 'lock-closed-outline' : 'shield-checkmark-outline'}
              size={36}
              color={colors.primary.default}
            />
          </View>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {stage === 'enter' ? 'Create Security PIN' : 'Confirm Security PIN'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            {stage === 'enter' ? 'Enter a memorable 6-digit passcode' : 'Re-enter your 6 digits to verify'}
          </Text>
        </View>

        <View style={styles.pinDots}>
          {[...Array(6)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.pinDot,
                { borderColor: colors.border.default, backgroundColor: 'transparent' },
                (stage === 'enter' ? i < (pin ?? '').length : i < (confirmPin ?? '').length) && {
                  backgroundColor: colors.primary.default,
                  borderColor: colors.primary.default,
                },
                error && {
                  borderColor: colors.accents.rose,
                  backgroundColor: colors.accents.rose,
                },
              ]}
            />
          ))}
        </View>

        {error ? (
          <Text style={[styles.errorText, { color: colors.accents.rose }]}>
            {stage === 'confirm' ? 'PINs do not match. Please try again.' : 'Enter 6 digits'}
          </Text>
        ) : null}

        <View style={styles.keypad}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['', '0', '⌫'],
          ].map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {(row ?? []).map((key, keyIndex) => (
                <TactilePressable
                  key={keyIndex}
                  onPress={() => (key === '⌫' ? handleDelete() : key && handlePinPress(key))}
                  scaleDownTo={0.9}
                  disabled={key === ''}
                  style={[
                    styles.keypadButton,
                    { backgroundColor: colors.surface.default, borderColor: colors.border.default },
                    key === '' && styles.keypadButtonEmpty,
                    key === '⌫' && styles.keypadButtonDelete,
                  ]}
                  accessibilityLabel={key === '⌫' ? 'Delete' : key}
                >
                  {key === '⌫' ? (
                    <Ionicons name="backspace-outline" size={26} color={colors.text.primary} />
                  ) : (
                    <Text
                      style={[
                        styles.keypadButtonText,
                        { color: colors.text.primary },
                        key === '' && styles.keypadButtonTextEmpty,
                      ]}
                    >
                      {key}
                    </Text>
                  )}
                </TactilePressable>
              ))}
            </View>
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 32, justifyContent: 'center', gap: 20 },
  header: { alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.3 },
  subtitle: { fontSize: 14, textAlign: 'center' },
  pinDots: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginVertical: 8 },
  pinDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  errorText: { textAlign: 'center', fontSize: 14, fontWeight: '500', marginTop: -6 },
  keypad: { marginTop: 8, gap: 14 },
  keypadRow: { flexDirection: 'row', justifyContent: 'space-around' },
  keypadButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  keypadButtonEmpty: { backgroundColor: 'transparent', borderWidth: 0, elevation: 0 },
  keypadButtonDelete: { backgroundColor: 'transparent', borderWidth: 0, elevation: 0 },
  keypadButtonText: { fontSize: 26, fontWeight: '600' },
  keypadButtonTextEmpty: { color: 'transparent' },
});