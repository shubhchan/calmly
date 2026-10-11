import 'nativewind';
import 'react-native';

declare module '*.css';

declare module 'react-native' {
  interface ViewProps {
    className?: string;
  }
  interface TextProps {
    className?: string;
  }
  interface ImageProps {
    className?: string;
  }
  interface ScrollViewProps {
    className?: string;
  }
  interface TextInputProps {
    className?: string;
  }
  interface PressableProps {
    className?: string;
  }
  interface TouchableOpacityProps {
    className?: string;
  }
  interface TouchableHighlightProps {
    className?: string;
  }
  interface TouchableWithoutFeedbackProps {
    className?: string;
  }
  interface SwitchProps {
    className?: string;
  }
  interface ModalProps {
    className?: string;
  }
  interface SafeAreaViewProps {
    className?: string;
  }
  interface KeyboardAvoidingViewProps {
    className?: string;
  }
  interface FlatListProps<ItemT> {
    className?: string;
  }
  interface SectionListProps<ItemT> {
    className?: string;
  }
  interface ActivityIndicatorProps {
    className?: string;
  }
  interface RefreshControlProps {
    className?: string;
  }
  interface StatusBarProps {
    className?: string;
  }
}

declare module 'react-native-gesture-handler' {
  interface PanGestureHandlerProps {
    className?: string;
  }
  interface TapGestureHandlerProps {
    className?: string;
  }
  interface LongPressGestureHandlerProps {
    className?: string;
  }
}