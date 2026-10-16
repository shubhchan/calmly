import AsyncStorage from '@react-native-async-storage/async-storage';

// In-memory cache for synchronous reads, backed by MMKV if native code is available,
// and always written through to AsyncStorage for 100% durable persistence across app reloads/restarts.
const memoryMap = new Map<string, string>();
let mmkvInstance: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createMMKV } = require('react-native-mmkv');
  mmkvInstance = createMMKV();
} catch {
  // MMKV unavailable in Expo Go or unbuilt dev client; AsyncStorage handles durability
}

// Immediately seed memoryMap from AsyncStorage in the background
(async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    if (keys.length > 0) {
      const pairs = await AsyncStorage.multiGet(keys);
      for (const [k, v] of pairs) {
        if (v !== null && !memoryMap.has(k)) {
          memoryMap.set(k, v);
        }
      }
    }
  } catch {}
})();

function safeGetString(key: string): string | undefined {
  if (mmkvInstance) {
    try {
      const val = mmkvInstance.getString(key);
      if (val !== undefined) return val;
    } catch {}
  }
  return memoryMap.get(key);
}

function safeSet(key: string, value: string): void {
  memoryMap.set(key, value);
  if (mmkvInstance) {
    try {
      mmkvInstance.set(key, value);
    } catch {}
  }
  AsyncStorage.setItem(key, value).catch(() => {});
}

function safeRemove(key: string): void {
  memoryMap.delete(key);
  if (mmkvInstance) {
    try {
      mmkvInstance.remove(key);
    } catch {}
  }
  AsyncStorage.removeItem(key).catch(() => {});
}

function safeClearAll(): void {
  memoryMap.clear();
  if (mmkvInstance) {
    try {
      mmkvInstance.clearAll();
    } catch {}
  }
  AsyncStorage.clear().catch(() => {});
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
    safeRemove(key);
  },
  clearAll: (): void => {
    safeClearAll();
  },
  getAllKeys: (): string[] => {
    const keys = new Set<string>(memoryMap.keys());
    if (mmkvInstance) {
      try {
        for (const k of mmkvInstance.getAllKeys()) keys.add(k);
      } catch {}
    }
    return Array.from(keys);
  },
};