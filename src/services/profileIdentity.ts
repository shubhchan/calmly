import { settingsRepository, type AppSettings } from '../database/repositories/settingsRepository';

export interface GoogleIdentity {
  photoUrl?: string | null;
  displayName?: string | null;
  email?: string | null;
}

export async function rememberGoogleIdentity(identity: GoogleIdentity): Promise<void> {
  const current = await settingsRepository.getSettings();
  const updates: Partial<AppSettings> = {};

  if (identity.photoUrl) updates.googlePhotoUrl = identity.photoUrl;
  if (identity.email) updates.googleEmail = identity.email;
  if (identity.displayName) updates.googleDisplayName = identity.displayName;
  if (!current.userName && identity.displayName) {
    updates.userName = identity.displayName.split(' ')[0] || identity.displayName;
  }
  if (!current.userAvatar || current.userAvatar.kind === 'google') {
    updates.userAvatar = { kind: 'google' };
  }

  if (Object.keys(updates).length > 0) {
    await settingsRepository.updateSettings(updates);
  }
}

export async function forgetGoogleIdentity(): Promise<void> {
  const current = await settingsRepository.getSettings();
  const updates: Partial<AppSettings> = {
    googlePhotoUrl: undefined,
    googleEmail: undefined,
    googleDisplayName: undefined,
    lastDriveSyncAt: undefined,
  };
  if (current.userAvatar?.kind === 'google') {
    updates.userAvatar = { kind: 'mascot', mascotId: 'lotus' };
  }
  await settingsRepository.updateSettings(updates);
}
