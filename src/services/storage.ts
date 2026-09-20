import { createMMKV } from 'react-native-mmkv';

interface KeyValueStore {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  remove(key: string): void;
  clearAll(): void;
  getAllKeys(): string[];
}

// In-memory fallback so a native-module failure (Expo Go, device without
// Nitro/MMKV, fresh install race) can never throw at import time and grey-screen
// the whole app. Theme/settings simply fall back to defaults for that session.
function createMemoryStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    getString: (key: string) => map.get(key),
    set: (key: string, value: string) => {
      map.set(key, value);
    },
    remove: (key: string) => {
      map.delete(key);
    },
    clearAll: () => {
      map.clear();
    },
    getAllKeys: () => Array.from(map.keys()),
  };
}

let storage: KeyValueStore;
try {
  storage = createMMKV();
} catch (error) {
  console.warn('MMKV unavailable, using in-memory storage:', error);
  storage = createMemoryStore();
}

function safeGetString(key: string): string | undefined {
  try {
    return storage.getString(key);
  } catch (error) {
    console.warn(`Storage.getString(${key}) failed:`, error);
    return undefined;
  }
}

function safeSet(key: string, value: string): void {
  try {
    storage.set(key, value);
  } catch (error) {
    console.warn(`Storage.set(${key}) failed:`, error);
  }
}

export const Storage = {
  getString: (key: string): string | undefined => {
    return safeGetString(key);
  },
  setString: (key: string, value: string): void => {
    safeSet(key, value);
  },
  getBoolean: (key: string): boolean | undefined => {
    const value = safeGetString(key);
    try {
      return value ? JSON.parse(value) : undefined;
    } catch {
      return undefined;
    }
  },
  setBoolean: (key: string, value: boolean): void => {
    safeSet(key, JSON.stringify(value));
  },
  getNumber: (key: string): number | undefined => {
    const value = safeGetString(key);
    try {
      return value ? JSON.parse(value) : undefined;
    } catch {
      return undefined;
    }
  },
  setNumber: (key: string, value: number): void => {
    safeSet(key, JSON.stringify(value));
  },
  getObject: <T>(key: string): T | undefined => {
    const value = safeGetString(key);
    if (!value) return undefined;
    try {
      return JSON.parse(value) as T;
    } catch {
      return undefined;
    }
  },
  setObject: <T>(key: string, value: T): void => {
    try {
      safeSet(key, JSON.stringify(value));
    } catch {
      // never throw from storage writes
    }
  },
  delete: (key: string): void => {
    try {
      storage.remove(key);
    } catch (error) {
      console.warn(`Storage.delete(${key}) failed:`, error);
    }
  },
  clearAll: (): void => {
    try {
      storage.clearAll();
    } catch (error) {
      console.warn('Storage.clearAll failed:', error);
    }
  },
  getAllKeys: (): string[] => {
    try {
      return storage.getAllKeys();
    } catch (error) {
      console.warn('Storage.getAllKeys failed:', error);
      return [];
    }
  },
};