import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, BackHandler } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { settingsRepository } from '../../database/repositories/settingsRepository';
import { appLockService } from '../../services/appLock';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'SetPin'>['navigation'];
type RouteProp = NativeStackScreenProps<RootStackParamList, 'SetPin'>['route'];

export function SetPinScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { onComplete } = ((route as any)?.params ?? {}) as { onComplete?: () => void };

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [stage, setStage] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState(false);
  const [originalPin, setOriginalPin] = useState('');

  const handlePinPress = useCallback((digit: string) => {
    if (stage === 'enter') {
      if ((pin ?? '').length < 6) {
        setPin(prev => (prev ?? '') + (digit ?? ''));
        setError(false);
      }
    } else {
      if ((confirmPin ?? '').length < 6) {
        setConfirmPin(prev => (prev ?? '') + (digit ?? ''));
        setError(false);
      }
    }
  }, [stage, pin, confirmPin]);

  const handleDelete = useCallback(() => {
    if (stage === 'enter') {
      setPin(prev => (prev ?? '').slice(0, -1));
    } else {
      setConfirmPin(prev => (prev ?? '').slice(0, -1));
    }
  }, [stage]);

  const handleSubmit = useCallback(async () => {
    try {
      if (stage === 'enter') {
        if ((pin ?? '').length !== 6) return;
        setOriginalPin(pin ?? '');
        setStage('confirm');
        setConfirmPin('');
      } else {
        if ((confirmPin ?? '').length !== 6) return;
        if ((confirmPin ?? '') !== (originalPin ?? '')) {
          setError(true);
          setConfirmPin('');
          return;
        }
        await settingsRepository?.setPin?.(confirmPin ?? '');
        appLockService?.lock?.();
        if (onComplete) onComplete();
        (navigation as any)?.goBack?.();
      }
    } catch (error) {
      console.error('Failed to set PIN:', error);
      Alert.alert('Error', 'Failed to set PIN. Please try again.');
    }
  }, [stage, pin, confirmPin, originalPin, onComplete, navigation]);

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
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Ionicons name={stage === 'enter' ? 'lock-closed' : 'lock-open'} size={48} color="#5A955A" />
          <Text style={styles.title}>
            {stage === 'enter' ? 'Create PIN' : 'Confirm PIN'}
          </Text>
          <Text style={styles.subtitle}>
            {stage === 'enter' ? 'Enter a 6-digit PIN' : 'Enter your PIN again to confirm'}
          </Text>
        </View>

        <View style={styles.pinDots}>
          {[...Array(6)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.pinDot,
                (stage === 'enter' ? i < (pin ?? '').length : i < (confirmPin ?? '').length) && styles.pinDotFilled,
                error && styles.pinDotError,
              ]}
            />
          ))}
        </View>

        {error && (
          <Text style={styles.errorText}>
            {stage === 'confirm' ? 'PINs do not match' : 'Enter 6 digits'}
          </Text>
        )}

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
  keypad: { marginTop: 16, gap: 16 },
  keypadRow: { flexDirection: 'row', justifyContent: 'space-around' },
  keypadButton: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4DEBC' },
  keypadButtonEmpty: { backgroundColor: 'transparent', borderWidth: 0 },
  keypadButtonDelete: { backgroundColor: 'transparent', borderWidth: 0 },
  keypadButtonText: { fontSize: 24, fontWeight: '500', color: '#1E232E' },
  keypadButtonTextEmpty: { color: 'transparent' },
});