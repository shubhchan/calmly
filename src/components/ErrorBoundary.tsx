import React from 'react';
import { View, Text, ScrollView } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * A silent "gray screen, nothing else" almost always means a JS exception was
 * thrown during the initial render, before any UI mounted — and React Native's
 * default behavior in a release build (no LogBox/red-box) is to just show the
 * native root view's blank background with no indication anything went wrong.
 * This boundary catches that and prints the real error on-screen instead, so
 * a crash is diagnosable from the device itself, not just from Metro's log.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#1E232E', paddingTop: 60, paddingHorizontal: 20 }}>
          <Text style={{ color: '#FDFBF7', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>
            Something crashed
          </Text>
          <ScrollView>
            <Text style={{ color: '#EF8799', fontSize: 14, marginBottom: 16 }}>
              {this.state.error.message}
            </Text>
            <Text style={{ color: '#C3D7EB', fontSize: 12, fontFamily: 'monospace' }}>
              {this.state.error.stack}
            </Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}
