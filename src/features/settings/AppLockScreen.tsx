import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Keyboard, BackHandler } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { appLockService } from '../../services/appLock';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'AppLock'>['navigation'];

export function AppLockScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  const checkBiometric = useCallback(async () => {
    const LocalAuthentication = require('expo-local-authentication');
    const available = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(available && enrolled);
    
    const { settingsRepository } = require('../../database/repositories/settingsRepository');
    const s = await settingsRepository.getSettings();
    setSettings(s);
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
    if (pin.length < 6) {
      setPin(prev => prev + digit);
      setError(false);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (pin.length !== 6) return;
    
    const valid = await appLockService.verifyPin(pin);
    if (valid) {
      appLockService.unlock('pin');
      navigation.goBack();
    } else {
      setError(true);
      setPin('');
      // Haptic feedback for error
      const { Haptics } = require('expo-haptics');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleBiometric = async () => {
    const unlocked = await appLockService.unlock('biometric');
    if (unlocked) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name="lock-closed" size={48} color="#5A955A" />
          <Text style={styles.title}>Calmly is Locked</Text>
          <Text style={styles.subtitle}>Enter your PIN to continue</Text>
        </View>

        <View style={styles.pinDots}>
          {[...Array(6)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.pinDot,
                i < pin.length && styles.pinDotFilled,
                error && styles.pinDotError,
              ]}
            />
          ))}
        </View>

        {error && (
          <Text style={styles.errorText}>Incorrect PIN. Try again.</Text>
        )}

        {biometricAvailable && settings?.biometricEnabled && (
          <TouchableOpacity onPress={handleBiometric} style={styles.biometricButton} activeOpacity={0.8}>
            <Ionicons name="finger-print" size={24} color="#5A955A" />
            <Text style={styles.biometricText}>Use Face ID / Touch ID</Text>
          </TouchableOpacity>
        )}

        <View style={styles.keypad}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['', '0', '⌫'],
          ].map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.map((key, keyIndex) => (
                <TouchableOpacity
                  key={keyIndex}
                  onPress={() => key === '⌫' ? handleDelete() : key && handlePinPress(key)}
                  style={[
                    styles.keypadButton,
                    key === '' && styles.keypadButtonEmpty,
                    key === '⌫' && styles.keypadButtonDelete,
                  ]}
                  activeOpacity={0.7}
                  accessibilityLabel={key === '⌫' ? 'Delete' : key}
                >
                  {key === '⌫' ? (
                    <Ionicons name="backspace" size={24} color="#1E232E" />
                  ) : (
                    <Text style={[
                      styles.keypadButtonText,
                      key === '' && styles.keypadButtonTextEmpty,
                    ]}>
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
  container: { flex: 1, backgroundColor: '#FDFBF7', justifyContent: 'center' },
  content: { paddingHorizontal: 32, gap: 24 },
  header: { alignItems: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: '600', color: '#1E232E' },
  subtitle: { fontSize: 16, color: '#425474' },
  pinDots: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
  pinDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#5A955A' },
  pinDotFilled: { backgroundColor: '#5A955A' },
  pinDotError: { borderColor: '#EB697F', backgroundColor: '#EB697F' },
  errorText: { textAlign: 'center', color: '#EB697F', fontSize: 14, marginTop: -8 },
  biometricButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, marginTop: 8 },
  biometricText: { fontSize: 16, color: '#5A955A', fontWeight: '500' },
  keypad: { marginTop: 16, gap: 16 },
  keypadRow: { flexDirection: 'row', justifyContent: 'space-around' },
  keypadButton: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4DEBC' },
  keypadButtonEmpty: { backgroundColor: 'transparent', borderWidth: 0 },
  keypadButtonDelete: { backgroundColor: 'transparent', borderWidth: 0 },
  keypadButtonText: { fontSize: 24, fontWeight: '500', color: '#1E232E' },
  keypadButtonTextEmpty: { color: 'transparent' },
});