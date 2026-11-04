import { AttachmentType, NoteAttachment } from '../types/attachment';

function extensionFrom(uri: string, fileName?: string | null, type?: AttachmentType): string {
  const candidate = fileName || uri.split('?')[0].split('#')[0];
  const match = /\.([a-zA-Z0-9]{1,6})$/.exec(candidate);
  if (match?.[1]) return match[1].toLowerCase();

  switch (type) {
    case 'image':
      return 'jpg';
    case 'audio':
      return 'm4a';
    case 'video':
      return 'mp4';
    case 'document':
      return 'pdf';
    default:
      return 'bin';
  }
}

export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatAudioDuration(seconds?: number): string {
  if (!seconds || seconds <= 0 || isNaN(seconds)) return '0:00';
  const totalSecs = Math.floor(seconds);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export async function persistAttachmentFile(
  sourceUri: string,
  type: AttachmentType,
  originalName?: string
): Promise<{ uri: string; size?: number }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Directory, File, Paths } = require('expo-file-system') as typeof import('expo-file-system');
    const attachmentsDir = new Directory(Paths.document, 'note_attachments');
    if (!attachmentsDir.exists) {
      attachmentsDir.create();
    }

    const ext = extensionFrom(sourceUri, originalName, type);
    const uniqueFilename = `att_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const destination = new File(attachmentsDir, uniqueFilename);
    const source = new File(sourceUri);

    await source.copy(destination);

    let size: number | undefined;
    try {
      if (destination.exists && typeof destination.size === 'number') {
        size = destination.size;
      }
    } catch {
      // Size query fallback
    }

    return {
      uri: destination.uri,
      size,
    };
  } catch (error) {
    console.warn('Failed to persist attachment to internal sandbox, using original URI:', error);
    return { uri: sourceUri };
  }
}

export async function deleteAttachmentFile(uri: string): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { File } = require('expo-file-system') as typeof import('expo-file-system');
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch (err) {
    console.warn('Could not delete attachment file:', err);
  }
}

export function parseAttachments(entry: {
  imageUri?: string | null;
  audioUri?: string | null;
  createdAt?: number | null;
}): NoteAttachment[] {
  const attachments: NoteAttachment[] = [];
  if (!entry) return attachments;

  const rawImage = (entry.imageUri || '').trim();
  if (rawImage.startsWith('[')) {
    try {
      const parsed = JSON.parse(rawImage);
      if (Array.isArray(parsed)) {
        return parsed.filter((att) => att && typeof att.uri === 'string');
      }
    } catch {
      // Fallback if not valid JSON
    }
  } else if (rawImage.length > 0) {
    // Legacy single image uri
    attachments.push({
      id: `legacy_img_${entry.createdAt || Date.now()}`,
      type: 'image',
      uri: rawImage,
      name: 'Photo',
      createdAt: entry.createdAt || Date.now(),
    });
  }

  const rawAudio = (entry.audioUri || '').trim();
  if (rawAudio.length > 0 && !attachments.some((a) => a.uri === rawAudio)) {
    attachments.push({
      id: `legacy_audio_${entry.createdAt || Date.now()}`,
      type: 'audio',
      uri: rawAudio,
      name: 'Voice Note',
      createdAt: entry.createdAt || Date.now(),
    });
  }

  return attachments;
}

