import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { appLockService } from '../../services/appLock';
import { useAppTheme } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { TactilePressable } from '../../components';

export function AppLockScreen({ onUnlocked }: { onUnlocked?: () => void }) {
  const { colors } = useAppTheme();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const autoPromptedRef = useRef(false);

  const handleBiometric = useCallback(async () => {
    try {
      const unlocked = await appLockService?.unlockWithBiometric?.();
      if (unlocked) {
        onUnlocked?.();
      }
    } catch {}
  }, [onUnlocked]);

  const checkBiometric = useCallback(async () => {
    let hardwareOk = false;
    try {
      const LocalAuthentication = require('expo-local-authentication');
      const available = (await LocalAuthentication?.hasHardwareAsync?.()) ?? false;
      const enrolled = (await LocalAuthentication?.isEnrolledAsync?.()) ?? false;
      hardwareOk = available && enrolled;
      setBiometricAvailable(hardwareOk);
    } catch {
      setBiometricAvailable(false);
    }
    try {
      const { settingsRepository } = require('../../database/repositories/settingsRepository');
      const s = await settingsRepository?.getSettings?.();
      setSettings(s ?? null);
      if (hardwareOk && s?.biometricEnabled && !autoPromptedRef.current) {
        autoPromptedRef.current = true;
        handleBiometric();
      }
    } catch {
      setSettings(null);
    }
  }, [handleBiometric]);

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
      const valid = await appLockService?.unlockWithPin?.(candidatePin);
      if (valid) {
        onUnlocked?.();
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

  return (
    <ScreenContainer scroll={false} backgroundColor={colors.background.default} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primary.default + '18' }]}>
            <Ionicons name="lock-closed" size={36} color={colors.primary.default} />
          </View>
          <Text style={[styles.title, { color: colors.text.primary }]}>Calmly is Locked</Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>Enter your 6-digit security PIN</Text>
        </View>

        <View style={styles.pinDots}>
          {[...Array(6)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.pinDot,
                { borderColor: colors.border.default, backgroundColor: 'transparent' },
                i < (pin ?? '').length && { backgroundColor: colors.primary.default, borderColor: colors.primary.default },
                error && { borderColor: colors.accents.rose, backgroundColor: colors.accents.rose },
              ]}
            />
          ))}
        </View>

        {error ? (
          <Text style={[styles.errorText, { color: colors.accents.rose }]}>Incorrect PIN. Please try again.</Text>
        ) : null}

        {biometricAvailable && settings?.biometricEnabled ? (
          <TactilePressable onPress={handleBiometric} style={styles.biometricButton}>
            <Ionicons name="finger-print" size={24} color={colors.primary.default} />
            <Text style={[styles.biometricText, { color: colors.primary.default }]}>Unlock with Biometrics</Text>
          </TactilePressable>
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