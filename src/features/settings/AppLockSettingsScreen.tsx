import React, { useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Switch, Platform } from 'react-native';
import { Alert } from '../../services/appAlert';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import { settingsRepository } from '../../database/repositories/settingsRepository';
import { appLockService } from '../../services/appLock';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAppTheme } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AppText, Button, ScreenHeader, TactilePressable } from '../../components';
import { PopIn } from '../../components/interactive/PopIn';
import { BrandedLoader } from '../../components/interactive/LoadingState';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'AppLockSettings'>['navigation'];

const AUTO_LOCK_OPTIONS = [0, 1, 5, 15, 30];

/**
 * App lock and security — one method, one timeout, one privacy switch.
 *
 * The page reads as sections of hairline rows, not a stack of coloured boxes.
 * Anything destructive is quiet until you reach it.
 */
export function AppLockSettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useAppTheme();
  const [pinEnabled, setPinEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [autoLockMinutes, setAutoLockMinutes] = useState(5);
  const [hideInSwitcher, setHideInSwitcher] = useState(true);
  const [allowScreenshots, setAllowScreenshots] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const available = (await LocalAuthentication?.hasHardwareAsync?.()) ?? false;
      const enrolled = (await LocalAuthentication?.isEnrolledAsync?.()) ?? false;
      setBiometricAvailable(available && enrolled);

      const settings = (await settingsRepository?.getSettings?.()) ?? {};
      setPinEnabled(settings?.pinEnabled ?? false);
      setBiometricEnabled(settings?.biometricEnabled ?? false);
      setAutoLockMinutes(settings?.autoLockMinutes ?? 5);
      setHideInSwitcher(settings?.hideContentInSwitcher ?? true);
      setAllowScreenshots(settings?.allowScreenshots ?? true);
    } catch (error) {
      console.error('Failed to load app lock settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const firstFocusRef = useRef(true);
  useFocusEffect(
    useCallback(() => {
      const silent = !firstFocusRef.current;
      firstFocusRef.current = false;
      loadSettings(silent);
    }, [loadSettings])
  );

  const handlePinToggle = async (enabled: boolean) => {
    try {
      if (enabled && !pinEnabled) {
        (navigation as any)?.navigate?.('SetPin');
      } else if (!enabled && pinEnabled) {
        await settingsRepository?.removePin?.();
        setPinEnabled(false);
        if (biometricEnabled) {
          await settingsRepository?.updateSettings?.({ biometricEnabled: false });
          setBiometricEnabled(false);
        }
        appLockService?.refresh?.();
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
      appLockService?.refresh?.();
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

  const authenticateChange = async (): Promise<boolean> => {
    // Privacy switches are protected by the device lock when app lock is on.
    if (!pinEnabled && !biometricEnabled) return true;
    try {
      const available = (await LocalAuthentication?.hasHardwareAsync?.()) ?? false;
      const enrolled = (await LocalAuthentication?.isEnrolledAsync?.()) ?? false;
      if (!available || !enrolled) return true;
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm security setting change',
        fallbackLabel: 'Use passcode',
        cancelLabel: 'Cancel',
      });
      return result.success;
    } catch {
      return true;
    }
  };

  const handleSwitcherToggle = async (enabled: boolean) => {
    try {
      if (!(await authenticateChange())) return;
      setHideInSwitcher(enabled ?? true);
      await settingsRepository?.updateSettings?.({ hideContentInSwitcher: enabled ?? true });
      await appLockService?.setScreenProtection?.({ allowScreenshots, hideInSwitcher: enabled ?? true });
    } catch (error) {
      console.error('Failed to toggle switcher:', error);
    }
  };

  const handleScreenshotToggle = async (enabled: boolean) => {
    try {
      if (!(await authenticateChange())) return;
      setAllowScreenshots(enabled ?? true);
      await settingsRepository?.updateSettings?.({ allowScreenshots: enabled ?? true });
      await appLockService?.setScreenProtection?.({ allowScreenshots: enabled ?? true, hideInSwitcher });
    } catch (error) {
      console.error('Failed to toggle screenshots:', error);
    }
  };

  const handleChangePin = () => {
    (navigation as any)?.navigate?.('SetPin');
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
            appLockService?.refresh?.();
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

  const privacySwitch = Platform.OS === 'ios'
    ? {
        label: 'Hide in app switcher',
        desc: 'Blur the preview when switching tasks. Confirmation is required to change this.',
        icon: 'eye-off-outline' as const,
        value: hideInSwitcher,
        onChange: handleSwitcherToggle,
      }
    : {
        label: 'Allow screenshots',
        desc: "Let you capture the screen. When off, screenshots and the app-switcher preview are blocked.",
        icon: 'camera-outline' as const,
        value: allowScreenshots,
        onChange: handleScreenshotToggle,
      };

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <ScreenHeader title="App lock & security" />

      <PopIn index={0}>
        <View style={{ marginTop: 8 }}>
          <AppText variant="overline" tone="tertiary">
            Lock method
          </AppText>

          <View style={[styles.row, { borderBottomColor: colors.border.default }]}>
            <View style={[styles.iconPlate, { backgroundColor: colors.primary.subtle }]}>
              <Ionicons name="lock-closed-outline" size={19} color={colors.primary.default} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="body">PIN protection</AppText>
              <AppText variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
                {pinEnabled ? 'Six digits required on opening' : 'Set a private six-digit PIN'}
              </AppText>
              {pinEnabled ? (
                <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
                  <TactilePressable onPress={handleChangePin} accessibilityRole="button" accessibilityLabel="Change PIN">
                    <AppText variant="caption" tone="link">
                      Change PIN
                    </AppText>
                  </TactilePressable>
                  <TactilePressable onPress={handleRemovePin} accessibilityRole="button" accessibilityLabel="Remove PIN">
                    <AppText variant="caption" tone="error">
                      Remove
                    </AppText>
                  </TactilePressable>
                </View>
              ) : (
                <Button
                  title="Set up PIN"
                  variant="secondary"
                  size="sm"
                  onPress={() => handlePinToggle(true)}
                  style={{ alignSelf: 'flex-start', marginTop: 10 }}
                />
              )}
            </View>
          </View>

          <View style={[styles.row, { borderBottomColor: colors.border.default, opacity: biometricAvailable ? 1 : 0.6 }]}>
            <View style={[styles.iconPlate, { backgroundColor: colors.surface.muted }]}>
              <Ionicons name="finger-print-outline" size={19} color={colors.text.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="body">Biometric unlock</AppText>
              <AppText variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
                {!biometricAvailable
                  ? 'Not available on this device'
                  : !pinEnabled
                    ? 'Set a PIN first to enable biometrics'
                    : biometricEnabled
                      ? 'Biometrics active'
                      : 'Unlock with Face ID or a fingerprint'}
              </AppText>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              thumbColor={colors.primary.foreground}
              trackColor={{ false: colors.border.strong, true: colors.primary.default }}
              disabled={!pinEnabled || !biometricAvailable}
            />
          </View>
        </View>
      </PopIn>

      <PopIn index={1}>
        <View style={{ marginTop: 32 }}>
          <AppText variant="overline" tone="tertiary">
            Auto-lock
          </AppText>
          <AppText variant="bodySmall" tone="secondary" style={{ marginTop: 4 }}>
            Require the passcode after the app stays inactive.
          </AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {AUTO_LOCK_OPTIONS.map((minutes) => {
              const isSelected = autoLockMinutes === minutes;
              return (
                <TactilePressable
                  key={minutes}
                  onPress={() => handleAutoLockChange(minutes)}
                  scaleDownTo={0.95}
                  hapticStyle="selection"
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  style={{
                    paddingHorizontal: 15,
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor: isSelected ? colors.primary.default : colors.surface.muted,
                  }}
                >
                  <AppText variant="caption" tone={isSelected ? 'onPrimary' : 'secondary'}>
                    {minutes === 0 ? 'Immediately' : `${minutes} min`}
                  </AppText>
                </TactilePressable>
              );
            })}
          </View>
        </View>
      </PopIn>

      <PopIn index={2}>
        <View style={{ marginTop: 32 }}>
          <AppText variant="overline" tone="tertiary">
            Privacy
          </AppText>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={[styles.iconPlate, { backgroundColor: colors.surface.muted }]}>
              <Ionicons name={privacySwitch.icon} size={19} color={colors.text.secondary} />
            </View>
            <View style={{ flex: 1, paddingRight: 8 }}>
              <AppText variant="body">{privacySwitch.label}</AppText>
              <AppText variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
                {privacySwitch.desc}
              </AppText>
            </View>
            <Switch
              value={privacySwitch.value}
              onValueChange={privacySwitch.onChange}
              thumbColor={colors.primary.foreground}
              trackColor={{ false: colors.border.strong, true: colors.primary.default }}
            />
          </View>
        </View>
      </PopIn>

      <PopIn index={3}>
        <AppText variant="caption" tone="tertiary" style={{ marginTop: 28, lineHeight: 18 }}>
          Your PIN and privacy settings stay on this device. They are never uploaded.
        </AppText>
      </PopIn>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 56 },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconPlate: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
});
