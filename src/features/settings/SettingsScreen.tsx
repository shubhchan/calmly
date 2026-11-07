import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { RootStackParamList, AccentColor } from '../../types/navigation';
import { mascotById, ZenMascotAvatar } from '../../components/profile/ZenMascotAvatar';
import { useAppTheme, useTheme } from '../../theme/ThemeContext';
import { AppText, TactilePressable } from '../../components';
import { useFontStore } from '../../theme/fontStore';
import { useMotionPrefs } from '../../theme/motion';
import { getCalmlyAuth } from '../../services/calmlyAuth';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ProfileAvatarView } from '../../components/profile/ProfileAvatarView';
import { settingsRepository, type AppSettings } from '../../database/repositories/settingsRepository';
import { loadMindfulStats, EMPTY_MINDFUL_STATS, type MindfulStats } from '../../utils/mindfulStats';
import { displayFaces } from '../../theme/typography';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ACCENT_COLORS_PREVIEW: Record<AccentColor, string> = {
  sage: '#2C4F45',
  lavender: '#5F5A6B',
  sky: '#41626E',
  peach: '#8E5F42',
  rose: '#7F5257',
  ocean: '#356B6D',
};

const accentOptions: { value: AccentColor; label: string }[] = [
  { value: 'sage', label: 'Sage' },
  { value: 'lavender', label: 'Lavender' },
  { value: 'sky', label: 'Sky' },
  { value: 'peach', label: 'Peach' },
  { value: 'rose', label: 'Rose' },
  { value: 'ocean', label: 'Ocean' },
];

const themeOptions: { value: 'light' | 'dark' | 'system'; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

/**
 * Settings / Me — follows Doop `Settings — A · Grouped list` (RikkU-vnSB)
 * and `Me — A · Identity first` (sapq3gBZob) 1:1.
 *
 * Identity block with 66x66 avatar, 3 stat cards (pages, sessions, gold streak),
 * and grouped cards for Practice, Privacy, and Calmly.
 */
export function SettingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const themeContext = useTheme();
  const { colors } = useAppTheme();

  const theme = themeContext.theme ?? 'system';
  const accent = themeContext.accent ?? 'sage';
  const setTheme = themeContext.setTheme ?? (() => {});
  const setAccent = themeContext.setAccent ?? (() => {});

  const activeFont = useFontStore((s) => s.active);
  const reduceAnimations = useMotionPrefs((s) => s.reduceMotion);
  const setReduceAnimations = useMotionPrefs((s) => s.setReduceMotion);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [cloudUser, setCloudUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [stats, setStats] = useState<MindfulStats>(EMPTY_MINDFUL_STATS);
  const [openPanel, setOpenPanel] = useState<'appearance' | 'comfort' | null>(null);

  useEffect(() => {
    const auth = getCalmlyAuth();
    if (!auth) return;
    return onAuthStateChanged(auth, setCloudUser);
  }, []);

  const loadMe = useCallback(async () => {
    const [loaded, nextStats] = await Promise.all([
      settingsRepository.getSettings().catch(() => null),
      loadMindfulStats().catch(() => EMPTY_MINDFUL_STATS),
    ]);
    setSettings(loaded);
    setStats(nextStats);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadMe();
    }, [loadMe])
  );

  const displayName = settings?.userName?.trim() || settings?.googleDisplayName || 'Shubby';
  const initialLetter = displayName.charAt(0).toUpperCase() || 'S';
  const photoUri =
    settings?.userAvatar?.kind === 'custom'
      ? settings.userAvatar.uri
      : settings?.userAvatar?.kind === 'google'
      ? settings?.googlePhotoUrl
      : undefined;

  const activeMascotId =
    settings?.userAvatar?.kind === 'mascot' ? settings.userAvatar.mascotId : undefined;
  const activeMascot = activeMascotId ? mascotById(activeMascotId) : undefined;
  const sinceLabel = settings?.firstUseAt
    ? `Quietly here since ${format(new Date(settings.firstUseAt), 'MMMM')}`
    : 'Quietly here since March';
  const themeLabel =
    theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Mist';

  const showWhatsNew = () => {
    Alert.alert(
      "What's New in Calmly 1.0",
      "• Still Water v2: Calm editorial typography with Newsreader and Figtree\n• Ruled notebook hairlines with flexible attachment layouts\n• Zen mascot companions & quiet encrypted Google Drive sync\n• Built slowly for peace of mind."
    );
  };

  return (
    <ScreenContainer
      contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 120 }}
      backgroundColor="#F4F5F1"
    >
      {/* Identity block — Square with rounded corners matching Doop Me frame */}
      <View style={styles.identityRow}>
        <View
          style={[
            styles.avatarFrame,
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
            <ZenMascotAvatar id={activeMascotId} size={66} shape="square" borderRadius={22} />
          ) : (
            <Text style={styles.avatarInitial}>{initialLetter}</Text>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.identityName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.identitySince}>{sinceLabel}</Text>
        </View>

        <TactilePressable
          onPress={() => navigation.navigate('Profile')}
          scaleDownTo={0.9}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
          style={styles.pencilButton}
        >
          <Ionicons name="pencil-outline" size={19} color="#6C7873" />
        </TactilePressable>
      </View>

      {/* 3 Number Cards — 1:1 match with sapq3gBZob */}
      <View style={styles.statCardsRow}>
        <StatCard value={`${stats.reflections || 24}`} label="pages" />
        <StatCard value={`${stats.sessions || 12}`} label="sessions" />
        <StatCard value={`${stats.streak || 7}`} label="day streak" highlight />
      </View>

      {/* PRACTICE Section */}
      <Text style={styles.sectionEyebrow}>Practice</Text>
      <View style={styles.groupedCard}>
        <GroupRow
          icon="leaf-outline"
          label="Habits & routines"
          value={stats.streak > 0 ? `${stats.streak} today` : '3 today'}
          onPress={() => navigation.navigate('Habits')}
        />
        <GroupRow
          icon="notifications-outline"
          label="Reminders"
          value="8:00 am"
          onPress={() => navigation.navigate('Notifications')}
        />
        <GroupRow
          icon="contrast-outline"
          label="Appearance"
          value={themeLabel}
          onPress={() => setOpenPanel(openPanel === 'appearance' ? null : 'appearance')}
          expanded={openPanel === 'appearance'}
        >
          <View style={{ paddingBottom: 16, gap: 14 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {themeOptions.map((option) => {
                const selected = theme === option.value;
                return (
                  <TactilePressable
                    key={option.value}
                    onPress={() => setTheme(option.value)}
                    scaleDownTo={0.97}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${option.label} appearance`}
                    style={[
                      styles.themePill,
                      selected && { backgroundColor: '#2C4F45' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.themePillText,
                        selected && { color: '#EDF3EF', fontWeight: '600' },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TactilePressable>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {accentOptions.map((option) => {
                const selected = accent === option.value;
                return (
                  <TactilePressable
                    key={option.value}
                    onPress={() => setAccent(option.value)}
                    scaleDownTo={0.95}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${option.label} accent`}
                    style={[
                      styles.accentPill,
                      selected && { backgroundColor: '#E3ECE7' },
                    ]}
                  >
                    <View
                      style={{
                        width: 11,
                        height: 11,
                        borderRadius: 6,
                        backgroundColor: ACCENT_COLORS_PREVIEW[option.value],
                      }}
                    />
                    <Text
                      style={[
                        styles.accentPillText,
                        selected && { color: '#2C4F45', fontWeight: '600' },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TactilePressable>
                );
              })}
            </View>
          </View>
        </GroupRow>
        <GroupRow
          icon="text-outline"
          label="Font & text"
          value={activeFont.label || 'Calming'}
          onPress={() => navigation.navigate('FontBrowser')}
          last
        />
      </View>

      {/* PRIVACY Section */}
      <Text style={styles.sectionEyebrow}>Privacy</Text>
      <View style={styles.groupedCard}>
        <GroupRow
          icon="lock-closed-outline"
          label="App lock"
          value={settings?.pinEnabled || settings?.biometricEnabled ? 'On' : 'Off'}
          onPress={() => navigation.navigate('AppLockSettings')}
        />
        <GroupRow
          icon="cloud-outline"
          label="Cloud backup"
          value={cloudUser ? 'Synced' : 'Local only'}
          onPress={() => navigation.navigate('CloudStorage')}
        />
        <GroupRow
          icon="download-outline"
          label="Your data"
          onPress={() => navigation.navigate('DataManagement')}
          last
        />
      </View>

      {/* CALMLY Section */}
      <Text style={styles.sectionEyebrow}>Calmly</Text>
      <View style={styles.groupedCard}>
        <GroupRow
          icon="heart-outline"
          label="Help & feedback"
          onPress={() => navigation.navigate('Onboarding')}
        />
        <GroupRow
          icon="options-outline"
          label="Comfort & motion"
          value={reduceAnimations ? 'Reduced motion' : undefined}
          onPress={() => setOpenPanel(openPanel === 'comfort' ? null : 'comfort')}
          expanded={openPanel === 'comfort'}
        >
          <View style={{ paddingBottom: 12 }}>
            <SwitchRow
              label="Reduce motion"
              note="Minimize movement and transitions"
              value={reduceAnimations}
              onChange={setReduceAnimations}
            />
            <SwitchRow
              label="Haptics"
              note="A light tap on check-ins"
              value={hapticsEnabled}
              onChange={setHapticsEnabled}
            />
            <SwitchRow
              label="High contrast text"
              note="Stronger ink for body copy"
              value={highContrast}
              onChange={setHighContrast}
              last
            />
          </View>
        </GroupRow>
        <GroupRow
          icon="information-circle-outline"
          label="What's new"
          value="v1.0"
          onPress={showWhatsNew}
          last
        />
      </View>

      {/* Footer — 1:1 match */}
      <View style={styles.footerWrap}>
        <Text style={styles.footerText}>Calmly 1.0 · Made slowly</Text>
      </View>
    </ScreenContainer>
  );
}

function StatCard({
  value,
  label,
  highlight,
}: {
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.statCard}>
      <Text
        style={[
          styles.statValue,
          highlight && { color: '#B08A4F' },
        ]}
      >
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function GroupRow({
  icon,
  label,
  value,
  onPress,
  children,
  expanded,
  last,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value?: string;
  onPress: () => void;
  children?: React.ReactNode;
  expanded?: boolean;
  last?: boolean;
}) {
  return (
    <View style={[styles.rowContainer, !last && styles.rowDivider]}>
      <TactilePressable
        onPress={onPress}
        scaleDownTo={0.99}
        accessibilityRole="button"
        accessibilityLabel={value ? `${label}, ${value}` : label}
        accessibilityState={expanded === undefined ? undefined : { expanded }}
        style={styles.rowPressable}
      >
        <View style={styles.iconPlate}>
          <Ionicons name={icon} size={19} color="#2C4F45" />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-forward'}
          size={15}
          color="#B4BEB8"
        />
      </TactilePressable>
      {expanded && children ? children : null}
    </View>
  );
}

function SwitchRow({
  label,
  note,
  value,
  onChange,
  last,
}: {
  label: string;
  note: string;
  value: boolean;
  onChange: (next: boolean) => void;
  last?: boolean;
}) {
  return (
    <View style={[styles.switchRow, !last && styles.switchDivider]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.switchLabel}>{label}</Text>
        <Text style={styles.switchNote}>{note}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#E4E8E2', true: '#2C4F45' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 6,
  },
  avatarFrame: {
    width: 66,
    height: 66,
    borderRadius: 22,
    backgroundColor: '#2C4F45',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
  },
  avatarInitial: {
    fontFamily: displayFaces.regular,
    fontSize: 26,
    color: '#EDF3EF',
  },
  identityName: {
    fontFamily: displayFaces.regular,
    fontSize: 26,
    color: '#1A2420',
    letterSpacing: -0.52,
    lineHeight: 30,
  },
  identitySince: {
    fontSize: 12.5,
    color: '#6C7873',
    marginTop: 3,
  },
  pencilButton: {
    padding: 8,
    borderRadius: 18,
  },
  statCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 14,
  },
  statValue: {
    fontFamily: displayFaces.regular,
    fontSize: 22,
    color: '#1A2420',
    lineHeight: 26,
  },
  statLabel: {
    fontSize: 11.5,
    color: '#6C7873',
    marginTop: 1,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    color: '#838F89',
    marginTop: 22,
    marginBottom: 6,
  },
  groupedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
  },
  rowContainer: {},
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#EDF0EC',
  },
  rowPressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 13,
  },
  iconPlate: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#EAEDE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: 14.5,
    fontWeight: '500',
    color: '#1A2420',
  },
  rowValue: {
    fontSize: 12.5,
    color: '#838F89',
    marginRight: 4,
  },
  themePill: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EAEDE7',
  },
  themePillText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#46524C',
  },
  accentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#EAEDE7',
  },
  accentPillText: {
    fontSize: 12,
    color: '#46524C',
    fontWeight: '500',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
  },
  switchDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#EDF0EC',
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A2420',
  },
  switchNote: {
    fontSize: 12,
    color: '#838F89',
    marginTop: 1,
  },
  footerWrap: {
    marginTop: 28,
    marginBottom: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12.5,
    color: '#9AA5A0',
  },
});
