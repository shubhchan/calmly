import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Switch, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { settingsRepository } from '../../database/repositories/settingsRepository';
import { appLockService } from '../../services/appLock';
import * as LocalAuthentication from 'expo-local-authentication';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'AppLockSettings'>['navigation'];

export function AppLockSettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [pinEnabled, setPinEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [autoLockMinutes, setAutoLockMinutes] = useState(5);
  const [hideInSwitcher, setHideInSwitcher] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [changingPin, setChangingPin] = useState(false);

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const available = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(available && enrolled);

      const settings = await settingsRepository.getSettings();
      setPinEnabled(settings.pinEnabled);
      setBiometricEnabled(settings.biometricEnabled);
      setAutoLockMinutes(settings.autoLockMinutes);
      setHideInSwitcher(settings.hideContentInSwitcher);
    } catch (error) {
      console.error('Failed to load app lock settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handlePinToggle = async (enabled: boolean) => {
    if (enabled && !pinEnabled) {
      navigation.navigate('SetPin', { onComplete: () => setPinEnabled(true) });
    } else if (!enabled && pinEnabled) {
      await settingsRepository.removePin();
      setPinEnabled(false);
      if (biometricEnabled) {
        await settingsRepository.updateSettings({ biometricEnabled: false });
        setBiometricEnabled(false);
      }
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    if (!biometricAvailable) {
      Alert.alert('Not Available', 'Biometric authentication is not set up on this device.');
      return;
    }
    if (enabled && !pinEnabled) {
      Alert.alert('PIN Required', 'Please set up a PIN first before enabling biometric unlock.');
      return;
    }
    setBiometricEnabled(enabled);
    await settingsRepository.updateSettings({ biometricEnabled: enabled });
  };

  const handleAutoLockChange = async (minutes: number) => {
    setAutoLockMinutes(minutes);
    await settingsRepository.updateSettings({ autoLockMinutes: minutes });
    appLockService.recordActivity();
  };

  const handleSwitcherToggle = async (enabled: boolean) => {
    setHideInSwitcher(enabled);
    await settingsRepository.updateSettings({ hideContentInSwitcher: enabled });
  };

  const handleChangePin = () => {
    navigation.navigate('SetPin', { onComplete: () => {} });
  };

  const handleRemovePin = async () => {
    Alert.alert(
      'Remove PIN?',
      'This will disable app lock entirely. You can set it up again later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await settingsRepository.removePin();
            setPinEnabled(false);
            if (biometricEnabled) {
              await settingsRepository.updateSettings({ biometricEnabled: false });
              setBiometricEnabled(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#5A955A" style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#1E232E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>App Lock</Text>
        <View style={styles.headerSpacer} />
      </View>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Lock Method</Text>
        
        <View style={styles.lockOption}>
          <View style={styles.lockOptionInfo}>
            <View style={[styles.lockIcon, { backgroundColor: '#5A955A' + '20' }]}>
              <Ionicons name="lock-closed" size={22} color="#5A955A" />
            </View>
            <View style={styles.lockOptionText}>
              <Text style={styles.lockOptionLabel}>PIN Lock</Text>
              <Text style={styles.lockOptionDesc}>
                {pinEnabled ? '6-digit PIN required to unlock' : 'Set a 6-digit PIN'}
              </Text>
            </View>
          </View>
          <View style={styles.lockOptionActions}>
            {pinEnabled ? (
              <>
                <TouchableOpacity onPress={handleChangePin} style={styles.changeButton}>
                  <Text style={styles.changeButtonText}>Change PIN</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleRemovePin} style={styles.removeButton}>
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={() => handlePinToggle(true)} style={styles.setupButton}>
                <Text style={styles.setupButtonText}>Set Up PIN</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {biometricAvailable && (
          <View style={[styles.lockOption, styles.lockOptionDivider]}>
            <View style={styles.lockOptionInfo}>
              <View style={[styles.lockIcon, { backgroundColor: '#6B9BCD' + '20' }]}>
                <Ionicons name="finger-print" size={22} color="#6B9BCD" />
              </View>
              <View style={styles.lockOptionText}>
                <Text style={styles.lockOptionLabel}>Biometric Unlock</Text>
                <Text style={styles.lockOptionDesc}>
                  {biometricEnabled ? 'Face ID / Touch ID enabled' : 'Use Face ID or Touch ID'}
                </Text>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              thumbColor={biometricEnabled ? '#5A955A' : '#425474'}
              trackColor={{ false: '#E4DEBC', true: '#5A955A' }}
              disabled={!pinEnabled}
            />
          </View>
        )}

        {!biometricAvailable && (
          <View style={styles.lockOptionInfo}>
            <View style={[styles.lockIcon, { backgroundColor: '#E4DEBC' }]}>
              <Ionicons name="finger-print" size={22} color="#425474" />
            </View>
            <View style={styles.lockOptionText}>
              <Text style={styles.lockOptionLabel}>Biometric Unlock</Text>
              <Text style={styles.lockOptionDesc}>
                Not available on this device
              </Text>
            </View>
          </View>
        )}
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Auto-Lock</Text>
        <Text style={styles.sectionDesc}>
          Automatically lock the app after inactivity
        </Text>
        <View style={styles.autoLockOptions}>
          {[0, 1, 5, 15, 30].map((minutes) => (
            <TouchableOpacity
              key={minutes}
              onPress={() => handleAutoLockChange(minutes)}
              style={[
                styles.autoLockButton,
                autoLockMinutes === minutes && styles.autoLockButtonActive,
              ]}
            >
              <Text style={[
                styles.autoLockButtonText,
                autoLockMinutes === minutes && styles.autoLockButtonTextActive,
              ]}>
                {minutes === 0 ? 'Never' : `${minutes} min`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.switcherRow}>
          <View style={styles.switcherInfo}>
            <View style={[styles.lockIcon, { backgroundColor: '#EB876D' + '20' }]}>
              <Ionicons name="eye-off" size={22} color="#EB876D" />
            </View>
            <View>
              <Text style={styles.lockOptionLabel}>Hide in App Switcher</Text>
              <Text style={styles.lockOptionDesc}>
                Blur app preview when switching apps
              </Text>
            </View>
          </View>
          <Switch
            value={hideInSwitcher}
            onValueChange={handleSwitcherToggle}
            thumbColor={hideInSwitcher ? '#5A955A' : '#425474'}
            trackColor={{ false: '#E4DEBC', true: '#5A955A' }}
          />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF7' },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '600', color: '#1E232E', textAlign: 'center' },
  headerSpacer: { width: 44 },
  card: { marginBottom: 16, gap: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#1E232E', marginBottom: 4 },
  sectionDesc: { fontSize: 14, color: '#34415A', lineHeight: 20, marginBottom: 16 },
  lockOption: { gap: 12 },
  lockOptionDivider: { paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E4DEBC', marginTop: 4 },
  lockOptionInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  lockIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  lockOptionText: { flex: 1, gap: 2 },
  lockOptionLabel: { fontSize: 16, fontWeight: '500', color: '#1E232E' },
  lockOptionDesc: { fontSize: 13, color: '#425474' },
  lockOptionActions: { flexDirection: 'row', gap: 8 },
  setupButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#5A955A' },
  setupButtonText: { fontSize: 14, fontWeight: '600', color: 'white' },
  changeButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4DEBC' },
  changeButtonText: { fontSize: 13, fontWeight: '600', color: '#5A955A' },
  removeButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#EB697F' },
  removeButtonText: { fontSize: 13, fontWeight: '600', color: '#EB697F' },
  autoLockOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  autoLockButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4DEBC' },
  autoLockButtonActive: { backgroundColor: '#5A955A', borderColor: '#5A955A' },
  autoLockButtonText: { fontSize: 13, fontWeight: '600', color: '#1E232E' },
  autoLockButtonTextActive: { color: 'white' },
  switcherRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switcherInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
});