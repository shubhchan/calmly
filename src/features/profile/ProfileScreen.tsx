import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Alert } from '../../services/appAlert';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged, type User } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { format } from 'date-fns';
import {
  AppText,
  BottomSheet,
  Button,
  Card,
  CardContent,
  InlineAlert,
  ScreenHeader,
  TactilePressable,
  TextInput,
} from '../../components';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ProfileAvatarView } from '../../components/profile/ProfileAvatarView';
import { ZEN_MASCOTS, ZenMascotAvatar } from '../../components/profile/ZenMascotAvatar';
import { useAppTheme } from '../../theme/ThemeContext';
import { settingsRepository, type AppSettings } from '../../database/repositories/settingsRepository';
import { journalRepository } from '../../database/repositories/journalRepository';
import { moodRepository } from '../../database/repositories/moodRepository';
import { calmRepository } from '../../database/repositories/calmRepository';
import { getCalmlyAuth, loginWithGoogle, logoutCloud } from '../../services/calmlyAuth';
import { persistProfileImage } from '../../utils/avatarStorage';
import { hapticFeedback } from '../../utils/haptics';
import type { AvatarMascotId, ProfileAvatar } from '../../types/profile';

const SHEET_NONE = 'none';
const SHEET_OPTIONS = 'options';
const SHEET_MASCOTS = 'mascots';

type SheetMode = typeof SHEET_NONE | typeof SHEET_OPTIONS | typeof SHEET_MASCOTS;

interface SanctuaryStats {
  days: number;
  reflections: number;
  mindfulMinutes: number;
  streak: number;
}

const EMPTY_STATS: SanctuaryStats = { days: 1, reflections: 0, mindfulMinutes: 0, streak: 0 };

function computeStreak(timestamps: number[]): number {
  const days = new Set(
    timestamps.filter((timestamp) => Number.isFinite(timestamp)).map((timestamp) => new Date(timestamp).toDateString())
  );
  const cursor = new Date();
  if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useAppTheme();

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [name, setName] = useState('');
  const [mantra, setMantra] = useState('');
  const [bio, setBio] = useState('');
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [sheet, setSheet] = useState<SheetMode>(SHEET_NONE);
  const [busy, setBusy] = useState('');
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [stats, setStats] = useState<SanctuaryStats>(EMPTY_STATS);

  const loadProfile = useCallback(async () => {
    try {
      let loaded = await settingsRepository.getSettings();
      if (!loaded.firstUseAt) {
        const firstUseAt = Date.now();
        loaded = { ...loaded, firstUseAt };
        settingsRepository.updateSettings({ firstUseAt }).catch((error) => {
          console.warn('Could not persist first use date:', error);
        });
      }
      setSettings(loaded);
      setName(loaded.userName ?? '');
      setMantra(loaded.userMantra ?? '');
      setBio(loaded.userBio ?? '');

      const now = Date.now();
      const [journals, moods, calmSessions, breathingSessions] = await Promise.all([
        journalRepository.getAll().catch(() => []),
        moodRepository.getAll().catch(() => []),
        calmRepository.getSessionsByDateRange(0, now).catch(() => []),
        calmRepository.getBreathingSessions(0, now).catch(() => []),
      ]);

      const sessions = [...calmSessions, ...breathingSessions];
      const mindfulSeconds = sessions.reduce((sum: number, session: any) => sum + (session?.duration || 0), 0);
      const timestamps = [
        ...(journals as any[]).map((entry) => entry?.createdAt),
        ...(moods as any[]).map((entry) => entry?.createdAt),
        ...sessions.map((session: any) => session?.createdAt),
      ];

      setStats({
        days: Math.max(1, Math.floor((now - (loaded.firstUseAt ?? now)) / 86400000) + 1),
        reflections: journals.length,
        mindfulMinutes: Math.round(mindfulSeconds / 60),
        streak: computeStreak(timestamps),
      });
    } catch (error) {
      console.warn('Could not load profile:', error);
      setStats(EMPTY_STATS);
    }
  }, []);

  useEffect(() => {
    const auth = getCalmlyAuth();
    if (!auth) return;
    return onAuthStateChanged(auth, setAuthUser);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  const applyAvatar = async (avatar: ProfileAvatar) => {
    await settingsRepository.updateSettings({ userAvatar: avatar });
    setSettings((current) => (current ? { ...current, userAvatar: avatar } : current));
    setSheet(SHEET_NONE);
    hapticFeedback.success();
  };

  const savePickedImage = async (asset: ImagePicker.ImagePickerAsset) => {
    setBusy('Saving photo');
    try {
      const uri = await persistProfileImage(asset.uri, asset.fileName);
      await applyAvatar({ kind: 'custom', uri });
    } catch (error) {
      Alert.alert('Photo not saved', error instanceof Error ? error.message : 'Could not save this photo.');
    } finally {
      setBusy('');
    }
  };

  const pickFromGallery = async () => {
    setSheet(SHEET_NONE);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Photo access needed', 'Allow photo access to choose a profile picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.[0]) await savePickedImage(result.assets[0]);
    } catch (error) {
      Alert.alert('Photo not selected', error instanceof Error ? error.message : 'Could not open your photo library.');
    }
  };

  const takePhoto = async () => {
    setSheet(SHEET_NONE);
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Camera access needed', 'Allow camera access to take a profile picture.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
        cameraType: ImagePicker.CameraType.front,
      });
      if (!result.canceled && result.assets?.[0]) await savePickedImage(result.assets[0]);
    } catch (error) {
      Alert.alert('Camera unavailable', error instanceof Error ? error.message : 'Could not open the camera.');
    }
  };

  const chooseMascot = async (mascotId: AvatarMascotId) => {
    try {
      await applyAvatar({ kind: 'mascot', mascotId });
    } catch (error) {
      Alert.alert('Mascot not saved', error instanceof Error ? error.message : 'Could not save this mascot.');
    }
  };

  const resetToGooglePhoto = async () => {
    if (!settings?.googlePhotoUrl) {
      Alert.alert('No Google photo yet', 'Connect a Google account with a profile photo, then try again.');
      return;
    }
    try {
      await applyAvatar({ kind: 'google' });
    } catch (error) {
      Alert.alert('Photo not reset', error instanceof Error ? error.message : 'Could not reset your photo.');
    }
  };

  const saveIdentity = async () => {
    setSavingIdentity(true);
    setSavedMessage('');
    try {
      const trimmedName = name.trim();
      const trimmedMantra = mantra.trim();
      const trimmedBio = bio.trim();
      await settingsRepository.updateSettings({
        userName: trimmedName,
        userMantra: trimmedMantra,
        userBio: trimmedBio,
      });
      setSettings((current) =>
        current ? { ...current, userName: trimmedName, userMantra: trimmedMantra, userBio: trimmedBio } : current
      );
      setSavedMessage('Profile details saved');
      hapticFeedback.success();
    } catch (error) {
      Alert.alert('Not saved', error instanceof Error ? error.message : 'Could not save your profile details.');
    } finally {
      setSavingIdentity(false);
    }
  };

  const connectGoogle = async () => {
    setBusy('Connecting Google');
    try {
      const user = await loginWithGoogle();
      setAuthUser(user);
      await loadProfile();
      hapticFeedback.success();
      Alert.alert('Google connected', `Signed in as ${user.email || 'your Google account'}.`);
    } catch (error) {
      Alert.alert('Google sign-in', error instanceof Error ? error.message : 'Could not connect your Google account.');
    } finally {
      setBusy('');
    }
  };

  const signOut = () => {
    Alert.alert('Sign out of Google?', 'Your reflections stay on this device. Drive backups already created are kept.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          setBusy('Signing out');
          try {
            await logoutCloud();
            setAuthUser(null);
            await loadProfile();
            hapticFeedback.medium();
          } catch (error) {
            Alert.alert('Could not sign out', error instanceof Error ? error.message : 'Please try again.');
          } finally {
            setBusy('');
          }
        },
      },
    ]);
  };

  const switchAccount = () => {
    Alert.alert('Switch Google account?', 'Calmly will sign out of the current account and ask you to choose another.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Switch',
        onPress: async () => {
          setBusy('Switching account');
          try {
            await logoutCloud();
            setAuthUser(null);
            const user = await loginWithGoogle();
            setAuthUser(user);
            await loadProfile();
            hapticFeedback.success();
          } catch (error) {
            Alert.alert('Could not switch account', error instanceof Error ? error.message : 'Please try again.');
          } finally {
            setBusy('');
          }
        },
      },
    ]);
  };

  const displayName = name.trim() || settings?.googleDisplayName || 'A quiet friend';
  const isConnected = !!authUser;

  return (
    <ScreenContainer
      contentContainerStyle={styles.content}
      backgroundColor={colors.background.default}
      bottomPadding={130}
    >
      <ScreenHeader title="Your profile" subtitle="A quiet space that is yours" />

      {busy && sheet === SHEET_NONE ? <InlineAlert tone="info" message={`${busy}…`} /> : null}

      <Card variant="elevated" tone="cream">
        <CardContent style={styles.heroContent}>
          <View>
            <ProfileAvatarView
              avatar={settings?.userAvatar}
              googlePhotoUrl={settings?.googlePhotoUrl}
              size={108}
              showGuestBadge={!isConnected && !settings?.googlePhotoUrl}
            />
            <TactilePressable
              onPress={() => setSheet(SHEET_OPTIONS)}
              accessibilityRole="button"
              accessibilityLabel="Edit profile photo"
              hapticStyle="selection"
              style={[
                styles.cameraBadge,
                { backgroundColor: colors.primary.default, borderColor: colors.surface.default },
              ]}
            >
              <Ionicons name="camera" size={18} color={colors.primary.foreground} />
            </TactilePressable>
          </View>
          <AppText variant="h3" style={{ marginTop: 12 }}>
            {displayName}
          </AppText>
          <AppText variant="bodySmall" tone="secondary" center>
            {settings?.userMantra || 'Taking it one breath at a time'}
          </AppText>
          {settings?.userBio ? (
            <AppText variant="caption" tone="tertiary" center style={{ marginTop: 2 }}>
              {settings.userBio}
            </AppText>
          ) : null}
          <Button
            title="Edit photo"
            variant="secondary"
            size="sm"
            onPress={() => setSheet(SHEET_OPTIONS)}
            style={{ marginTop: 12 }}
          />
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent style={styles.sectionContent}>
          <SectionTitle icon="person-outline" title="Your identity" />
          <TextInput
            label="Display name"
            value={name}
            onChangeText={setName}
            placeholder="What should we call you?"
            maxLength={40}
            autoCapitalize="words"
          />
          <TextInput
            label="Calm mantra"
            value={mantra}
            onChangeText={setMantra}
            placeholder="Taking it one breath at a time"
            maxLength={90}
          />
          <TextInput
            label="About you"
            value={bio}
            onChangeText={setBio}
            placeholder="A line or two about what matters to you"
            maxLength={160}
            multiline
          />
          <Button title="Save details" onPress={saveIdentity} loading={savingIdentity} fullWidth />
          {savedMessage ? (
            <AppText variant="caption" tone="success">
              {savedMessage}
            </AppText>
          ) : null}
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent style={styles.sectionContent}>
          <SectionTitle icon="logo-google" title="Google account" />
          {isConnected ? (
            <>
              <View style={styles.googleIdentityRow}>
                <ProfileAvatarView
                  avatar={{ kind: 'google' }}
                  googlePhotoUrl={settings?.googlePhotoUrl}
                  size={46}
                />
                <View style={{ flex: 1 }}>
                  <AppText variant="label">
                    {authUser?.displayName || settings?.googleDisplayName || 'Google account'}
                  </AppText>
                  <AppText variant="caption" tone="tertiary">
                    {authUser?.email || settings?.googleEmail || authUser?.uid}
                  </AppText>
                </View>
                <View style={[styles.connectedChip, { backgroundColor: colors.status.success.subtle }]}>
                  <AppText variant="caption" tone="success">
                    Connected
                  </AppText>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="cloud-done-outline" size={18} color={colors.primary.default} />
                <AppText variant="bodySmall" tone="secondary">
                  {settings?.lastDriveSyncAt
                    ? `Last backup ${format(new Date(settings.lastDriveSyncAt), 'MMM d, h:mm a')}`
                    : 'No encrypted backup yet'}
                </AppText>
              </View>

              <AppText variant="caption" tone="tertiary">
                Backups are encrypted on this device and stored in a Calmly Backups folder in your Drive.
              </AppText>

              <Button
                title="Manage Drive backups"
                variant="secondary"
                fullWidth
                onPress={() => navigation.navigate('CloudStorage')}
                leftIcon={(color, size) => <Ionicons name="cloud-upload-outline" size={size} color={color} />}
              />
              <View style={styles.googleActions}>
                <Button title="Switch account" variant="outline" size="sm" onPress={switchAccount} style={{ flex: 1 }} />
                <Button title="Sign out" variant="ghost" size="sm" onPress={signOut} style={{ flex: 1 }} />
              </View>
            </>
          ) : (
            <>
              <AppText variant="bodySmall" tone="secondary">
                Connect Google to use your account photo and encrypted Drive backups. Your local reflections stay on this
                device unless you choose to back them up.
              </AppText>
              <Button
                title="Connect Google account"
                onPress={connectGoogle}
                loading={busy === 'Connecting Google'}
                fullWidth
                leftIcon={(color, size) => <Ionicons name="logo-google" size={size} color={color} />}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent style={styles.sectionContent}>
          <SectionTitle icon="stats-chart-outline" title="Your sanctuary" />
          <View style={styles.statsGrid}>
            <StatTile icon="calendar-outline" value={`${stats.days}`} label="Days in Calmly" />
            <StatTile icon="book-outline" value={`${stats.reflections}`} label="Reflections" />
            <StatTile icon="leaf-outline" value={`${stats.mindfulMinutes}`} label="Mindful minutes" />
            <StatTile icon="flame-outline" value={`${stats.streak}`} label="Day streak" />
          </View>
        </CardContent>
      </Card>

      <BottomSheet
        visible={sheet === SHEET_OPTIONS}
        onClose={() => setSheet(SHEET_NONE)}
        title="Update your photo"
        subtitle="A face, a mascot, or a little of both."
      >
        <View style={styles.sheetList}>
          {busy ? (
            <View style={styles.busyRow}>
              <ActivityIndicator size="small" color={colors.primary.default} />
              <AppText variant="bodySmall" tone="secondary">
                {busy}…
              </AppText>
            </View>
          ) : null}
          <SheetAction
            icon="images-outline"
            title="Choose from gallery"
            subtitle="Pick a photo already on your device"
            onPress={pickFromGallery}
          />
          <SheetAction
            icon="camera-outline"
            title="Take a photo"
            subtitle="Use the front camera and crop to a circle"
            onPress={takePhoto}
          />
          <SheetAction
            icon="flower-outline"
            title="Pick a zen mascot"
            subtitle="Twelve hand-drawn companions"
            onPress={() => setSheet(SHEET_MASCOTS)}
          />
          {settings?.googlePhotoUrl ? (
            <SheetAction
              icon="logo-google"
              title="Reset to Google photo"
              subtitle="Use the picture from your connected account"
              onPress={resetToGooglePhoto}
            />
          ) : null}
        </View>
      </BottomSheet>

      <BottomSheet
        visible={sheet === SHEET_MASCOTS}
        onClose={() => setSheet(SHEET_NONE)}
        title="Choose a zen mascot"
        subtitle="A small companion for your sanctuary."
      >
        <View style={styles.mascotGrid}>
          {ZEN_MASCOTS.map((mascot) => {
            const selected =
              settings?.userAvatar?.kind === 'mascot' && settings.userAvatar.mascotId === mascot.id;
            return (
              <TactilePressable
                key={mascot.id}
                onPress={() => chooseMascot(mascot.id)}
                hapticStyle="selection"
                accessibilityRole="button"
                accessibilityLabel={`Choose ${mascot.label}`}
                style={[
                  styles.mascotTile,
                  {
                    backgroundColor: colors.surface.default,
                    borderColor: selected ? colors.primary.default : colors.border.default,
                    borderWidth: selected ? 2 : 1,
                  },
                ]}
              >
                <ZenMascotAvatar id={mascot.id} size={62} />
                <AppText variant="caption" center numberOfLines={2} style={{ marginTop: 6 }}>
                  {mascot.label}
                </AppText>
                {selected ? (
                  <View style={[styles.mascotCheck, { backgroundColor: colors.primary.default }]}>
                    <Ionicons name="checkmark" size={12} color={colors.primary.foreground} />
                  </View>
                ) : null}
              </TactilePressable>
            );
          })}
        </View>
      </BottomSheet>
    </ScreenContainer>
  );
}

function SectionTitle({ icon, title }: { icon: React.ComponentProps<typeof Ionicons>['name']; title: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.sectionTitleRow}>
      <View style={[styles.sectionIcon, { backgroundColor: colors.primary.subtle }]}>
        <Ionicons name={icon} size={18} color={colors.primary.default} />
      </View>
      <AppText variant="h3">{title}</AppText>
    </View>
  );
}

function SheetAction({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <TactilePressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[styles.sheetAction, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}
    >
      <View style={[styles.sheetActionIcon, { backgroundColor: colors.primary.subtle }]}>
        <Ionicons name={icon} size={20} color={colors.primary.default} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="label">{title}</AppText>
        <AppText variant="caption" tone="tertiary">
          {subtitle}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
    </TactilePressable>
  );
}

function StatTile({
  icon,
  value,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  value: string;
  label: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.statTile, { backgroundColor: colors.surface.muted, borderColor: colors.border.default }]}>
      <Ionicons name={icon} size={18} color={colors.primary.default} />
      <AppText variant="h3" style={{ marginTop: 4 }}>
        {value}
      </AppText>
      <AppText variant="caption" tone="tertiary">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 8, gap: 16 },
  heroContent: { alignItems: 'center', paddingVertical: 26 },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionContent: { gap: 14 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  googleIdentityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  connectedChip: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  googleActions: { flexDirection: 'row', gap: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statTile: {
    flexBasis: '47%',
    flexGrow: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  sheetList: { gap: 10 },
  busyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 2 },
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  sheetActionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  mascotGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  mascotTile: {
    width: '31%',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mascotCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
