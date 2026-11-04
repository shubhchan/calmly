/** Native Google account sign-in + Firebase identity. No service account key. */
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { GoogleAuthProvider, getAuth, initializeAuth, getReactNativePersistence, signInWithCredential, signOut, type Auth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBBrsInGzDh9JsuQiv7vqiMUwvpF56vYLs',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'calmly-f135f.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'calmly-f135f',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:417740727864:android:3dfc2615f9432afff668cd',
};
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '417740727864-obo3qs5la48s1u401hpu1r6vcljpc7bh.apps.googleusercontent.com';
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let configured = false;
function configureGoogle(GoogleSignin: ReturnType<typeof googleModule>['GoogleSignin']) {
  if (configured || !WEB_CLIENT_ID) return;
  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID, scopes: ['email', 'profile'] });
  configured = true;
}

export const isCalmlyCloudConfigured = () => !!(config.apiKey && config.projectId && config.appId && WEB_CLIENT_ID);
export function getCalmlyAuth(): Auth | null {
  if (!isCalmlyCloudConfigured()) return null;
  try {
    if (!app) app = getApps()[0] || initializeApp(config);
    if (!auth) {
      try { auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) }); }
      catch { auth = getAuth(app); }
    }
    return auth;
  } catch (e) { console.warn('Firebase initialization failed:', e); return null; }
}

function googleModule() {
  // Lazy native import, so local-only mode can still start in Expo Go.
  // Google sign-in requires an EAS/development build after native configuration.
  return require('@react-native-google-signin/google-signin') as typeof import('@react-native-google-signin/google-signin');
}

export async function loginWithGoogle() {
  const instance = getCalmlyAuth();
  if (!instance || !WEB_CLIENT_ID) throw new Error('Configure Firebase and Google OAuth before connecting. See CLOUD_SETUP.md.');
  let GoogleSignin;
  try { ({ GoogleSignin } = googleModule()); }
  catch { throw new Error('Google Sign-In requires a development or production build, not Expo Go.'); }
  configureGoogle(GoogleSignin);
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result = await GoogleSignin.signIn();
  if (result.type !== 'success' || !result.data.idToken) throw new Error('Google sign-in was cancelled or did not return an ID token.');
  const credential = GoogleAuthProvider.credential(result.data.idToken);
  return (await signInWithCredential(instance, credential)).user;
}

export async function getDriveToken(): Promise<string> {
  const instance = getCalmlyAuth();
  if (!instance?.currentUser) throw new Error('Sign in with Google to access your Drive.');
  const { GoogleSignin } = googleModule();
  configureGoogle(GoogleSignin);
  if (!GoogleSignin.getCurrentUser()) {
    try { await GoogleSignin.signInSilently(); }
    catch { throw new Error('Reconnect your Google account to grant Drive access.'); }
  }
  // Request only app-owned files, not the user's entire Drive.
  const access = await GoogleSignin.addScopes({ scopes: ['https://www.googleapis.com/auth/drive.file'] });
  if (access?.type === 'cancelled') throw new Error('Drive permission was not granted.');
  const tokens = await GoogleSignin.getTokens();
  if (!tokens.accessToken) throw new Error('Drive access token unavailable. Sign in again.');
  return tokens.accessToken;
}

export async function logoutCloud() {
  const instance = getCalmlyAuth();
  try { await googleModule().GoogleSignin.signOut(); } catch {}
  if (instance) await signOut(instance);
}
