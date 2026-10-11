import React, { useEffect } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import LottieView from 'lottie-react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useThemeColors } from '../theme/ThemeContext';

type IonName = React.ComponentProps<typeof Ionicons>['name'];
type MciName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// Bundled Lordicon Lottie sources (free collection, see Lordicon credit in Settings).
const LOTTIE = {
  heart: require('../../assets/lordicons/heart.json'),
  star: require('../../assets/lordicons/star.json'),
  book: require('../../assets/lordicons/book.json'),
  doc: require('../../assets/lordicons/doc.json'),
  write: require('../../assets/lordicons/write.json'),
  eye: require('../../assets/lordicons/eye.json'),
  ear: require('../../assets/lordicons/ear.json'),
  mic: require('../../assets/lordicons/mic.json'),
  calm: require('../../assets/lordicons/calm.json'),
  hands: require('../../assets/lordicons/hands.json'),
  pin: require('../../assets/lordicons/pin.json'),
  pulse: require('../../assets/lordicons/pulse.json'),
  expand: require('../../assets/lordicons/expand.json'),
  walk: require('../../assets/lordicons/walk.json'),
  gift: require('../../assets/lordicons/gift.json'),
  chart: require('../../assets/lordicons/chart.json'),
  camera: require('../../assets/lordicons/camera.json'),
  trash: require('../../assets/lordicons/trash.json'),
  bell: require('../../assets/lordicons/bell.json'),
  lock: require('../../assets/lordicons/lock.json'),
  clock: require('../../assets/lordicons/clock.json'),
} as const;

type LottieName = keyof typeof LOTTIE;

type RegistryEntry =
  | { kind: 'lottie'; asset: LottieName }
  | { kind: 'ion'; name: IonName }
  | { kind: 'mci'; name: MciName };

const REGISTRY: Record<string, RegistryEntry> = {
  // Lordicon animated
  'l-heart': { kind: 'lottie', asset: 'heart' },
  'l-star': { kind: 'lottie', asset: 'star' },
  'l-book': { kind: 'lottie', asset: 'book' },
  'l-doc': { kind: 'lottie', asset: 'doc' },
  'l-write': { kind: 'lottie', asset: 'write' },
  'l-eye': { kind: 'lottie', asset: 'eye' },
  'l-ear': { kind: 'lottie', asset: 'ear' },
  'l-mic': { kind: 'lottie', asset: 'mic' },
  'l-calm': { kind: 'lottie', asset: 'calm' },
  'l-hands': { kind: 'lottie', asset: 'hands' },
  'l-pin': { kind: 'lottie', asset: 'pin' },
  'l-pulse': { kind: 'lottie', asset: 'pulse' },
  'l-expand': { kind: 'lottie', asset: 'expand' },
  'l-walk': { kind: 'lottie', asset: 'walk' },
  'l-gift': { kind: 'lottie', asset: 'gift' },
  'l-chart': { kind: 'lottie', asset: 'chart' },
  'l-camera': { kind: 'lottie', asset: 'camera' },
  'l-trash': { kind: 'lottie', asset: 'trash' },
  'l-bell': { kind: 'lottie', asset: 'bell' },
  'l-lock': { kind: 'lottie', asset: 'lock' },
  'l-clock': { kind: 'lottie', asset: 'clock' },

  // Sensory & semantic aliases
  'l-breathe': { kind: 'lottie', asset: 'expand' },
  'l-meditate': { kind: 'lottie', asset: 'calm' },
  'l-streak': { kind: 'lottie', asset: 'star' },
  'l-stats': { kind: 'lottie', asset: 'chart' },
  'l-time': { kind: 'lottie', asset: 'clock' },
  'l-habits': { kind: 'lottie', asset: 'walk' },
  'l-gratitude': { kind: 'lottie', asset: 'gift' },
  'l-journal': { kind: 'lottie', asset: 'book' },
  'l-love': { kind: 'lottie', asset: 'heart' },
  'l-sound': { kind: 'lottie', asset: 'ear' },
  'l-hear': { kind: 'lottie', asset: 'ear' },
  'l-see': { kind: 'lottie', asset: 'eye' },
  'l-touch': { kind: 'lottie', asset: 'hands' },

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

interface AppIconProps {
  name: AppIconName | string;
  size?: number;
  /** Applies to vector icons; Lottie colors are baked in. */
  color?: string;
  /** Lottie looping. Default true. */
  loop?: boolean;
  /** Gentle organic breathing animation for vector icons. Default true. */
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}

function resolveEntry(name: string): RegistryEntry {
  // 1. Exact match in static registry
  if (REGISTRY[name]) {
    return REGISTRY[name];
  }

  // 2. Direct Lottie asset name
  if (name in LOTTIE) {
    return { kind: 'lottie', asset: name as LottieName };
  }

  // 3. l- prefix matching a Lottie asset
  if (name.startsWith('l-')) {
    const assetKey = name.slice(2);
    if (assetKey in LOTTIE) {
      return { kind: 'lottie', asset: assetKey as LottieName };
    }
  }

  // 4. i- prefix matching an Ionicons glyph
  if (name.startsWith('i-')) {
    return { kind: 'ion', name: name.slice(2) as IonName };
  }

  // 5. m- prefix matching MaterialCommunityIcons glyph
  if (name.startsWith('m-')) {
    return { kind: 'mci', name: name.slice(2) as MciName };
  }

  // 6. Common semantic names to animated Lottie
  const semanticLottie: Record<string, LottieName> = {
    heart: 'heart',
    star: 'star',
    book: 'book',
    journal: 'book',
    doc: 'doc',
    write: 'write',
    eye: 'eye',
    ear: 'ear',
    mic: 'mic',
    calm: 'calm',
    meditate: 'calm',
    breathe: 'expand',
    pulse: 'pulse',
    walk: 'walk',
    gift: 'gift',
    gratitude: 'gift',
    chart: 'chart',
    stats: 'chart',
    camera: 'camera',
    trash: 'trash',
    bell: 'bell',
    lock: 'lock',
    clock: 'clock',
    time: 'clock',
  };
  if (semanticLottie[name]) {
    return { kind: 'lottie', asset: semanticLottie[name] };
  }

  // 7. Default to Ionicons using safe name
  const safeName = (name && typeof name === 'string' && name.trim()) ? name.trim() : 'leaf-outline';
  return { kind: 'ion', name: safeName as IonName };
}

function AnimatedVectorWrapper({
  children,
  size,
  animated = true,
  style,
}: {
  children: React.ReactNode;
  size?: number;
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (animated) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.09, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: 1800, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      scale.value = 1;
    }
  }, [animated, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const containerStyle: ViewStyle = {
    alignItems: 'center',
    justifyContent: 'center',
    ...(size ? { width: size, height: size } : {}),
  };

  if (!animated) {
    return <Animated.View style={[containerStyle, style]}>{children}</Animated.View>;
  }

  return (
    <Animated.View style={[animatedStyle, containerStyle, style]}>
      {children}
    </Animated.View>
  );
}

export function AppIcon({
  name,
  size = 24,
  color,
  loop = true,
  animated = true,
  style,
}: AppIconProps) {
  let themeColors: any;
  let isDark = false;
  try {
    themeColors = useThemeColors();
    isDark = !!themeColors?.isDark;
  } catch {
    themeColors = null;
  }

  // Contrast protection: calculate high-contrast color for light vs dark mode
  const defaultContrast = isDark ? '#EDE8E1' : '#272421';
  let resolvedColor = color ?? themeColors?.textPrimary ?? defaultContrast;

  // If a caller passed dark low-contrast colors in dark mode, elevate them to visible light tone
  if (isDark && (resolvedColor === '#425474' || resolvedColor === '#1E2522' || resolvedColor === '#1A212D' || resolvedColor === '#000000')) {
    resolvedColor = '#EDE8E1';
  }

  const entry = resolveEntry(name);

  if (entry.kind === 'lottie') {
    return (
      <LottieView
        source={LOTTIE[entry.asset]}
        autoPlay
        loop={loop}
        style={[{ width: size, height: size }, style] as any}
      />
    );
  }

  if (entry.kind === 'ion') {
    return (
      <AnimatedVectorWrapper size={size} animated={animated} style={style}>
        <Ionicons name={entry.name} size={size} color={resolvedColor} />
      </AnimatedVectorWrapper>
    );
  }

  return (
    <AnimatedVectorWrapper size={size} animated={animated} style={style}>
      <MaterialCommunityIcons name={entry.name} size={size} color={resolvedColor} />
    </AnimatedVectorWrapper>
  );
}

/** Mood id (as stored in the DB) → registry key for its face or animated icon. */
export function moodIcon(moodId: string | undefined | null): AppIconName {
  switch (moodId) {
    case 'happy': return 'm-happy';
    case 'peaceful': return 'm-peaceful';
    case 'grateful': return 'l-heart';
    case 'content': return 'm-content';
    case 'hopeful': return 'm-hopeful';
    case 'excited': return 'l-star';
    case 'stressed': return 'm-stressed';
    case 'anxious': return 'm-anxious';
    case 'overwhelmed': return 'm-overwhelmed';
    case 'sad': return 'm-sad';
    case 'angry': return 'm-angry';
    case 'exhausted': return 'm-exhausted';
    default: return 'l-heart';
  }
}
