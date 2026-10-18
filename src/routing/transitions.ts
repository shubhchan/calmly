import { Platform } from 'react-native';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';

/**
 * One transition matrix for every route in Calmly.
 *
 * Native-first: route entry/exit animations are driven by the platform's
 * native stack so they stay on the render thread (gesture-parallax included),
 * and the choices below are applied identically to the root stack and every
 * tab stack so navigation always feels the same wherever you are.
 *
 * When reduced motion is on (OS setting or the in-app toggle), all route
 * animations collapse to 'none' — content still crossfades via
 * ScreenContainer / ContentReveal.
 */

/** Standard pushed pages: horizontal slide (Android) / platform push (iOS). */
export function pushTransition(reducedMotion: boolean): NativeStackNavigationOptions {
  return {
    headerShown: false,
    gestureEnabled: !reducedMotion,
    animation: reducedMotion ? 'none' : Platform.OS === 'ios' ? 'default' : 'slide_from_right',
  };
}

/** Introspective modals & forms: soft bottom sheet. */
export function modalTransition(reducedMotion: boolean): NativeStackNavigationOptions {
  return {
    headerShown: false,
    gestureEnabled: !reducedMotion,
    presentation: 'modal',
    animation: reducedMotion ? 'none' : 'slide_from_bottom',
  };
}

/** Immersive somatic focus modes (breathing, grounding, panic SOS): quiet fade. */
export function immersiveTransition(reducedMotion: boolean): NativeStackNavigationOptions {
  return {
    headerShown: false,
    gestureEnabled: !reducedMotion,
    presentation: 'fullScreenModal',
    animation: reducedMotion ? 'none' : 'fade',
  };
}

/**
 * Tab switches: instant swap.
 *
 * A scene cross-fade here dims BOTH pages over the container background and
 * double-fades with each screen's own content entrance, which reads as a
 * flash. Instead the new page paints immediately — opaque, themed, with its
 * shimmering skeletons already in place — and content fades in on its own.
 */
export function tabTransition() {
  return {
    headerShown: false,
    animation: 'none' as const,
  };
}
