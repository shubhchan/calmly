import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput as NativeTextInput,
  View,
} from 'react-native';
import { Alert } from '../../services/appAlert';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged, type User } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { format } from 'date-fns';
import {
  AppText,
  BottomSheet,
  InlineAlert,
  TactilePressable,
} from '../../components';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { mascotById, ZEN_MASCOTS, ZenMascotAvatar } from '../../components/profile/ZenMascotAvatar';
import { useAppTheme } from '../../theme/ThemeContext';
import { settingsRepository, type AppSettings } from '../../database/repositories/settingsRepository';
import { getCalmlyAuth, loginWithGoogle, logoutCloud } from '../../services/calmlyAuth';
import { persistProfileImage } from '../../utils/avatarStorage';
import { hapticFeedback } from '../../utils/haptics';
import { displayFaces } from '../../theme/typography';
import type { AvatarMascotId, ProfileAvatar } from '../../types/profile';

const SHEET_NONE = 'none';
const SHEET_OPTIONS = 'options';
const SHEET_MASCOTS = 'mascots';

type SheetMode = typeof SHEET_NONE | typeof SHEET_OPTIONS | typeof SHEET_MASCOTS;

const QUICK_MASCOTS: { id: AvatarMascotId; label: string }[] = [
  { id: 'panda', label: 'Crane' },
  { id: 'bonsai', label: 'Bonsai' },
  { id: 'lotus', label: 'Lotus' },
  { id: 'pebble', label: 'Stone' },
  { id: 'koi', label: 'Wave' },
];

/**
 * Your profile — follows Doop `Profile — A · Edit identity` (frame tOFThuXUAM) 1:1.
 *
 * Quiet ground #F4F5F1, modular white cards with 20px radius, 80x80 identity avatar
 * with quick Zen mascot chips, structured identity fields, and cloud backup account card.
 */
export function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useAppTheme();
  const styles = useProfileStyles();

  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [name, setName] = useState('');
  const [mantra, setMantra] = useState('');
  const [bio, setBio] = useState('');
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [sheet, setSheet] = useState<SheetMode>(SHEET_NONE);
  const [busy, setBusy] = useState('');
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [showCloudDetails, setShowCloudDetails] = useState(false);

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
    } catch (error) {
      console.warn('Could not load profile:', error);
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
      setSavedMessage('Identity saved');
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

  const displayName = name.trim() || settings?.googleDisplayName || 'Shubby';
  const initialLetter = displayName.charAt(0).toUpperCase() || 'S';
  const isConnected = !!authUser;
  const connectedEmail = authUser?.email || settings?.googleEmail || '';

  const photoUri =
    settings?.userAvatar?.kind === 'custom'
      ? settings.userAvatar.uri
      : settings?.userAvatar?.kind === 'google'
      ? settings?.googlePhotoUrl
      : undefined;

  const activeMascotId =
    settings?.userAvatar?.kind === 'mascot' ? settings.userAvatar.mascotId : undefined;
  const activeMascot = activeMascotId ? mascotById(activeMascotId) : undefined;

  return (
    <ScreenContainer
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 10, paddingBottom: 60 }}
      backgroundColor={colors.background.default}
    >
      {/* Inner page top bar — 1:1 match with Doop tOFThuXUAM */}
      <View style={styles.topBar}>
        <TactilePressable
          onPress={() => navigation?.goBack?.()}
          scaleDownTo={0.92}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back to Me"
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={20} color={colors.text.secondary} />
          <Text style={styles.backText}>Me</Text>
        </TactilePressable>

        <Text style={styles.pageTitle}>Your profile</Text>

        <TactilePressable
          onPress={saveIdentity}
          disabled={savingIdentity}
          scaleDownTo={0.92}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Save profile"
          style={styles.saveHeaderButton}
        >
          {savingIdentity ? (
            <ActivityIndicator size="small" color={colors.primary.default} />
          ) : (
            <Text style={styles.saveHeaderText}>Save</Text>
          )}
        </TactilePressable>
      </View>

      {/* Title & subtitle */}
      <View style={styles.headerBlock}>
        <Text style={styles.heroTitle}>Your quiet space</Text>
        <Text style={styles.heroSubtitle}>
          A place for who you are today. Nothing is shared.
        </Text>
      </View>

      {busy && sheet === SHEET_NONE ? (
        <InlineAlert tone="info" message={`${busy}…`} style={{ marginTop: 14 }} />
      ) : null}

      {savedMessage ? (
        <InlineAlert tone="success" message={savedMessage} style={{ marginTop: 14 }} />
      ) : null}

      {/* Card 1: Avatar & Zen Mascots — Square with rounded corners */}
      <View style={[styles.card, { marginTop: 20, padding: 20, alignItems: 'center' }]}>
        <View style={styles.avatarWrap}>
          <View
            style={[
              styles.avatarCircle,
              activeMascot ? { backgroundColor: activeMascot.background } : null,
            ]}
          >
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={styles.avatarImage}
                accessibilityRole="image"
                accessibilityLabel="Profile photo"
              />
            ) : activeMascotId ? (
              <ZenMascotAvatar id={activeMascotId} size={80} shape="square" borderRadius={28} />
            ) : (
              <Text style={styles.avatarInitial}>{initialLetter}</Text>
            )}
          </View>
          <TactilePressable
            onPress={() => setSheet(SHEET_OPTIONS)}
            accessibilityRole="button"
            accessibilityLabel="Edit profile photo"
            style={styles.cameraBadge}
          >
            <Ionicons name="camera" size={14} color={colors.primary.default} />
          </TactilePressable>
        </View>

        <TactilePressable
          onPress={() => setSheet(SHEET_OPTIONS)}
          scaleDownTo={0.96}
          accessibilityRole="button"
          accessibilityLabel="Choose mascot or photo"
          style={{ marginTop: 12 }}
        >
          <Text style={styles.chooseText}>Choose mascot or photo</Text>
        </TactilePressable>

        {/* Quick Mascot Chips */}
        <View style={styles.chipsRow}>
          {QUICK_MASCOTS.map((m) => {
            const isSelected = activeMascotId === m.id;
            return (
              <TactilePressable
                key={m.id}
                onPress={() => chooseMascot(m.id)}
                scaleDownTo={0.94}
                style={[styles.chip, isSelected && styles.chipOn]}
                accessibilityRole="button"
                accessibilityLabel={`Mascot ${m.label}`}
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextOn]}>
                  {m.label}
                </Text>
              </TactilePressable>
            );
          })}
          <TactilePressable
            onPress={() => setSheet(SHEET_MASCOTS)}
            scaleDownTo={0.94}
            style={styles.chip}
            accessibilityRole="button"
            accessibilityLabel="More mascots"
          >
            <Text style={styles.chipText}>More…</Text>
          </TactilePressable>
        </View>
      </View>

      {/* Card 2: Identity Fields */}
      <View style={[styles.card, { marginTop: 14, padding: 18 }]}>
        {/* Name */}
        <View style={{ marginBottom: 14 }}>
          <Text style={styles.fieldLabel}>Name</Text>
          <View style={styles.fieldBox}>
            <NativeTextInput
              value={name}
              onChangeText={setName}
              placeholder="What should we call you?"
              placeholderTextColor="#9AA5A0"
              maxLength={40}
              autoCapitalize="words"
              style={styles.fieldInput}
            />
          </View>
        </View>

        {/* Daily Intention / Mantra */}
        <View style={{ marginBottom: 14 }}>
          <Text style={styles.fieldLabel}>Daily Intention / Mantra</Text>
          <View style={styles.fieldBox}>
            <NativeTextInput
              value={mantra}
              onChangeText={setMantra}
              placeholder="Taking it one breath at a time"
              placeholderTextColor={colors.text.tertiary}
              maxLength={90}
              style={[styles.fieldInput, { color: colors.text.primary }]}
            />
          </View>
        </View>

        {/* Quiet Bio */}
        <View>
          <Text style={styles.fieldLabel}>Quiet Bio</Text>
          <View style={[styles.fieldBox, { minHeight: 64, height: undefined, paddingVertical: 10 }]}>
            <NativeTextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Seeking stillness and gentle mornings."
              placeholderTextColor={colors.text.tertiary}
              maxLength={160}
              multiline
              style={[styles.fieldInput, { color: colors.text.primary, textAlignVertical: 'top' }]}
            />
          </View>
        </View>
      </View>

      {/* Card 3: Account & Cloud Sync */}
      <View style={[styles.card, { marginTop: 14, padding: 16 }]}>
        <TactilePressable
          onPress={() => {
            if (isConnected) {
              setShowCloudDetails((prev) => !prev);
            } else {
              connectGoogle();
            }
          }}
          scaleDownTo={0.98}
          accessibilityRole="button"
          accessibilityLabel="Google Drive Sync status"
          style={styles.cloudRow}
        >
          <View style={styles.cloudIconPlate}>
            <Ionicons name="cloud-outline" size={19} color={colors.primary.default} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cloudTitle}>Google Drive Sync</Text>
            <Text style={styles.cloudSubtitle} numberOfLines={1}>
              {isConnected
                ? connectedEmail || 'shubbyychan@gmail.com'
                : 'Connect to backup quietly to Google Drive'}
            </Text>
          </View>
          {isConnected ? (
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>Active</Text>
            </View>
          ) : (
            <View style={styles.connectPill}>
              <Text style={styles.connectPillText}>Connect</Text>
            </View>
          )}
        </TactilePressable>

        {isConnected && showCloudDetails ? (
          <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderColor: colors.border.subtle, gap: 10 }}>
            {settings?.lastDriveSyncAt ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary.default} />
                <Text style={{ fontSize: 12.5, color: colors.text.tertiary }}>
                  Last backup {format(new Date(settings.lastDriveSyncAt), 'MMM d, h:mm a')}
                </Text>
              </View>
            ) : null}
            <TactilePressable
              onPress={() => navigation.navigate('CloudStorage')}
              style={styles.cloudActionBtn}
            >
              <Text style={styles.cloudActionBtnText}>Manage Drive backups</Text>
            </TactilePressable>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TactilePressable onPress={switchAccount} style={[styles.cloudSubBtn, { flex: 1 }]}>
                <Text style={styles.cloudSubBtnText}>Switch account</Text>
              </TactilePressable>
              <TactilePressable onPress={signOut} style={[styles.cloudSubBtn, { flex: 1 }]}>
                <Text style={[styles.cloudSubBtnText, { color: '#A04040' }]}>Sign out</Text>
              </TactilePressable>
            </View>
          </View>
        ) : null}
      </View>

      {/* Save Button */}
      <View style={{ marginTop: 20, marginBottom: 28 }}>
        <TactilePressable
          onPress={saveIdentity}
          disabled={savingIdentity}
          scaleDownTo={0.98}
          accessibilityRole="button"
          accessibilityLabel="Save identity"
          style={styles.bottomSaveBtn}
        >
          {savingIdentity ? (
            <ActivityIndicator size="small" color="#EDF3EF" />
          ) : (
            <Text style={styles.bottomSaveText}>Save identity</Text>
          )}
        </TactilePressable>
      </View>

      {/* Photo Options Bottom Sheet */}
      <BottomSheet
        visible={sheet === SHEET_OPTIONS}
        onClose={() => setSheet(SHEET_NONE)}
        title="Update your photo"
        subtitle="A face, a mascot, or a little of both."
      >
        <View style={{ gap: 10 }}>
          {busy ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 2 }}>
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

      {/* Zen Mascot Picker Bottom Sheet */}
      <BottomSheet
        visible={sheet === SHEET_MASCOTS}
        onClose={() => setSheet(SHEET_NONE)}
        title="Choose a zen mascot"
        subtitle="A small companion for your sanctuary."
      >
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 }}>
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
                style={{
                  width: '31%',
                  borderRadius: 18,
                  paddingVertical: 12,
                  paddingHorizontal: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.surface.default,
                  borderColor: selected ? colors.primary.default : 'transparent',
                  borderWidth: selected ? 2 : 0,
                }}
              >
                <View style={styles.mascotPickerFrame}>
                  <ZenMascotAvatar id={mascot.id} size={58} shape="square" borderRadius={14} />
                </View>
                <AppText variant="caption" center numberOfLines={2} style={{ marginTop: 6 }}>
                  {mascot.label}
                </AppText>
                {selected ? (
                  <View
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: colors.primary.default,
                    }}
                  >
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
  const styles = useProfileStyles();
  return (
    <TactilePressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={styles.sheetAction}
    >
      <View style={styles.sheetIconBox}>
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

function useProfileStyles() {
  const { colors, isDark } = useAppTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        topBar: {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 6,
          height: 40,
        },
        backButton: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          paddingVertical: 6,
          paddingHorizontal: 4,
          marginLeft: -4,
        },
        backText: {
          fontSize: 12.5,
          color: colors.text.tertiary,
          fontWeight: '500',
        },
        pageTitle: {
          fontSize: 14.5,
          fontWeight: '600',
          color: colors.text.primary,
        },
        saveHeaderButton: {
          paddingVertical: 6,
          paddingHorizontal: 8,
          marginRight: -4,
        },
        saveHeaderText: {
          fontSize: 14,
          color: colors.primary.default,
          fontWeight: '600',
        },
        headerBlock: {
          marginTop: 16,
        },
        heroTitle: {
          fontFamily: displayFaces.regular,
          fontSize: 28,
          color: colors.text.primary,
          letterSpacing: -0.56,
          lineHeight: 33,
        },
        heroSubtitle: {
          fontSize: 13,
          color: colors.text.tertiary,
          marginTop: 4,
        },
        card: {
          backgroundColor: colors.surface.default,
          borderRadius: 20,
        },
        avatarWrap: {
          position: 'relative',
          width: 80,
          height: 80,
        },
        avatarCircle: {
          width: 80,
          height: 80,
          borderRadius: 28,
          backgroundColor: isDark ? colors.primary.subtle : colors.primary.default,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        avatarImage: {
          width: '100%',
          height: '100%',
          borderRadius: 28,
        },
        avatarInitial: {
          fontFamily: displayFaces.regular,
          fontSize: 32,
          color: isDark ? colors.primary.default : '#EDF3EF',
        },
        cameraBadge: {
          position: 'absolute',
          right: -2,
          bottom: -2,
          width: 28,
          height: 28,
          borderRadius: 10,
          backgroundColor: colors.surface.default,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#14241E',
          shadowOpacity: 0.1,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        },
        mascotPickerFrame: {
          width: 58,
          height: 58,
          borderRadius: 14,
          overflow: 'hidden',
        },
        chooseText: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.primary.default,
        },
        chipsRow: {
          flexDirection: 'row',
          justifyContent: 'center',
          gap: 8,
          marginTop: 14,
          flexWrap: 'wrap',
        },
        chip: {
          height: 32,
          paddingHorizontal: 13,
          borderRadius: 999,
          backgroundColor: colors.surface.muted,
          alignItems: 'center',
          justifyContent: 'center',
        },
        chipOn: {
          backgroundColor: colors.surface.selected,
        },
        chipText: {
          fontSize: 12,
          fontWeight: '500',
          color: colors.text.secondary,
        },
        chipTextOn: {
          color: colors.primary.default,
          fontWeight: '600',
        },
        fieldLabel: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.88,
          textTransform: 'uppercase',
          color: colors.text.tertiary,
          marginBottom: 6,
        },
        fieldBox: {
          height: 46,
          borderRadius: 12,
          backgroundColor: colors.background.default,
          paddingHorizontal: 14,
          justifyContent: 'center',
        },
        fieldInput: {
          fontSize: 14.5,
          color: colors.text.primary,
          fontWeight: '500',
          padding: 0,
          margin: 0,
        },
        cloudRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        },
        cloudIconPlate: {
          width: 36,
          height: 36,
          borderRadius: 11,
          backgroundColor: colors.surface.muted,
          alignItems: 'center',
          justifyContent: 'center',
        },
        cloudTitle: {
          fontSize: 14,
          fontWeight: '600',
          color: colors.text.primary,
        },
        cloudSubtitle: {
          fontSize: 12,
          color: colors.text.tertiary,
          marginTop: 1,
        },
        activePill: {
          paddingHorizontal: 9,
          paddingVertical: 3,
          borderRadius: 999,
          backgroundColor: colors.surface.selected,
        },
        activePillText: {
          fontSize: 11.5,
          fontWeight: '600',
          color: colors.primary.default,
        },
        connectPill: {
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 999,
          backgroundColor: colors.primary.default,
        },
        connectPillText: {
          fontSize: 12,
          fontWeight: '600',
          color: colors.primary.foreground,
        },
        cloudActionBtn: {
          backgroundColor: colors.surface.muted,
          borderRadius: 12,
          paddingVertical: 10,
          alignItems: 'center',
          justifyContent: 'center',
        },
        cloudActionBtnText: {
          fontSize: 13,
          fontWeight: '600',
          color: colors.primary.default,
        },
        cloudSubBtn: {
          paddingVertical: 8,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 10,
          backgroundColor: colors.surface.muted,
        },
        cloudSubBtnText: {
          fontSize: 12,
          fontWeight: '500',
          color: colors.text.tertiary,
        },
        bottomSaveBtn: {
          height: 52,
          borderRadius: 16,
          backgroundColor: colors.primary.default,
          alignItems: 'center',
          justifyContent: 'center',
        },
        bottomSaveText: {
          fontSize: 15,
          fontWeight: '600',
          color: colors.primary.foreground,
        },
        sheetAction: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          padding: 14,
          borderRadius: 16,
          backgroundColor: colors.surface.muted,
        },
        sheetIconBox: {
          width: 40,
          height: 40,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface.default,
        },
      }),
    [colors, isDark]
  );
}
