import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { appLockService } from '../../services/appLock';
import { useAppTheme } from '../../theme/ThemeContext';
import { AppText, TactilePressable } from '../../components';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { motion, useAppReducedMotion } from '../../theme/motion';

export function AppLockScreen({ onUnlocked }: { onUnlocked?: () => void }) {
  const { colors } = useAppTheme();
  const { height } = useWindowDimensions();
  const reducedMotion = useAppReducedMotion();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const autoPrompted = useRef(false);
  const inFlight = useRef(false);
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const unlockWithBiometric = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try { if (await appLockService.unlockWithBiometric()) onUnlocked?.(); }
    finally { inFlight.current = false; setBusy(false); }
  }, [onUnlocked]);

  useEffect(() => {
    let active = true;
    const setup = async () => {
      try {
        const auth = require('expo-local-authentication');
        const settings = await require('../../database/repositories/settingsRepository').settingsRepository.getSettings();
        const available = !!settings?.biometricEnabled && await auth.hasHardwareAsync() && await auth.isEnrolledAsync();
        if (!active) return;
        setBiometricAvailable(available);
        if (available && !autoPrompted.current) {
          autoPrompted.current = true;
          await unlockWithBiometric();
        }
      } catch { if (active) setBiometricAvailable(false); }
    };
    void setup();
    // Disable hardware back while the vault is locked.
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => { active = false; sub.remove(); };
  }, [unlockWithBiometric]);

  const verify = async (candidate: string) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    try {
      if (await appLockService.unlockWithPin(candidate)) { onUnlocked?.(); return; }
      setError(true);
      setPin('');
      if (!reducedMotion) shake.value = withSequence(withTiming(-9, { duration: motion.duration.instant }), withTiming(9, { duration: motion.duration.instant }), withTiming(0, { duration: motion.duration.instant }));
      try { const h = require('expo-haptics'); void h.notificationAsync(h.NotificationFeedbackType.Error); } catch {}
    } catch { setError(true); setPin(''); }
    finally { inFlight.current = false; setBusy(false); }
  };
  const pressKey = (key: string) => {
    if (busy) return;
    if (key === 'delete') { setPin(v => v.slice(0, -1)); setError(false); return; }
    const next = (pin + key).slice(0, 6);
    setPin(next); setError(false);
    if (next.length === 6) void verify(next);
  };

  return <ScreenContainer scroll={false} animate={false} backgroundColor={colors.background.default}>
    <View style={[styles.layout, { paddingTop: height < 700 ? 18 : 46 }]}>
      <View style={styles.header}>
        <View style={[styles.iconOuter, { backgroundColor: colors.primary.default + '14', borderColor: colors.primary.default + '24' }]}>
          <View style={[styles.iconInner, { backgroundColor: colors.primary.default + '20' }]}><Ionicons name="lock-closed-outline" size={30} color={colors.primary.default} /></View>
        </View>
        <AppText variant="overline" tone="secondary">PRIVATE SANCTUARY</AppText>
        <AppText variant="h1" center>Welcome back</AppText>
        <AppText tone="secondary" center>Enter your six-digit PIN to return to your space.</AppText>
      </View>
      <Animated.View style={[styles.dots, shakeStyle]} accessibilityLabel={`${pin.length} of 6 PIN digits entered`}>
        {Array.from({ length: 6 }, (_, i) => <View key={i} style={[styles.dot, { borderColor: error ? colors.status.error.default : colors.primary.default, backgroundColor: i < pin.length ? (error ? colors.status.error.default : colors.primary.default) : 'transparent' }]} />)}
      </Animated.View>
      <AppText variant="bodySmall" center color={error ? colors.status.error.default : colors.text.tertiary}>{error ? 'That PIN did not match. Try again.' : busy ? 'Checking your PIN…' : 'Your entries stay private on this device'}</AppText>
      <View style={[styles.keypad, { maxWidth: 312 }]}>
        {['1','2','3','4','5','6','7','8','9','bio','0','delete'].map(key => {
          if (key === 'bio' && !biometricAvailable) return <View key={key} style={styles.key} />;
          return <TactilePressable key={key} accessibilityRole="button" accessibilityLabel={key === 'delete' ? 'Delete last digit' : key === 'bio' ? 'Unlock using biometrics' : `Digit ${key}`} disabled={busy} onPress={() => key === 'bio' ? void unlockWithBiometric() : pressKey(key)} style={[styles.key, { backgroundColor: key === 'delete' || key === 'bio' ? 'transparent' : colors.surface.default, borderColor: key === 'delete' || key === 'bio' ? 'transparent' : colors.border.default }]}>
            {key === 'delete' || key === 'bio' ? <Ionicons name={key === 'delete' ? 'backspace-outline' : 'finger-print'} size={25} color={key === 'bio' ? colors.primary.default : colors.text.secondary} /> : <AppText variant="h2">{key}</AppText>}
          </TactilePressable>;
        })}
      </View>
      <View style={styles.footer}><Ionicons name="shield-checkmark-outline" color={colors.text.tertiary} size={17}/><AppText variant="caption" tone="tertiary">A peaceful space, protected by you.</AppText></View>
    </View>
  </ScreenContainer>;
}
const styles = StyleSheet.create({
  layout: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingBottom: 30, paddingHorizontal: 22 },
  header: { alignItems: 'center', gap: 10, maxWidth: 330 },
  iconOuter: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  iconInner: { width: 66, height: 66, borderRadius: 33, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 15, paddingVertical: 7 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5 },
  keypad: { width: '100%', flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 10 },
  key: { width: '30%', height: 62, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  footer: { flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' },
});
