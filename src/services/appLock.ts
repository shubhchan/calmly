import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { settingsRepository } from '../database/repositories/settingsRepository';
import { Platform } from 'react-native';

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

  constructor() {
    // Never throw from the constructor: settingsRepository touches WatermelonDB,
    // which may be unavailable. A lock-service failure must never grey-screen
    // the app, so init errors fall back to "unlocked".
    this.init().catch((error) => {
      console.warn('AppLock init failed, continuing unlocked:', error);
    });
  }

  private async init() {
    try {
      const settings = await settingsRepository.getSettings();
      this.lockState = {
        isLocked: settings.pinEnabled || settings.biometricEnabled,
        requiresAuth: settings.pinEnabled || settings.biometricEnabled,
      };
      this.startAutoLockTimer(settings.autoLockMinutes);
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

  async unlock(authMethod: 'pin' | 'biometric' = 'pin') {
    try {
      const settings = await settingsRepository.getSettings();

      if (authMethod === 'biometric' && settings.biometricEnabled) {
        if (Platform.OS === 'web') return false;
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock Calmly',
          fallbackLabel: 'Use PIN',
          cancelLabel: 'Cancel',
        });
        if (result.success) {
          this.lockState = { isLocked: false, requiresAuth: false };
          this.notify();
          return true;
        }
      }
    } catch (error) {
      console.warn('AppLock unlock failed:', error);
    }

    return false;
  }

  async verifyPin(pin: string): Promise<boolean> {
    try {
      return await settingsRepository.verifyPin(pin);
    } catch (error) {
      console.warn('AppLock verifyPin failed:', error);
      return false;
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
    unlock: (method?: 'pin' | 'biometric') => appLockService.unlock(method),
    verifyPin: (pin: string) => appLockService.verifyPin(pin),
    recordActivity: () => appLockService.recordActivity(),
  };
}
