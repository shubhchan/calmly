import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { settingsRepository } from '../database/repositories/settingsRepository';
import { AppState, AppStateStatus, Platform } from 'react-native';

export interface LockState {
  isLocked: boolean;
  requiresAuth: boolean;
}

class AppLockService {
  private lockState: LockState = { isLocked: false, requiresAuth: false };
  private listeners: ((state: LockState) => void)[] = [];
  private autoLockTimer: ReturnType<typeof setTimeout> | null = null;
  private lastActiveTime: number = Date.now();
  private initialized = false;
  private appStateSubscription: { remove: () => void } | null = null;

  constructor() {
    // Never throw from the constructor: settingsRepository touches WatermelonDB,
    // which may be unavailable. A lock-service failure must never grey-screen
    // the app, so init errors fall back to "unlocked".
    this.init().catch((error) => {
      console.warn('AppLock init failed, continuing unlocked:', error);
    });
    // Auto-lock is driven by app state: JS timers are suspended while the app
    // is backgrounded, so elapsed time is evaluated again on resume.
    try {
      this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    } catch (error) {
      console.warn('AppLock could not subscribe to AppState:', error);
    }
  }

  private handleAppStateChange = async (nextState: AppStateStatus) => {
    try {
      if (nextState === 'active') {
        const settings = await settingsRepository.getSettings();
        const lockEnabled = settings.pinEnabled || settings.biometricEnabled;
        if (!lockEnabled) return;
        const minutes = Number.isFinite(settings.autoLockMinutes) ? settings.autoLockMinutes : 5;
        if (minutes === 0) {
          if (!this.lockState.isLocked) await this.lock();
        } else if (!this.lockState.isLocked && Date.now() - this.lastActiveTime >= minutes * 60 * 1000) {
          await this.lock();
        }
        this.lastActiveTime = Date.now();
        this.startAutoLockTimer(minutes);
      } else if (nextState === 'background') {
        const settings = await settingsRepository.getSettings();
        const lockEnabled = settings.pinEnabled || settings.biometricEnabled;
        if (lockEnabled && (settings.autoLockMinutes ?? 5) === 0 && !this.lockState.isLocked) {
          await this.lock();
        }
      }
    } catch (error) {
      console.warn('AppLock AppState handling failed:', error);
    }
  };

  private async init() {
    try {
      const settings = await settingsRepository.getSettings();
      this.lockState = {
        isLocked: settings.pinEnabled || settings.biometricEnabled,
        requiresAuth: settings.pinEnabled || settings.biometricEnabled,
      };
      this.startAutoLockTimer(settings.autoLockMinutes);
      await this.setScreenProtection({
        allowScreenshots: settings.allowScreenshots !== false,
        hideInSwitcher: settings.hideContentInSwitcher !== false,
      });
    } catch (error) {
      console.warn('AppLock init failed, continuing unlocked:', error);
    } finally {
      this.initialized = true;
    }
  }

  subscribe(listener: (state: LockState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => {
      try {
        l(this.lockState);
      } catch (error) {
        console.warn('AppLock listener failed:', error);
      }
    });
  }

  private startAutoLockTimer(minutes: number) {
    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer);
      this.autoLockTimer = null;
    }
    if (minutes > 0) {
      this.autoLockTimer = setTimeout(() => {
        this.lock().catch((error) => console.warn('AppLock auto-lock failed:', error));
      }, minutes * 60 * 1000);
    }
  }

  async recordActivity() {
    this.lastActiveTime = Date.now();
    try {
      const settings = await settingsRepository.getSettings();
      this.startAutoLockTimer(settings.autoLockMinutes);
    } catch (error) {
      console.warn('AppLock recordActivity failed:', error);
    }
  }

  async refresh() {
    try {
      const settings = await settingsRepository.getSettings();
      const lockEnabled = settings.pinEnabled || settings.biometricEnabled;
      if (!lockEnabled && (this.lockState.isLocked || this.lockState.requiresAuth)) {
        this.lockState = { isLocked: false, requiresAuth: false };
        this.notify();
      }
      this.startAutoLockTimer(settings.autoLockMinutes);
    } catch (error) {
      console.warn('AppLock refresh failed:', error);
    }
  }

  async lock() {
    try {
      const settings = await settingsRepository.getSettings();
      if (settings.pinEnabled || settings.biometricEnabled) {
        this.lockState = { isLocked: true, requiresAuth: true };
        this.notify();
      }
    } catch (error) {
      console.warn('AppLock lock failed:', error);
    }
  }

  private async completeUnlock() {
    this.lockState = { isLocked: false, requiresAuth: false };
    this.lastActiveTime = Date.now();
    try {
      const settings = await settingsRepository.getSettings();
      this.startAutoLockTimer(settings.autoLockMinutes);
    } catch (error) {
      console.warn('AppLock unlock timer reset failed:', error);
    }
    this.notify();
  }

  async unlockWithPin(pin: string): Promise<boolean> {
    try {
      const valid = await this.verifyPin(pin);
      if (!valid) return false;
      await this.completeUnlock();
      return true;
    } catch (error) {
      console.warn('AppLock PIN unlock failed:', error);
      return false;
    }
  }

  async unlockWithBiometric(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') return false;
      const settings = await settingsRepository.getSettings();
      if (!settings.biometricEnabled) return false;
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Calmly',
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
      });
      if (result.success) {
        await this.completeUnlock();
        return true;
      }
      return false;
    } catch (error) {
      console.warn('AppLock biometric unlock failed:', error);
      return false;
    }
  }

  async verifyPin(pin: string): Promise<boolean> {
    try {
      return await settingsRepository.verifyPin(pin);
    } catch (error) {
      console.warn('AppLock verifyPin failed:', error);
      return false;
    }
  }

  async setScreenProtection(options: { allowScreenshots: boolean; hideInSwitcher: boolean }): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const ScreenCapture = require('expo-screen-capture');
      if (!ScreenCapture) return;
      if (Platform.OS === 'ios') {
        if (ScreenCapture.enableAppSwitcherProtectionAsync) {
          if (options.hideInSwitcher) {
            await ScreenCapture.enableAppSwitcherProtectionAsync(0.6);
          } else {
            await ScreenCapture.disableAppSwitcherProtectionAsync?.();
          }
        }
        return;
      }
      // Android: FLAG_SECURE blocks screenshots entirely (and blanks the
      // recents preview), so the user-facing "Allow Screenshots" setting
      // decides whether the block is active.
      if (options.allowScreenshots) {
        await ScreenCapture.allowScreenCaptureAsync?.('calmly-privacy');
      } else {
        await ScreenCapture.preventScreenCaptureAsync?.('calmly-privacy');
      }
    } catch (error) {
      console.warn('AppLock screen protection unavailable:', error);
    }
  }

  getState(): LockState {
    return this.lockState;
  }

  isLocked(): boolean {
    return this.lockState.isLocked;
  }

  cleanup() {
    if (this.autoLockTimer) {
      clearTimeout(this.autoLockTimer);
    }
    try {
      this.appStateSubscription?.remove?.();
    } catch (error) {
      console.warn('AppLock AppState unsubscribe failed:', error);
    }
    this.appStateSubscription = null;
  }
}

export const appLockService = new AppLockService();

export function useAppLock() {
  const [state, setState] = useState<LockState>(appLockService.getState());

  useEffect(() => {
    const unsubscribe = appLockService.subscribe(setState);
    return unsubscribe;
  }, []);

  return {
    ...state,
    lock: () => appLockService.lock(),
    unlockWithPin: (pin: string) => appLockService.unlockWithPin(pin),
    unlockWithBiometric: () => appLockService.unlockWithBiometric(),
    verifyPin: (pin: string) => appLockService.verifyPin(pin),
    recordActivity: () => appLockService.recordActivity(),
  };
}
