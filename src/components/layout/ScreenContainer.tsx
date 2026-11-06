import React, { useCallback, useContext, useSyncExternalStore } from 'react';
import { Platform, RefreshControlProps, ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { NavigationContainerRefContext, NavigationContext } from '@react-navigation/native';
import { SharedTransitionBoundary } from 'react-native-reanimated';
import { useAppTheme } from '../../theme/ThemeContext';

function useSafeIsFocused(): boolean {
  const root = useContext(NavigationContainerRefContext);
  const navigation = useContext(NavigationContext);
  const nav: any = navigation ?? root;

  const subscribe = useCallback(
    (callback: () => void) => {
      if (!nav?.addListener) return () => { };
      const unsubscribeFocus = nav.addListener('focus', callback);
      const unsubscribeBlur = nav.addListener('blur', callback);
      return () => {
        unsubscribeFocus?.();
        unsubscribeBlur?.();
      };
    },
    [nav]
  );

  const getSnapshot = useCallback(() => {
    return nav?.isFocused ? nav.isFocused() : true;
  }, [nav]);

  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}

function WebBoundary({ children }: { isActive: boolean; children?: React.ReactNode }) {
  return <>{children}</>;
}

const Boundary = Platform.OS === 'web' ? WebBoundary : SharedTransitionBoundary;

interface ScreenContainerProps {
  children: React.ReactNode;
  /** Wrap children in a ScrollView (default). Set false for custom scrolling UIs. */
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Override the themed surface (e.g. immersive calm modes). */
  backgroundColor?: string;
  /** @deprecated Entrance motion is owned by the native route transition. */
  animate?: boolean;
  /** Bottom padding for tab-bar clearance (default 110). */
  bottomPadding?: number;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  showsVerticalScrollIndicator?: boolean;
}

/**
 * The one screen scaffold every route uses.
 *
 * Route entry and exit are the only animations a screen plays, and the native
 * stack owns them. This container paints the themed surface opaque from the
 * first frame and renders content statically, so nothing double-animates or
 * jitters underneath the native transition.
 */
export function ScreenContainer({
  children,
  scroll = true,
  style,
  contentContainerStyle,
  backgroundColor,
  animate: _animate,
  bottomPadding = 110,
  refreshControl,
  keyboardShouldPersistTaps,
  showsVerticalScrollIndicator,
}: ScreenContainerProps) {
  const { colors } = useAppTheme();
  const isFocused = useSafeIsFocused();

  const surfaceStyle: StyleProp<ViewStyle> = {
    flex: 1,
    backgroundColor: backgroundColor ?? colors.background.default,
  };

  if (!scroll) {
    return (
      <Boundary isActive={isFocused}>
        <View style={surfaceStyle}>
          <View style={[{ flex: 1 }, style]}>{children}</View>
        </View>
      </Boundary>
    );
  }

  return (
    <Boundary isActive={isFocused}>
      <View style={surfaceStyle}>
        <ScrollView
          style={[{ flex: 1 }, style]}
          contentContainerStyle={[{ paddingBottom: bottomPadding }, contentContainerStyle]}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator ?? false}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps ?? 'handled'}
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      </View>
    </Boundary>
  );
}
