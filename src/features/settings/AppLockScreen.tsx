import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { appLockService } from '../../services/appLock';
import { useThemeColors } from '../../theme/ThemeContext';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'AppLock'>['navigation'];

export function AppLockScreen() {
  const navigation = useNavigation<NavigationProp>();
  const colors = useThemeColors();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  const checkBiometric = useCallback(async () => {
    try {
      const LocalAuthentication = require('expo-local-authentication');
      const available = (await LocalAuthentication?.hasHardwareAsync?.()) ?? false;
      const enrolled = (await LocalAuthentication?.isEnrolledAsync?.()) ?? false;
      setBiometricAvailable(available && enrolled);
    } catch {
      setBiometricAvailable(false);
    }
    try {
      const { settingsRepository } = require('../../database/repositories/settingsRepository');
      const s = await settingsRepository?.getSettings?.();
      setSettings(s ?? null);
    } catch {
      setSettings(null);
    }
  }, []);

  useEffect(() => {
    checkBiometric();

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      return true; // Prevent back button from exiting
    });

    return () => {
      subscription.remove();
    };
  }, [checkBiometric]);

  const handlePinPress = (digit: string) => {
    if ((pin ?? '').length < 6) {
      const nextPin = (pin ?? '') + (digit ?? '');
      setPin(nextPin);
      setError(false);
      if (nextPin.length === 6) {
        verify(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => (prev ?? '').slice(0, -1));
    setError(false);
  };

  const verify = async (candidatePin: string) => {
    try {
      const valid = await appLockService?.verifyPin?.(candidatePin);
      if (valid) {
        appLockService?.unlock?.('pin');
        (navigation as any)?.goBack?.();
      } else {
        setError(true);
        setPin('');
        try {
          const { Haptics } = require('expo-haptics');
          Haptics?.notificationAsync?.(Haptics?.NotificationFeedbackType?.Error);
        } catch {}
      }
    } catch {
      setError(true);
      setPin('');
    }
  };

  const handleBiometric = async () => {
    try {
      const unlocked = await appLockService?.unlock?.('biometric');
      if (unlocked) {
        (navigation as any)?.goBack?.();
      }
    } catch {}
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bgPrimary }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: colors.accentPrimary + '18' }]}>
            <Ionicons name="lock-closed" size={36} color={colors.accentPrimary} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Calmly is Locked</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Enter your 6-digit security PIN</Text>
        </View>

        <View style={styles.pinDots}>
          {[...Array(6)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.pinDot,
                { borderColor: colors.borderLight, backgroundColor: 'transparent' },
                i < (pin ?? '').length && { backgroundColor: colors.accentPrimary, borderColor: colors.accentPrimary },
                error && { borderColor: colors.accentRose || '#EB697F', backgroundColor: colors.accentRose || '#EB697F' },
              ]}
            />
          ))}
        </View>

        {error ? (
          <Text style={[styles.errorText, { color: colors.accentRose || '#EB697F' }]}>Incorrect PIN. Please try again.</Text>
        ) : null}

        {biometricAvailable && settings?.biometricEnabled ? (
          <TouchableOpacity onPress={handleBiometric} style={styles.biometricButton} activeOpacity={0.8}>
            <Ionicons name="finger-print" size={24} color={colors.accentPrimary} />
            <Text style={[styles.biometricText, { color: colors.accentPrimary }]}>Unlock with Biometrics</Text>
          </TouchableOpacity>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  content: { paddingHorizontal: 32, gap: 24 },
  header: { alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.4 },
  subtitle: { fontSize: 15 },
  pinDots: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginVertical: 8 },
  pinDot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
  errorText: { textAlign: 'center', fontSize: 14, fontWeight: '500', marginTop: -8 },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  biometricText: { fontSize: 15, fontWeight: '600' },
  keypad: { marginTop: 12, gap: 14 },
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