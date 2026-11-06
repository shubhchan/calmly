/**
 * Imperative, design-system alert bridge.
 *
 * Replaces React Native's native `Alert` while keeping the same call shape:
 *
 *   Alert.alert(title, message, buttons, options)
 *   Alert.prompt(title, message, buttons, type, defaultValue)
 *
 * Requests are queued here and rendered by `AppAlertHost`, so every alert in
 * the app uses the themed modal instead of the platform dialog.
 */

export type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

export interface AlertButton {
  text?: string;
  style?: AlertButtonStyle;
  onPress?: (value?: string) => void | Promise<void>;
}

export interface AlertOptions {
  cancelable?: boolean;
  onDismiss?: () => void;
}

export interface AlertPromptConfig {
  defaultValue?: string;
  secureTextEntry?: boolean;
}

export interface AlertRequest {
  id: number;
  title: string;
  message?: string;
  buttons: AlertButton[];
  cancelable: boolean;
  onDismiss?: () => void;
  prompt?: AlertPromptConfig;
}

let active: AlertRequest | null = null;
let nextId = 1;
const pending: AlertRequest[] = [];
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function showNext() {
  active = pending.shift() ?? null;
  emit();
}

function enqueue(request: Omit<AlertRequest, 'id'>) {
  const next: AlertRequest = { ...request, id: nextId++ };
  if (active) {
    pending.push(next);
  } else {
    active = next;
  }
  emit();
}

export function subscribeToAlerts(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getActiveAlert(): AlertRequest | null {
  return active;
}

/** Close the active alert without choosing a button. */
export function dismissAlert() {
  if (!active) return;
  const onDismiss = active.onDismiss;
  showNext();
  onDismiss?.();
}

/** Choose a button on the active alert. Runs its callback after closing. */
export function pressAlertButton(index: number, value?: string) {
  if (!active) return;
  const button = active.buttons[index];
  showNext();
  if (!button?.onPress) return;
  try {
    const result = button.onPress(value);
    if (result && typeof (result as Promise<void>).catch === 'function') {
      (result as Promise<void>).catch((error) => {
        console.error('Alert action failed:', error);
      });
    }
  } catch (error) {
    console.error('Alert action failed:', error);
  }
}

export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[], options?: AlertOptions) {
    enqueue({
      title,
      message,
      buttons: buttons?.length ? buttons : [{ text: 'OK' }],
      cancelable: options?.cancelable !== false,
      onDismiss: options?.onDismiss,
    });
  },

  prompt(
    title: string,
    message?: string,
    callbackOrButtons?: ((text?: string) => void) | AlertButton[],
    type?: 'default' | 'plain-text' | 'secure-text' | 'login-password',
    defaultValue?: string,
    _keyboardType?: string,
    options?: AlertOptions,
  ) {
    const buttons: AlertButton[] = typeof callbackOrButtons === 'function'
      ? [
          { text: 'Cancel', style: 'cancel' },
          { text: 'OK', onPress: callbackOrButtons },
        ]
      : callbackOrButtons?.length
        ? callbackOrButtons
        : [{ text: 'OK' }];

    enqueue({
      title,
      message,
      buttons,
      cancelable: options?.cancelable !== false,
      onDismiss: options?.onDismiss,
      prompt: {
        defaultValue,
        secureTextEntry: type === 'secure-text' || type === 'login-password',
      },
    });
  },
};
