function extensionFrom(uri: string, fileName?: string | null): string {
  const candidate = fileName || uri.split('?')[0].split('#')[0];
  const match = /\.([a-zA-Z0-9]{1,5})$/.exec(candidate);
  return (match?.[1] || 'jpg').toLowerCase();
}

export async function persistProfileImage(uri: string, fileName?: string | null): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Directory, File, Paths } = require('expo-file-system') as typeof import('expo-file-system');
    const directory = new Directory(Paths.document, 'profile');
    if (!directory.exists) directory.create();

    const destination = new File(directory, `avatar-${Date.now()}.${extensionFrom(uri, fileName)}`);
    const source = new File(uri);
    await source.copy(destination);
    return destination.uri;
  } catch (error) {
    console.warn('Could not persist profile image; keeping picker URI:', error);
    return uri;
  }
}
