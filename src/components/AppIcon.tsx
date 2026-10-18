import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/ThemeContext';

type IonName = React.ComponentProps<typeof Ionicons>['name'];
type MciName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

type RegistryEntry =
  | { kind: 'ion'; name: IonName }
  | { kind: 'mci'; name: MciName };

/**
 * Static vector-only icon registry (design system). Ionicons is the primary
 * set; MaterialCommunityIcons is used only for mood faces.
 */
const REGISTRY: Record<string, RegistryEntry> = {
  // Legacy 'l-' names — kept as aliases so older call sites keep working,
  // now resolved to static design-system vectors (no animation).
  'l-heart': { kind: 'ion', name: 'heart' },
  'l-star': { kind: 'ion', name: 'star' },
  'l-book': { kind: 'ion', name: 'book' },
  'l-doc': { kind: 'ion', name: 'document-text' },
  'l-write': { kind: 'ion', name: 'create' },
  'l-eye': { kind: 'ion', name: 'eye' },
  'l-ear': { kind: 'ion', name: 'ear' },
  'l-mic': { kind: 'ion', name: 'mic' },
  'l-calm': { kind: 'ion', name: 'leaf' },
  'l-hands': { kind: 'ion', name: 'hand-left' },
  'l-pin': { kind: 'ion', name: 'pin' },
  'l-pulse': { kind: 'ion', name: 'pulse' },
  'l-expand': { kind: 'ion', name: 'expand' },
  'l-walk': { kind: 'ion', name: 'walk' },
  'l-gift': { kind: 'ion', name: 'gift' },
  'l-chart': { kind: 'ion', name: 'stats-chart' },
  'l-camera': { kind: 'ion', name: 'camera' },
  'l-trash': { kind: 'ion', name: 'trash' },
  'l-bell': { kind: 'ion', name: 'notifications' },
  'l-lock': { kind: 'ion', name: 'lock-closed' },
  'l-clock': { kind: 'ion', name: 'time' },

  // Sensory & semantic aliases
  'l-breathe': { kind: 'mci', name: 'weather-windy' },
  'l-meditate': { kind: 'ion', name: 'flower' },
  'l-streak': { kind: 'ion', name: 'flame' },
  'l-stats': { kind: 'ion', name: 'stats-chart' },
  'l-time': { kind: 'ion', name: 'time' },
  'l-habits': { kind: 'ion', name: 'repeat' },
  'l-gratitude': { kind: 'ion', name: 'gift' },
  'l-journal': { kind: 'ion', name: 'book' },
  'l-love': { kind: 'ion', name: 'heart' },
  'l-sound': { kind: 'ion', name: 'ear' },
  'l-hear': { kind: 'ion', name: 'ear' },
  'l-see': { kind: 'ion', name: 'eye' },
  'l-touch': { kind: 'ion', name: 'hand-left' },

  // Ionicons
  'i-leaf': { kind: 'ion', name: 'leaf' },
  'i-sun': { kind: 'ion', name: 'sunny' },
  'i-moon': { kind: 'ion', name: 'moon' },
  'i-calendar': { kind: 'ion', name: 'calendar' },
  'i-loc': { kind: 'ion', name: 'location' },
  'i-check': { kind: 'ion', name: 'checkmark' },
  'i-check-circle': { kind: 'ion', name: 'checkmark-circle' },
  'i-share': { kind: 'ion', name: 'share-social' },
  'i-download': { kind: 'ion', name: 'download' },
  'i-phone': { kind: 'ion', name: 'phone-portrait' },
  'i-flash': { kind: 'ion', name: 'flash' },
  'i-battery': { kind: 'ion', name: 'battery-half' },
  'i-rocket': { kind: 'ion', name: 'rocket' },
  'i-tag': { kind: 'ion', name: 'pricetag' },
  'i-bulb': { kind: 'ion', name: 'bulb' },
  'i-flower': { kind: 'ion', name: 'flower' },
  'i-water': { kind: 'ion', name: 'water' },
  'i-cloud': { kind: 'ion', name: 'cloudy' },
  'i-restaurant': { kind: 'ion', name: 'restaurant' },
  'i-nutrition': { kind: 'ion', name: 'nutrition' },
  'i-bed': { kind: 'ion', name: 'bed' },
  'i-hand-l': { kind: 'ion', name: 'hand-left' },
  'i-hand-r': { kind: 'ion', name: 'hand-right' },
  'i-time': { kind: 'ion', name: 'time' },
  'i-fitness': { kind: 'ion', name: 'fitness' },

  // Additional Ionicons & common UI symbols
  'i-sparkles': { kind: 'ion', name: 'sparkles' },
  'i-compass': { kind: 'ion', name: 'compass' },
  'i-shield': { kind: 'ion', name: 'shield-checkmark' },
  'i-shield-checkmark': { kind: 'ion', name: 'shield-checkmark' },
  'i-refresh': { kind: 'ion', name: 'refresh' },
  'i-add': { kind: 'ion', name: 'add' },
  'i-close': { kind: 'ion', name: 'close' },
  'i-arrow-back': { kind: 'ion', name: 'arrow-back' },
  'i-arrow-forward': { kind: 'ion', name: 'arrow-forward' },
  'i-play': { kind: 'ion', name: 'play' },
  'i-pause': { kind: 'ion', name: 'pause' },
  'i-settings': { kind: 'ion', name: 'settings' },
  'i-medkit': { kind: 'ion', name: 'medkit' },
  'i-flame': { kind: 'ion', name: 'flame' },
  'i-body': { kind: 'ion', name: 'body' },
  'i-person': { kind: 'ion', name: 'person' },
  'i-stats-chart': { kind: 'ion', name: 'stats-chart' },
  'i-heart': { kind: 'ion', name: 'heart' },
  'i-star': { kind: 'ion', name: 'star' },
  'i-home': { kind: 'ion', name: 'home' },
  'i-search': { kind: 'ion', name: 'search' },
  'i-checkmark': { kind: 'ion', name: 'checkmark' },

  // Mood faces
  'm-happy': { kind: 'mci', name: 'emoticon-happy-outline' },
  'm-peaceful': { kind: 'mci', name: 'emoticon-neutral-outline' },
  'm-grateful': { kind: 'mci', name: 'emoticon-kiss-outline' },
  'm-content': { kind: 'mci', name: 'emoticon-cool-outline' },
  'm-hopeful': { kind: 'mci', name: 'emoticon-wink-outline' },
  'm-excited': { kind: 'mci', name: 'emoticon-excited-outline' },
  'm-stressed': { kind: 'mci', name: 'emoticon-confused-outline' },
  'm-anxious': { kind: 'mci', name: 'emoticon-frown-outline' },
  'm-overwhelmed': { kind: 'mci', name: 'emoticon-dead-outline' },
  'm-sad': { kind: 'mci', name: 'emoticon-sad-outline' },
  'm-angry': { kind: 'mci', name: 'emoticon-angry-outline' },
  'm-exhausted': { kind: 'ion', name: 'bed' },
};

export type AppIconName = keyof typeof REGISTRY;

/** Bare semantic names (legacy Lottie aliases) → design-system vectors. */
const NAME_ALIASES: Record<string, RegistryEntry> = {
  heart: { kind: 'ion', name: 'heart' },
  star: { kind: 'ion', name: 'star' },
  book: { kind: 'ion', name: 'book' },
  journal: { kind: 'ion', name: 'book' },
  doc: { kind: 'ion', name: 'document-text' },
  write: { kind: 'ion', name: 'create' },
  eye: { kind: 'ion', name: 'eye' },
  ear: { kind: 'ion', name: 'ear' },
  mic: { kind: 'ion', name: 'mic' },
  calm: { kind: 'ion', name: 'leaf' },
  meditate: { kind: 'ion', name: 'flower' },
  breathe: { kind: 'mci', name: 'weather-windy' },
  pulse: { kind: 'ion', name: 'pulse' },
  walk: { kind: 'ion', name: 'walk' },
  gift: { kind: 'ion', name: 'gift' },
  gratitude: { kind: 'ion', name: 'gift' },
  chart: { kind: 'ion', name: 'stats-chart' },
  stats: { kind: 'ion', name: 'stats-chart' },
  camera: { kind: 'ion', name: 'camera' },
  trash: { kind: 'ion', name: 'trash' },
  bell: { kind: 'ion', name: 'notifications' },
  lock: { kind: 'ion', name: 'lock-closed' },
  clock: { kind: 'ion', name: 'time' },
  time: { kind: 'ion', name: 'time' },
};

interface AppIconProps {
  name: AppIconName | string;
  size?: number;
  color?: string;
  /** @deprecated No-op — the icon set is static vector-only. */
  loop?: boolean;
  /** @deprecated No-op — the icon set is static vector-only. */
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

function resolveEntry(name: string): RegistryEntry {
  // 1. Exact match in static registry
  if (REGISTRY[name]) {
    return REGISTRY[name];
  }

  // 2. Bare semantic alias
  if (NAME_ALIASES[name]) {
    return NAME_ALIASES[name];
  }

  // 3. i- prefix matching an Ionicons glyph
  if (name.startsWith('i-')) {
    return { kind: 'ion', name: name.slice(2) as IonName };
  }

  // 4. m- prefix matching MaterialCommunityIcons glyph
  if (name.startsWith('m-')) {
    return { kind: 'mci', name: name.slice(2) as MciName };
  }

  // 5. Default to Ionicons using safe name
  const safeName = (name && typeof name === 'string' && name.trim()) ? name.trim() : 'leaf-outline';
  return { kind: 'ion', name: safeName as IonName };
}

export function AppIcon({
  name,
  size = 24,
  color,
  style,
}: AppIconProps) {
  const { colors, isDark } = useAppTheme();

  // Contrast protection: calculate high-contrast color for light vs dark mode
  let resolvedColor = color ?? colors.text.primary;

  // If a caller passed dark low-contrast colors in dark mode, elevate them to visible light tone
  if (isDark && (resolvedColor === '#425474' || resolvedColor === '#1E2522' || resolvedColor === '#1A212D' || resolvedColor === '#000000')) {
    resolvedColor = '#EDE8E1';
  }

  const entry = resolveEntry(name);

  return (
    <View
      style={[
        { width: size, height: size, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      {entry.kind === 'ion' ? (
        <Ionicons name={entry.name} size={size} color={resolvedColor} />
      ) : (
        <MaterialCommunityIcons name={entry.name} size={size} color={resolvedColor} />
      )}
    </View>
  );
}

/** Mood id (as stored in the DB) → registry key for its static face. */
export function moodIcon(moodId: string | undefined | null): AppIconName {
  switch (moodId) {
    case 'happy': return 'm-happy';
    case 'peaceful': return 'm-peaceful';
    case 'grateful': return 'm-grateful';
    case 'content': return 'm-content';
    case 'hopeful': return 'm-hopeful';
    case 'excited': return 'm-excited';
    case 'stressed': return 'm-stressed';
    case 'anxious': return 'm-anxious';
    case 'overwhelmed': return 'm-overwhelmed';
    case 'sad': return 'm-sad';
    case 'angry': return 'm-angry';
    case 'exhausted': return 'm-exhausted';
    default: return 'm-happy';
  }
}
