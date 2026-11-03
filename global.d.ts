declare module '*.css';

declare const process: {
  env: Record<string, string | undefined>;
};

declare module 'firebase/auth' {
  import type { Persistence } from '@firebase/auth';
  export * from '@firebase/auth';
  export function getReactNativePersistence(storage: any): Persistence;
}
