import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';
import { Alert } from '../../services/appAlert';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { AppText, ScreenHeader, TactilePressable, PrivacySanctuaryIllustration } from '../../components';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { useAppTheme } from '../../theme/ThemeContext';
import { getCalmlyAuth, getDriveToken, isCalmlyCloudConfigured, loginWithGoogle, logoutCloud } from '../../services/calmlyAuth';
import { backupToDrive, listDriveBackups, restoreFromDrive, type BackupSummary } from '../../services/calmlyCloud';
import { settingsRepository } from '../../database/repositories/settingsRepository';

export function CloudStorageScreen({ navigation }: any) {
  const { colors } = useAppTheme();
  const [user, setUser] = useState<User | null>(null);
  const [passphrase, setPassphrase] = useState('');
  const [backups, setBackups] = useState<BackupSummary[]>([]);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const configured = isCalmlyCloudConfigured();
  useEffect(() => {
    const auth = getCalmlyAuth();
    return auth ? onAuthStateChanged(auth, setUser) : undefined;
  }, []);
  const run = useCallback(async (label: string, action: () => Promise<any>) => {
    setBusy(label); setMessage('');
    try { await action(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Could not complete cloud request.'); }
    finally { setBusy(''); }
  }, []);
  const refresh = async () => run('Loading Drive', async () => { const token = await getDriveToken(); setBackups(await listDriveBackups(token)); });
  const connect = async () => run('Connecting Google', async () => { const u = await loginWithGoogle(); setUser(u); setBackups([]); setMessage(`Connected as ${u.email || 'Google account'}. Drive access is requested separately.`); });
  const backup = async () => run('Encrypting and uploading', async () => {
    if (passphrase.length < 12) throw new Error('Enter a 12+ character passphrase. Keep it safe; it cannot be recovered.');
    const token = await getDriveToken();
    const name = await backupToDrive(token, passphrase);
    await settingsRepository.updateSettings({ lastDriveSyncAt: Date.now() }).catch(() => {});
    setBackups(await listDriveBackups(token)); setPassphrase(''); setMessage(`Encrypted backup created: ${name}`);
  });
  const restore = (file: BackupSummary) => {
    if (passphrase.length < 12) { setMessage('Enter the passphrase used for this backup before restoring.'); return; }
    Alert.alert('Merge saved entries?', 'The backup will add missing mood check-ins and notes without replacing entries already saved on this device. Audio and image attachments are not part of this backup.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Merge backup', onPress: () => void run('Decrypting and restoring', async () => {
        const token = await getDriveToken();
        const result = await restoreFromDrive(token, file.id, passphrase);
        setPassphrase(''); setMessage(`Restored ${result.moods} mood check-ins and ${result.journals} journal notes. Existing items were preserved.`);
      }) },
    ]);
  };
  return <ScreenContainer contentContainerStyle={styles.page} backgroundColor={colors.background.default}>
    <ScreenHeader title="Your cloud backups" subtitle="Keep your reflections in your own Google Drive" onBack={() => navigation.goBack()} />
    <View style={[styles.card, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}>
      <PrivacySanctuaryIllustration width={150} height={120} style={{ alignSelf: 'center', marginBottom: 8 }} />
      <View style={styles.row}><Ionicons name="shield-checkmark-outline" size={26} color={colors.primary.default} /><AppText variant="title">Local-first, always</AppText></View>
      <AppText tone="secondary">Calmly works offline. When you opt in, this feature stores encrypted snapshots in a Calmly Backups folder in the Google Drive account you sign in with.</AppText>
      <AppText variant="bodySmall" tone="tertiary">Google Drive stores files; it does not host a running backend. No journal data is uploaded unless you select Back up now.</AppText>
    </View>
    {!configured ? <View style={[styles.card, { borderColor: colors.border.default, backgroundColor: colors.surface.default }]}><AppText variant="title">Setup required</AppText><AppText tone="secondary">Add your Firebase project identifiers and Google OAuth Web client ID in .env, enable Google login, then create an Expo development build. See CLOUD_SETUP.md.</AppText></View> : <>
      <View style={[styles.card, { borderColor: colors.border.default, backgroundColor: colors.surface.default }]}>
        <AppText variant="title">Google account</AppText>
        <AppText tone="secondary">{user ? `Connected: ${user.email || user.uid}` : 'Not connected. Your offline entries remain on this device.'}</AppText>
        {!user ? <Action label="Continue with Google" icon="logo-google" onPress={connect} color={colors.primary.default} /> : <>
          <Action label="Choose a different account" icon="people-outline" onPress={() => void run('Signing out', async () => { await logoutCloud(); setUser(null); setBackups([]); setMessage('Signed out. Tap Continue with Google to select another account.'); })} color={colors.primary.default} />
        </>}
      </View>
      {user && <>
        <View style={[styles.card, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}>
          <AppText variant="title">Encryption passphrase</AppText>
          <AppText tone="secondary">Use a unique phrase of 12+ characters. You must enter the same phrase to restore on another device. Calmly never uploads or saves this phrase.</AppText>
          <TextInput secureTextEntry value={passphrase} onChangeText={setPassphrase} placeholder="Type your private backup phrase" placeholderTextColor={colors.text.tertiary} style={[styles.input, { color: colors.text.primary, borderColor: colors.border.default, backgroundColor: colors.background.default }]} autoCapitalize="none" autoCorrect={false} />
          <Action label="Back up now" icon="cloud-upload-outline" onPress={backup} color={colors.primary.default} />
        </View>
        <View style={[styles.card, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}>
          <View style={[styles.row, { justifyContent: 'space-between' }]}><AppText variant="title">Saved snapshots</AppText><TactilePressable accessibilityRole="button" onPress={refresh}><Ionicons name="refresh-outline" size={23} color={colors.primary.default}/></TactilePressable></View>
          <AppText variant="bodySmall" tone="secondary">Tap refresh to grant Drive access and list backups. Restoring only adds missing moods and notes.</AppText>
          {!backups.length && <AppText variant="bodySmall" tone="tertiary">No snapshots loaded. Tap refresh to check your Drive.</AppText>}
          {backups.map(file => <TactilePressable key={file.id} accessibilityRole="button" onPress={() => restore(file)} style={[styles.fileRow, { borderBottomColor: colors.border.default }]}><Ionicons name="document-text-outline" size={23} color={colors.primary.default} /><View style={{ flex: 1, gap: 4 }}><AppText variant="bodySmall" numberOfLines={2}>{file.name}</AppText><AppText variant="caption" tone="tertiary">{file.createdTime ? new Date(file.createdTime).toLocaleString() : 'Encrypted backup'}</AppText></View><Ionicons name="download-outline" size={21} color={colors.text.secondary} /></TactilePressable>)}
        </View>
      </>}
    </>}
    {busy ? <View style={styles.row}><ActivityIndicator color={colors.primary.default}/><AppText tone="secondary">{busy}…</AppText></View> : null}
    {message ? <View style={[styles.card, { borderColor: colors.border.default, backgroundColor: colors.surface.default }]}><AppText variant="bodySmall" tone="secondary">{message}</AppText></View> : null}
    <AppText variant="caption" tone="tertiary">Backup scope: mood check-ins and journal text. Media attachments and other modules are not included. This is manual backup/merge, not automatic two-way synchronization.</AppText>
  </ScreenContainer>;
}
function Action({ label, icon, onPress, color }: { label: string; icon: React.ComponentProps<typeof Ionicons>['name']; onPress: () => void; color: string }) {
  const { colors, isDark } = useAppTheme();
  const textColor = isDark ? colors.primary.foreground : '#FFFFFF';
  return (
    <TactilePressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={[styles.action, { backgroundColor: color }]}>
      <Ionicons name={icon} size={20} color={textColor} />
      <AppText variant="button" color={textColor}>{label}</AppText>
    </TactilePressable>
  );
}
const styles = StyleSheet.create({
  page: { paddingHorizontal: 20, gap: 18, paddingBottom: 130 },
  card: { padding: 18, borderRadius: 20, gap: 13, backgroundColor: '#FFFFFF' },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  action: { minHeight: 50, borderRadius: 14, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  input: { borderRadius: 13, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, backgroundColor: '#EAEDE7' },
  fileRow: { flexDirection: 'row', paddingVertical: 15, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
});
