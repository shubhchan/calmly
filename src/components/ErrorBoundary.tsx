import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';

// Keep in sync with app.json -> expo.version
const APP_VERSION = '1.0.0';

/**
 * Boot trail: launch-stage markers. Every marker is console.log'd (visible in
 * `adb logcat` as ReactNativeJS) AND kept in memory so the nav watchdog can
 * paste the trail into its report. If the app ever sits on a blank screen,
 * this trail tells us exactly how far launch got.
 */
const bootTrail: string[] = [];

export function bootLog(stage: string) {
  const entry = `${new Date().toISOString()} ${stage}`;
  bootTrail.push(entry);
  try {
    console.log(`[calmly boot] ${stage}`);
  } catch {
    // logging must never crash the app
  }
}

export function getBootTrail(): string[] {
  return [...bootTrail];
}

interface CrashInfo {
  error: any;
  /** Where the error was caught: React render tree vs. uncaught JS (async/handlers/natives callbacks). */
  where: 'render' | 'uncaught-js';
  componentStack?: string | null;
  isFatal?: boolean;
}

function getMessage(error: any): string {
  if (error == null) return 'Unknown error (empty error object)';
  if (typeof error === 'string') return error;
  return error.message ?? String(error);
}

function getStack(error: any): string {
  if (error == null) return '(no stack available)';
  return error.stack ?? '(no stack available)';
}

/**
 * Single copy-paste-ready report. The user taps "Copy error", pastes it here,
 * and we get everything needed to fix it: what broke, where, on what device.
 */
export function buildErrorReport(info: CrashInfo): string {
  const lines = [
    'CALMLY CRASH REPORT — paste to dev for fix',
    `time: ${new Date().toISOString()}`,
    `app: calmly ${APP_VERSION} (expo sdk 57)`,
    `platform: ${Platform.OS} ${String(Platform.Version ?? '')}`,
    `where: ${info.where}${info.isFatal === true ? ' (fatal)' : ''}`,
    `message: ${getMessage(info.error)}`,
    `componentStack: ${info.componentStack ?? '(n/a)'}`,
    `jsStack: ${getStack(info.error)}`,
  ];
  return lines.join('\n');
}

export function CrashScreen({ info, onReset }: { info: CrashInfo; onReset: () => void }) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const copyReport = async () => {
    try {
      await Clipboard.setStringAsync(buildErrorReport(info));
      setCopied(true);
      setCopyFailed(false);
    } catch (e) {
      // Clipboard can fail (denied permission, web quirks) — the text below
      // is selectable so it can still be long-press copied manually.
      console.warn('Copy to clipboard failed:', e);
      setCopyFailed(true);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#1E232E', paddingTop: 60, paddingHorizontal: 20 }}>
      <Text style={{ color: '#FDFBF7', fontSize: 18, fontWeight: '700', marginBottom: 8 }}>
        Something crashed — don&apos;t worry, the error is below
      </Text>
      <Text style={{ color: '#C3D7EB', fontSize: 13, marginBottom: 12 }}>
        Tap “Copy error”, then paste it to the developer. Nothing else is needed.
      </Text>

      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
        <Pressable
          onPress={copyReport}
          style={{ backgroundColor: '#5A955A', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, marginRight: 10 }}
        >
          <Text style={{ color: '#FDFBF7', fontWeight: '700' }}>
            {copied ? 'Copied ✓ — paste it now' : 'Copy error'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            setCopied(false);
            onReset();
          }}
          style={{ backgroundColor: '#293143', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10 }}
        >
          <Text style={{ color: '#FDFBF7', fontWeight: '700' }}>Try again</Text>
        </Pressable>
      </View>

      {copyFailed ? (
        <Text style={{ color: '#EF9F8A', fontSize: 13, marginBottom: 8 }}>
          Auto-copy failed — long-press the text below to copy it manually.
        </Text>
      ) : null}

      <ScrollView style={{ flex: 1 }}>
        <Text selectable style={{ color: '#EF8799', fontSize: 14, marginBottom: 6 }}>
          {info.where === 'render' ? '[render crash]' : '[uncaught js error]'}{' '}
          {getMessage(info.error)}
        </Text>
        <Text selectable style={{ color: '#C3D7EB', fontSize: 12, fontFamily: 'monospace' }}>
          {buildErrorReport(info)}
        </Text>
      </ScrollView>
    </View>
  );
}

interface Props {
  children: React.ReactNode;
}

interface State {
  crash: CrashInfo | null;
}

/**
 * Catches React render/lifecycle crashes anywhere below it and prints a
 * copy-ready report on-screen instead of the native grey/blank view.
 * Pair with <GlobalErrorShield> (below) to also cover uncaught-JS crashes.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { crash: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { crash: { error, where: 'render' } };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('App crashed:', error, info.componentStack);
    this.setState((prev) =>
      prev.crash
        ? { crash: { ...prev.crash, componentStack: info.componentStack } }
        : prev,
    );
  }

  render() {
    if (this.state.crash) {
      return (
        <CrashScreen
          info={this.state.crash}
          onReset={() => this.setState({ crash: null })}
        />
      );
    }
    return this.props.children;
  }
}

/**
 * Catches uncaught JS errors that ErrorBoundary CANNOT see: async callbacks,
 * event handlers, timers, native-event callbacks. Without this, those die
 * silently (grey screen, nothing tappable). Renders the same copy-ready
 * screen so every bug is reportable.
 */
export function GlobalErrorShield({ children }: Props) {
  const [crash, setCrash] = useState<CrashInfo | null>(null);

  useEffect(() => {
    const EU = (globalThis as any)?.ErrorUtils;
    if (!EU?.setGlobalHandler) return;
    let prevHandler: any = null;
    try {
      prevHandler = EU.getGlobalHandler?.();
    } catch {
      prevHandler = null;
    }

    const handler = (error: any, isFatal?: boolean) => {
      try {
        console.error('[GlobalErrorShield] uncaught error:', error);
      } catch {
        // never throw from the error handler itself
      }
      // Keep the first crash (avoid loops if the crash screen itself errors —
      // that case is owned by the outer ErrorBoundary).
      setCrash((prev) => prev ?? { error, where: 'uncaught-js', isFatal });
      // In dev, still forward to the default handler so RedBox/LogBox works.
      const isDev = (globalThis as any)?.__DEV__ === true;
      if (isDev && typeof prevHandler === 'function') {
        try {
          prevHandler(error, isFatal);
        } catch {
          // ignore
        }
      }
    };

    try {
      EU.setGlobalHandler(handler);
    } catch {
      // If we can't install, render-tree boundary still covers render bugs.
    }
    return () => {
      try {
        if (prevHandler) EU.setGlobalHandler(prevHandler);
      } catch {
        // ignore
      }
    };
  }, []);

  if (crash) {
    return <CrashScreen info={crash} onReset={() => setCrash(null)} />;
  }
  return <>{children}</>;
}
