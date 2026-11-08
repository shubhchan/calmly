import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { RootStackParamList } from '../../types/navigation';
import { mascotById, ZenMascotAvatar } from '../../components/profile/ZenMascotAvatar';
import { useAppTheme, useTheme, supportsDynamicColors } from '../../theme/ThemeContext';
import { AppText, BottomSheet, Button, TactilePressable, TextInput } from '../../components';
import { useFontStore } from '../../theme/fontStore';
import { useMotionPrefs } from '../../theme/motion';
import { type NamedAccent } from '../../theme/palette';
import { getCalmlyAuth } from '../../services/calmlyAuth';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ProfileAvatarView } from '../../components/profile/ProfileAvatarView';
import { settingsRepository, type AppSettings } from '../../database/repositories/settingsRepository';
import { loadMindfulStats, EMPTY_MINDFUL_STATS, type MindfulStats } from '../../utils/mindfulStats';
import { displayFaces } from '../../theme/typography';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const accentOptions: { value: NamedAccent; label: string }[] = [
  { value: 'sage', label: 'Sage' },
  { value: 'lavender', label: 'Lavender' },
  { value: 'sky', label: 'Sky' },
  { value: 'peach', label: 'Peach' },
  { value: 'rose', label: 'Rose' },
  { value: 'ocean', label: 'Ocean' },
];

/** Curated starting points inside the custom accent sheet. */
const CUSTOM_SWATCHES: { hex: string; label: string }[] = [
  { hex: '#2C4F45', label: 'Sage' },
  { hex: '#5F5A6B', label: 'Slate' },
  { hex: '#41626E', label: 'Harbor' },
  { hex: '#8E5F42', label: 'Clay' },
  { hex: '#7F5257', label: 'Dusk rose' },
  { hex: '#356B6D', label: 'Lagoon' },
  { hex: '#9A7434', label: 'Reed' },
  { hex: '#7A8B5C', label: 'Olive' },
  { hex: '#A86C82', label: 'Mauve' },
  { hex: '#6E5F8E', label: 'Iris' },
  { hex: '#4E6E5D', label: 'Pine' },
  { hex: '#705840', label: 'Cocoa' },
];

/** White or near-ink, whichever keeps text readable on the chosen hex. */
function inkFor(hex: string): string {
  const raw = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(raw)) return '#1A2420';
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 150 ? '#1A2420' : '#F7F9F6';
}

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
  const { colors, isDark } = useAppTheme();
  const styles = useSettingsStyles();

  const theme = themeContext.theme ?? 'system';
  const accent = themeContext.accent ?? 'sage';
  const setTheme = themeContext.setTheme ?? (() => {});
  const setAccent = themeContext.setAccent ?? (() => {});

  const activeFont = useFontStore((s) => s.active);
  const reduceAnimations = useMotionPrefs((s) => s.reduceMotion);
  const setReduceAnimations = useMotionPrefs((s) => s.setReduceMotion);
  const dynamicColors = themeContext.dynamicColors ?? false;
  const setDynamicColors = themeContext.setDynamicColors ?? (() => {});
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [highContrast, setHighContrast] = useState(false);
  const [cloudUser, setCloudUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [stats, setStats] = useState<MindfulStats>(EMPTY_MINDFUL_STATS);
  const [openPanel, setOpenPanel] = useState<'appearance' | 'comfort' | null>(null);
  const [accentSheetOpen, setAccentSheetOpen] = useState(false);

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
      backgroundColor={colors.background.default}
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
          <Ionicons name="pencil-outline" size={19} color={colors.text.secondary} />
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
          <View style={{ paddingBottom: 16 }}>
            <Text style={styles.miniEyebrow}>Theme</Text>
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
                      selected && { backgroundColor: colors.primary.default },
                    ]}
                  >
                    <Text
                      style={[
                        styles.themePillText,
                        selected && { color: colors.primary.foreground, fontWeight: '600' },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TactilePressable>
                );
              })}
            </View>

            {supportsDynamicColors() ? (
              <View style={[styles.switchRow, { marginTop: 14, paddingVertical: 0 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.switchLabel}>Dynamic colors</Text>
                  <Text style={styles.switchNote}>Follow your wallpaper (Material You)</Text>
                </View>
                <Switch
                  value={dynamicColors}
                  onValueChange={(value) => void setDynamicColors(value)}
                  trackColor={{ false: colors.surface.muted, true: colors.primary.default }}
                  thumbColor="#FFFFFF"
                />
              </View>
            ) : null}

            {!dynamicColors ? (
              <>
                <Text style={[styles.miniEyebrow, { marginTop: 18 }]}>Accent</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
                  {accentOptions.map((option) => (
                    <AccentSwatch
                      key={option.value}
                      label={option.label}
                      color={colors.accents[option.value]}
                      selected={accent === option.value}
                      onPress={() => setAccent(option.value)}
                    />
                  ))}
                  <AccentSwatch
                    label="Dynamic"
                    color={colors.primary.subtle}
                    selected={accent === 'dynamic'}
                    onPress={() => setAccent('dynamic')}
                    icon={
                      <Ionicons name="sunny-outline" size={19} color={colors.primary.default} />
                    }
                  />
                  <AccentSwatch
                    label="Custom"
                    color={accent.startsWith('#') ? accent : colors.surface.default}
                    selected={accent.startsWith('#')}
                    onPress={() => setAccentSheetOpen(true)}
                    icon={<Ionicons name="add" size={19} color={colors.text.tertiary} />}
                    dashed
                  />
                </View>
                {accent === 'dynamic' ? (
                  <Text style={styles.accentNote}>
                    Follows your day — sage in the morning, sky at midday, peach by evening, ocean
                    at night.
                  </Text>
                ) : accent.startsWith('#') ? (
                  <Text style={styles.accentNote}>{`Custom color ${accent.toUpperCase()} — applied across light and dark.`}</Text>
                ) : null}
              </>
            ) : (
              <Text style={styles.accentNote}>
                Colors now follow your wallpaper. Turn this off to pick an accent yourself.
              </Text>
            )}
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

      {/* Custom accent sheet */}
      <AccentSheet
        visible={accentSheetOpen}
        onClose={() => setAccentSheetOpen(false)}
        currentAccent={accent}
        onApply={(hex) => {
          void setAccent(`#${hex}`);
          setAccentSheetOpen(false);
        }}
      />

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
  const styles = useSettingsStyles();
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, highlight && styles.statHighlight]}>{value}</Text>
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
  const styles = useSettingsStyles();
  const { colors } = useAppTheme();
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
          <Ionicons name={icon} size={19} color={colors.primary.default} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        <Ionicons
          name={expanded ? 'chevron-down' : 'chevron-forward'}
          size={15}
          color={colors.text.tertiary}
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
  const styles = useSettingsStyles();
  const { colors } = useAppTheme();
  return (
    <View style={[styles.switchRow, !last && styles.switchDivider]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.switchLabel}>{label}</Text>
        <Text style={styles.switchNote}>{note}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.surface.muted, true: colors.primary.default }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

/** One accent choice tile: color dot (or icon plate), selection ring, label. */
function AccentSwatch({
  label,
  color,
  selected,
  onPress,
  icon,
  dashed,
}: {
  label: string;
  color: string;
  selected?: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  dashed?: boolean;
}) {
  const { colors } = useAppTheme();
  const styles = useSettingsStyles();
  return (
    <TactilePressable
      onPress={onPress}
      scaleDownTo={0.94}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${label} accent`}
      style={styles.swatchCol}
    >
      <View style={[styles.swatchRing, selected && { borderColor: colors.primary.default }]}>
        <View style={[styles.swatchDot, dashed && styles.swatchDashed, { backgroundColor: color }]}>
          {icon}
        </View>
      </View>
      <Text style={styles.swatchLabel}>{label}</Text>
    </TactilePressable>
  );
}

/** Pick any color: curated tiles plus a hex field, with a live preview. */
function AccentSheet({
  visible,
  onClose,
  currentAccent,
  onApply,
}: {
  visible: boolean;
  onClose: () => void;
  currentAccent: string;
  onApply: (hex: string) => void;
}) {
  const { colors } = useAppTheme();
  const styles = useSettingsStyles();
  const [draft, setDraft] = useState('#');

  useEffect(() => {
    if (visible) setDraft(currentAccent.startsWith('#') ? currentAccent : '#');
  }, [visible, currentAccent]);

  const parseHex = (value: string): string | null => {
    const raw = value.trim().replace(/^#/, '');
    if (/^[0-9a-fA-F]{3}$/.test(raw)) {
      return raw.split('').map((c) => c + c).join('').toUpperCase();
    }
    return /^[0-9a-fA-F]{6}$/.test(raw) ? raw.toUpperCase() : null;
  };

  const normalized = parseHex(draft);
  const hexError = draft.trim().replace(/^#/, '').length > 0 && !normalized
    ? 'Use three or six hex digits, like 705840'
    : '';
  const previewHex = normalized ? `#${normalized}` : colors.surface.muted;
  const previewInk = normalized ? inkFor(previewHex) : colors.text.tertiary;
  const matchLabel = CUSTOM_SWATCHES.find((s) => s.hex === `#${normalized}`)?.label;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Custom accent"
      subtitle="Pick a tile or type a hex. Applies across light and dark."
    >
      <Text style={styles.miniEyebrow}>Curated</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 2 }}>
        {CUSTOM_SWATCHES.map((swatch) => {
          const selected = `#${normalized}` === swatch.hex;
          return (
            <TactilePressable
              key={swatch.hex}
              onPress={() => setDraft(swatch.hex)}
              scaleDownTo={0.92}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${swatch.label} accent`}
              style={[styles.sheetSwatchRing, selected && { borderColor: colors.primary.default }]}
            >
              <View style={[styles.swatchDot, { backgroundColor: swatch.hex }]} />
            </TactilePressable>
          );
        })}
      </View>

      <View style={{ marginTop: 16 }}>
        <TextInput
          value={draft}
          onChangeText={(text) => setDraft(text.startsWith('#') ? text : `#${text.trim()}`)}
          label="Hex value"
          placeholder="#705840"
          autoCapitalize="characters"
          autoCorrect={false}
          errorText={hexError}
          helperText={matchLabel ? `${matchLabel} — saved to your profile` : 'Three or six digits after the #'}
          accessibilityLabel="Custom accent hex value"
          testID="custom-accent-hex-input"
        />
      </View>

      <View style={styles.accentPreview}>
        <View style={[styles.accentPreviewDot, { backgroundColor: previewHex }]} />
        <View style={styles.accentPreviewCard}>
          <Text style={{ fontSize: 13, fontWeight: '500', color: previewInk }}>Quiet evenings</Text>
          <View
            style={{
              height: 30,
              paddingHorizontal: 12,
              borderRadius: 9,
              backgroundColor: previewHex,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 11.5, fontWeight: '600', color: previewInk }}>Begin</Text>
          </View>
        </View>
      </View>

      <Button
        title="Apply accent"
        onPress={() => normalized && onApply(normalized)}
        disabled={!normalized}
        fullWidth
        style={{ marginTop: 14 }}
      />
    </BottomSheet>
  );
}

function useSettingsStyles() {
  const { colors, isDark } = useAppTheme();
  return useMemo(
    () =>
      StyleSheet.create({
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
          backgroundColor: isDark ? colors.primary.subtle : colors.primary.default,
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
          color: isDark ? colors.primary.default : colors.primary.foreground,
        },
        identityName: {
          fontFamily: displayFaces.regular,
          fontSize: 26,
          color: colors.text.primary,
          letterSpacing: -0.52,
          lineHeight: 30,
        },
        identitySince: {
          fontSize: 12.5,
          color: colors.text.tertiary,
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
          backgroundColor: colors.surface.default,
          borderRadius: 16,
          paddingVertical: 13,
          paddingHorizontal: 14,
        },
        statValue: {
          fontFamily: displayFaces.regular,
          fontSize: 22,
          color: colors.text.primary,
          lineHeight: 26,
        },
        statHighlight: {
          color: colors.status.warning.default,
        },
        statLabel: {
          fontSize: 11.5,
          color: colors.text.tertiary,
          marginTop: 1,
        },
        sectionEyebrow: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 1.3,
          textTransform: 'uppercase',
          color: colors.text.tertiary,
          marginTop: 22,
          marginBottom: 6,
        },
        groupedCard: {
          backgroundColor: colors.surface.default,
          borderRadius: 18,
          paddingHorizontal: 16,
        },
        rowContainer: {},
        rowDivider: {
          borderBottomWidth: 1,
          borderBottomColor: colors.border.subtle,
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
          backgroundColor: colors.surface.muted,
          alignItems: 'center',
          justifyContent: 'center',
        },
        rowLabel: {
          flex: 1,
          fontSize: 14.5,
          fontWeight: '500',
          color: colors.text.primary,
        },
        rowValue: {
          fontSize: 12.5,
          color: colors.text.tertiary,
          marginRight: 4,
        },
        themePill: {
          flex: 1,
          height: 38,
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface.muted,
        },
        themePillText: {
          fontSize: 13,
          fontWeight: '500',
          color: colors.text.secondary,
        },
        switchRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingVertical: 11,
        },
        switchDivider: {
          borderBottomWidth: 1,
          borderBottomColor: colors.border.subtle,
        },
        switchLabel: {
          fontSize: 14,
          fontWeight: '500',
          color: colors.text.primary,
        },
        switchNote: {
          fontSize: 12,
          color: colors.text.tertiary,
          marginTop: 1,
        },
        footerWrap: {
          marginTop: 28,
          marginBottom: 20,
          alignItems: 'center',
        },
        footerText: {
          fontSize: 12.5,
          color: colors.text.tertiary,
        },
        miniEyebrow: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 1.1,
          textTransform: 'uppercase',
          color: colors.text.tertiary,
          marginBottom: 8,
        },
        accentNote: {
          fontSize: 12,
          color: colors.text.tertiary,
          marginTop: 12,
          fontStyle: 'italic',
          lineHeight: 17,
        },
        swatchCol: {
          width: 58,
          alignItems: 'center',
          gap: 6,
        },
        swatchRing: {
          width: 50,
          height: 50,
          borderRadius: 25,
          borderWidth: 2,
          borderColor: 'transparent',
          padding: 2,
        },
        swatchDot: {
          flex: 1,
          borderRadius: 21,
          overflow: 'hidden',
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#14241E',
          shadowOpacity: 0.08,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: 1,
        },
        swatchDashed: {
          borderWidth: 1.2,
          borderColor: colors.border.strong,
          borderStyle: 'dashed',
        },
        swatchLabel: {
          fontSize: 11.5,
          color: colors.text.secondary,
        },
        sheetSwatchRing: {
          width: 48,
          height: 48,
          borderRadius: 24,
          borderWidth: 2,
          borderColor: 'transparent',
          padding: 2,
        },
        accentPreview: {
          marginTop: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: colors.surface.muted,
          borderRadius: 16,
          padding: 12,
        },
        accentPreviewDot: {
          width: 34,
          height: 34,
          borderRadius: 17,
        },
        accentPreviewCard: {
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          backgroundColor: colors.surface.default,
          borderRadius: 12,
          paddingVertical: 10,
          paddingHorizontal: 14,
        },
      }),
    [colors, isDark]
  );
}
