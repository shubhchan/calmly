export type AvatarMascotId =
  | 'panda'
  | 'lotus'
  | 'sun'
  | 'oak'
  | 'pebble'
  | 'moon'
  | 'bonsai'
  | 'koi'
  | 'cat'
  | 'bell'
  | 'mountain'
  | 'tea';

export type ProfileAvatarKind = 'google' | 'custom' | 'mascot';

export interface ProfileAvatar {
  kind: ProfileAvatarKind;
  uri?: string;
  mascotId?: AvatarMascotId;
}
