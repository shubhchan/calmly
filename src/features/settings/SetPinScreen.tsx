import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, BackHandler } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { settingsRepository } from '../../database/repositories/settingsRepository';
import { appLockService } from '../../services/appLock';
import { useThemeColors } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'SetPin'>['navigation'];
type RouteProp = NativeStackScreenProps<RootStackParamList, 'SetPin'>['route'];

export function SetPinScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const colors = useThemeColors();
  const { onComplete } = ((route as any)?.params ?? {}) as { onComplete?: () => void };

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
      if (onComplete) onComplete();
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
    <ScreenContainer scroll={false} backgroundColor={colors.bgPrimary} style={styles.container}>
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => {
            if (stage === 'confirm') {
              setStage('enter');
              setConfirmPin('');
              setError(false);
            } else {
              navigation.goBack();
            }
          }}
          style={[styles.backButton, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: colors.accentPrimary + '18' }]}>
            <Ionicons
              name={stage === 'enter' ? 'lock-closed-outline' : 'shield-checkmark-outline'}
              size={36}
              color={colors.accentPrimary}
            />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {stage === 'enter' ? 'Create Security PIN' : 'Confirm Security PIN'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {stage === 'enter' ? 'Enter a memorable 6-digit passcode' : 'Re-enter your 6 digits to verify'}
          </Text>
        </View>

        <View style={styles.pinDots}>
          {[...Array(6)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.pinDot,
                { borderColor: colors.borderLight, backgroundColor: 'transparent' },
                (stage === 'enter' ? i < (pin ?? '').length : i < (confirmPin ?? '').length) && {
                  backgroundColor: colors.accentPrimary,
                  borderColor: colors.accentPrimary,
                },
                error && {
                  borderColor: colors.accentRose || '#EB697F',
                  backgroundColor: colors.accentRose || '#EB697F',
                },
              ]}
            />
          ))}
        </View>

        {error ? (
          <Text style={[styles.errorText, { color: colors.accentRose || '#EB697F' }]}>
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
                <TouchableOpacity
                  key={keyIndex}
                  onPress={() => (key === '⌫' ? handleDelete() : key && handlePinPress(key))}
                  style={[
                    styles.keypadButton,
                    { backgroundColor: colors.bgCard, borderColor: colors.borderLight },
                    key === '' && styles.keypadButtonEmpty,
                    key === '⌫' && styles.keypadButtonDelete,
                  ]}
                  activeOpacity={0.7}
                  accessibilityLabel={key === '⌫' ? 'Delete' : key}
                >
                  {key === '⌫' ? (
                    <Ionicons name="backspace-outline" size={26} color={colors.textPrimary} />
                  ) : (
                    <Text
                      style={[
                        styles.keypadButtonText,
                        { color: colors.textPrimary },
                        key === '' && styles.keypadButtonTextEmpty,
                      ]}
                    >
                      {key}
                    </Text>
                  )}
                </TouchableOpacity>
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
  topNav: {
    paddingHorizontal: 20,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
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