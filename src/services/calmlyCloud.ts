/**
 * User-owned Google Drive snapshots. Drive is storage, NOT an executable backend.
 * Encryption happens locally; neither Firebase nor Google Drive receives the
 * backup passphrase. Google Drive receives only AES-256-GCM ciphertext.
 */
import * as Crypto from 'expo-crypto';
import { gcm } from '@noble/ciphers/aes.js';
import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex, hexToBytes, utf8ToBytes } from '@noble/hashes/utils.js';
const bytesToUtf8 = (bytes: Uint8Array) => new TextDecoder().decode(bytes);
import { journalRepository } from '../database/repositories/journalRepository';
import { moodRepository } from '../database/repositories/moodRepository';

const DRIVE = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files';
const FOLDER_NAME = 'Calmly Backups';
const BACKUP_MIME = 'application/json';
const KDF_ITERATIONS = 210000;
export type EncryptedSnapshot = { format: 'calmly-encrypted-v1'; iterations: number; salt: string; nonce: string; ciphertext: string };
export type BackupSummary = { name: string; createdTime: string; id: string; size?: string };

type BackupPayload = { app: 'Calmly'; schemaVersion: 1; exportedAt: string; moods: any[]; journals: any[] };

export async function captureLocalSnapshot(): Promise<BackupPayload> {
  const [moods, journals] = await Promise.all([moodRepository.getAll(), journalRepository.getAll()]);
  return {
    app: 'Calmly', schemaVersion: 1, exportedAt: new Date().toISOString(),
    moods: (moods || []).map((m: any) => ({ id: m.id, mood: m.mood, intensity: m.intensity, stress: m.stress, energy: m.energy, context: m.context, needs: m.needs, createdAt: m.createdAt, updatedAt: m.updatedAt })),
    journals: (journals || []).map((j: any) => ({ id: j.id, type: j.type, title: j.title, body: j.body, mood: j.mood, tags: j.tags, favorite: j.favorite, imageUri: '', audioUri: '', createdAt: j.createdAt, updatedAt: j.updatedAt })),
  };
}

export async function encryptSnapshot(payload: BackupPayload, passphrase: string): Promise<EncryptedSnapshot> {
  if (passphrase.length < 12) throw new Error('Use a backup passphrase of at least 12 characters.');
  const [salt, nonce] = await Promise.all([Crypto.getRandomBytesAsync(16), Crypto.getRandomBytesAsync(12)]);
  const key = pbkdf2(sha256, utf8ToBytes(passphrase), salt, { c: KDF_ITERATIONS, dkLen: 32 });
  try {
    const bytes = gcm(key, nonce).encrypt(utf8ToBytes(JSON.stringify(payload)));
    return { format: 'calmly-encrypted-v1', iterations: KDF_ITERATIONS, salt: bytesToHex(salt), nonce: bytesToHex(nonce), ciphertext: bytesToHex(bytes) };
  } finally { key.fill(0); }
}

export function decryptSnapshot(snapshot: EncryptedSnapshot, passphrase: string): BackupPayload {
  if (snapshot?.format !== 'calmly-encrypted-v1' || snapshot.iterations !== KDF_ITERATIONS) throw new Error('This is not a supported Calmly backup.');
  if (snapshot.ciphertext?.length > 20_000_000) throw new Error('Backup exceeds the supported size limit.');
  try {
    const key = pbkdf2(sha256, utf8ToBytes(passphrase), hexToBytes(snapshot.salt), { c: snapshot.iterations, dkLen: 32 });
    let plaintext: Uint8Array;
    try { plaintext = gcm(key, hexToBytes(snapshot.nonce)).decrypt(hexToBytes(snapshot.ciphertext)); }
    finally { key.fill(0); }
    const payload = JSON.parse(bytesToUtf8(plaintext));
    if (payload?.app !== 'Calmly' || payload?.schemaVersion !== 1 || !Array.isArray(payload?.moods) || !Array.isArray(payload?.journals)) throw new Error('Unexpected backup structure.');
    return payload as BackupPayload;
  } catch { throw new Error('Cannot decrypt the backup. Check your passphrase and file integrity.'); }
}

async function api(token: string, url: string, init: RequestInit = {}): Promise<any> {
  const response = await fetch(url, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init.headers || {}) } });
  const body = await response.text();
  if (!response.ok) {
    let detail = body;
    try { detail = JSON.parse(body)?.error?.message || body; } catch {}
    throw new Error(`Drive request failed (${response.status}): ${detail.slice(0, 180)}`);
  }
  return body ? JSON.parse(body) : {};
}

async function findOrCreateFolder(token: string): Promise<string> {
  const query = `name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const search = await api(token, `${DRIVE}?q=${encodeURIComponent(query)}&fields=files(id,name),nextPageToken&pageSize=50`);
  if (search.files?.length) return search.files[0].id;
  const folder = await api(token, DRIVE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }) });
  if (!folder?.id) throw new Error('Google Drive did not return a folder ID.');
  return folder.id;
}

export async function listDriveBackups(token: string): Promise<BackupSummary[]> {
  // This only lists folders created by this app under the drive.file scope.
  const folderId = await findOrCreateFolder(token);
  const query = `'${folderId}' in parents and name contains 'calmly-' and trashed = false`;
  const result = await api(token, `${DRIVE}?q=${encodeURIComponent(query)}&fields=nextPageToken,files(id,name,createdTime,size)&orderBy=createdTime%20desc&pageSize=100`);
  return result.files || [];
}

export async function backupToDrive(token: string, passphrase: string): Promise<string> {
  const folder = await findOrCreateFolder(token);
  const payload = await captureLocalSnapshot();
  const encrypted = await encryptSnapshot(payload, passphrase);
  const name = `calmly-${new Date().toISOString().replace(/[:.]/g, '-')}.encrypted.json`;
  const boundary = `calmly-${Date.now()}`;
  const meta = { name, mimeType: BACKUP_MIME, parents: [folder] };
  const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(meta)}\r\n--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(encrypted)}\r\n--${boundary}--`;
  const file = await api(token, `${UPLOAD}?uploadType=multipart&fields=id,name`, { method: 'POST', headers: { 'Content-Type': `multipart/related; boundary=${boundary}` }, body });
  return file.name || name;
}

export async function restoreFromDrive(token: string, fileId: string, passphrase: string): Promise<{ moods: number; journals: number }> {
  if (!/^[\w-]+$/.test(fileId)) throw new Error('Invalid Drive file identifier.');
  const encrypted = await api(token, `${DRIVE}/${fileId}?alt=media`);
  const payload = decryptSnapshot(encrypted, passphrase);
  const moods = await moodRepository.importEntries(payload.moods);
  const journals = await journalRepository.importEntries(payload.journals);
  return { moods, journals };
}
