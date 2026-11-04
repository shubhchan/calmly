export type AttachmentType = 'image' | 'audio' | 'video' | 'document';

export interface NoteAttachment {
  id: string;
  type: AttachmentType;
  uri: string;
  name: string;
  size?: number; // bytes
  mimeType?: string;
  duration?: number; // seconds (for audio / video)
  createdAt: number;
}

