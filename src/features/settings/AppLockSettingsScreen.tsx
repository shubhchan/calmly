import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Switch } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/Card';
import { settingsRepository } from '../../database/repositories/settingsRepository';
import { appLockService } from '../../services/appLock';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAppTheme } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ScreenHeader } from '../../components';
import { PopIn } from '../../components/interactive/PopIn';
import { BrandedLoader } from '../../components/interactive/LoadingState';
import { resolveTint } from '../../theme/tints';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'AppLockSettings'>['navigation'];

export function AppLockSettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDark } = useAppTheme();
  const [pinEnabled, setPinEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [autoLockMinutes, setAutoLockMinutes] = useState(5);
  const [hideInSwitcher, setHideInSwitcher] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [loading, setLoading] = useState(true);
  const lilacTint = resolveTint(!!isDark, 'lilac');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const available = (await LocalAuthentication?.hasHardwareAsync?.()) ?? false;
      const enrolled = (await LocalAuthentication?.isEnrolledAsync?.()) ?? false;
      setBiometricAvailable(available && enrolled);

      const settings = (await settingsRepository?.getSettings?.()) ?? {};
      setPinEnabled(settings?.pinEnabled ?? false);
      setBiometricEnabled(settings?.biometricEnabled ?? false);
      setAutoLockMinutes(settings?.autoLockMinutes ?? 5);
      setHideInSwitcher(settings?.hideContentInSwitcher ?? true);
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
    try {
      if (enabled && !pinEnabled) {
        (navigation as any)?.navigate?.('SetPin', { onComplete: () => setPinEnabled(true) });
      } else if (!enabled && pinEnabled) {
        await settingsRepository?.removePin?.();
        setPinEnabled(false);
        if (biometricEnabled) {
          await settingsRepository?.updateSettings?.({ biometricEnabled: false });
          setBiometricEnabled(false);
        }
      }
    } catch (error) {
      console.error('Failed to toggle PIN:', error);
    }
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    try {
      if (!biometricAvailable) {
        Alert.alert('Not Available', 'Biometric authentication is not set up on this device.');
        return;
      }
      if (enabled && !pinEnabled) {
        Alert.alert('PIN Required', 'Please set up a PIN first before enabling biometric unlock.');
        return;
      }
      setBiometricEnabled(enabled ?? false);
      await settingsRepository?.updateSettings?.({ biometricEnabled: enabled ?? false });
    } catch (error) {
      console.error('Failed to toggle biometric:', error);
    }
  };

  const handleAutoLockChange = async (minutes: number) => {
    try {
      setAutoLockMinutes(minutes ?? 5);
      await settingsRepository?.updateSettings?.({ autoLockMinutes: minutes ?? 5 });
      appLockService?.recordActivity?.();
    } catch (error) {
      console.error('Failed to change auto-lock:', error);
    }
  };

  const handleSwitcherToggle = async (enabled: boolean) => {
    try {
      setHideInSwitcher(enabled ?? true);
      await settingsRepository?.updateSettings?.({ hideContentInSwitcher: enabled ?? true });
    } catch (error) {
      console.error('Failed to toggle switcher:', error);
    }
  };

  const handleChangePin = () => {
    (navigation as any)?.navigate?.('SetPin', { onComplete: () => {} });
  };

  const handleRemovePin = () => {
    Alert.alert(
      'Remove PIN?',
      'This will disable app lock entirely. You can set it up again later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await settingsRepository?.removePin?.();
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
      <ScreenContainer contentContainerStyle={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
        <BrandedLoader label="Loading security settings" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <ScreenHeader title="App Lock & Security" />

      <PopIn index={0}>
        <Card tone="lilac" style={styles.card}>
          <Text style={[styles.sectionTitle, { color: lilacTint.text }]}>Lock Method</Text>

          <View style={styles.lockOption}>
            <View style={styles.lockOptionInfo}>
              <View style={[styles.lockIcon, { backgroundColor: lilacTint.plate }]}>
                <Ionicons name="lock-closed" size={20} color={lilacTint.accent} />
              </View>
              <View style={styles.lockOptionText}>
                <Text style={[styles.lockOptionLabel, { color: lilacTint.text }]}>PIN Protection</Text>
                <Text style={[styles.lockOptionDesc, { color: lilacTint.muted }]}>
                  {pinEnabled ? '6-digit PIN required on opening' : 'Set a private 6-digit PIN'}
                </Text>
              </View>
            </View>
            <View style={styles.lockOptionActions}>
              {pinEnabled ? (
                <>
                  <TouchableOpacity
                    onPress={handleChangePin}
                    style={[styles.changeButton, { backgroundColor: lilacTint.plate, borderColor: lilacTint.border }]}
                  >
                    <Text style={[styles.changeButtonText, { color: lilacTint.accent }]}>Change</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleRemovePin}
                    style={[styles.removeButton, { borderColor: colors.accents.rose + '60' }]}
                  >
                    <Text style={[styles.removeButtonText, { color: colors.accents.rose }]}>Remove</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  onPress={() => handlePinToggle(true)}
                  style={[styles.setupButton, { backgroundColor: colors.primary.default }]}
                >
                  <Text style={styles.setupButtonText}>Set Up PIN</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={[styles.lockOption, styles.lockOptionDivider, { borderTopColor: lilacTint.border }]}>
            <View style={styles.lockOptionInfo}>
              <View style={[styles.lockIcon, { backgroundColor: lilacTint.plate, opacity: biometricAvailable ? 1 : 0.5 }]}>
                <Ionicons name="finger-print" size={20} color={lilacTint.accent} />
              </View>
              <View style={styles.lockOptionText}>
                <Text style={[styles.lockOptionLabel, { color: lilacTint.text }]}>Biometric Unlock</Text>
                <Text style={[styles.lockOptionDesc, { color: lilacTint.muted }]}>
                  {!biometricAvailable
                    ? 'Not available on this device'
                    : !pinEnabled
                      ? 'Set a PIN first to enable biometrics'
                      : biometricEnabled
                        ? 'Biometrics active'
                        : 'Unlock using Face ID or Fingerprint'}
                </Text>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              thumbColor="#FFFFFF"
              trackColor={{ false: lilacTint.border, true: lilacTint.accent }}
              disabled={!pinEnabled || !biometricAvailable}
              style={{ marginTop: 2, opacity: biometricAvailable ? 1 : 0.5 }}
            />
          </View>
        </Card>
      </PopIn>

      <PopIn index={1}>
        <Card style={styles.card}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>Auto-Lock Timeout</Text>
        <Text style={[styles.sectionDesc, { color: colors.text.secondary }]}>
          Require passcode after app remains inactive
        </Text>
        <View style={styles.autoLockOptions}>
          {[0, 1, 5, 15, 30].map((minutes) => {
            const isSelected = autoLockMinutes === minutes;
            return (
              <TouchableOpacity
                key={minutes}
                onPress={() => handleAutoLockChange(minutes)}
                style={[
                  styles.autoLockButton,
                  { backgroundColor: colors.surface.default, borderColor: colors.border.default },
                  isSelected && { backgroundColor: colors.primary.default, borderColor: colors.primary.default },
                ]}
              >
                <Text
                  style={[
                    styles.autoLockButtonText,
                    { color: colors.text.primary },
                    isSelected && { color: '#FFFFFF', fontWeight: '700' },
                  ]}
                >
                  {minutes === 0 ? 'Immediately' : `${minutes} min`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      </PopIn>

      <PopIn index={2}>
        <Card style={styles.card}>
        <View style={styles.switcherRow}>
          <View style={styles.switcherInfo}>
            <View style={[styles.lockIcon, { backgroundColor: colors.accents.peach + '18' }]}>
              <Ionicons name="eye-off-outline" size={20} color={colors.accents.peach} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.lockOptionLabel, { color: colors.text.primary }]}>Hide in App Switcher</Text>
              <Text style={[styles.lockOptionDesc, { color: colors.text.tertiary }]}>
                Obscure app preview screen when switching tasks
              </Text>
            </View>
          </View>
          <Switch
            value={hideInSwitcher}
            onValueChange={handleSwitcherToggle}
            thumbColor="#FFFFFF"
            trackColor={{ false: colors.border.default, true: colors.primary.default }}
            style={{ marginTop: 2 }}
          />
        </View>
        </Card>
      </PopIn>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110, gap: 16 },
  card: { padding: 18, borderRadius: 20, gap: 14 },
  sectionTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  sectionDesc: { fontSize: 14, lineHeight: 20 },
  lockOption: { gap: 12 },
  lockOptionDivider: { paddingTop: 14, borderTopWidth: 1, marginTop: 4, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  lockOptionInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1 },
  lockIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  lockOptionText: { flex: 1, gap: 3 },
  lockOptionLabel: { fontSize: 15, fontWeight: '600', lineHeight: 22 },
  lockOptionDesc: { fontSize: 12, lineHeight: 16 },
  lockOptionActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  setupButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  setupButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
  changeButton: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1 },
  changeButtonText: { fontSize: 13, fontWeight: '600' },
  removeButton: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, borderWidth: 1 },
  removeButtonText: { fontSize: 13, fontWeight: '600' },
  autoLockOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  autoLockButton: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  autoLockButtonText: { fontSize: 13, fontWeight: '600' },
  switcherRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  switcherInfo: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, flex: 1, paddingRight: 8 },
});