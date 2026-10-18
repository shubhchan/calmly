import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sizes } from '../theme/tokens';

export function useTabBarOffset() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const inTabs = navigation?.getParent?.()?.getState?.()?.type === 'tab';
  if (!inTabs) return 0;
  return sizes.tabBarHeight + (insets.bottom > 0 ? insets.bottom : 10);
}
