import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, Dimensions } from 'react-native';
import { Alert } from '../../services/appAlert';
import { Ionicons } from '@expo/vector-icons';
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import { useAppTheme } from '../../theme/ThemeContext';
import { TactilePressable } from '../interactive/TactilePressable';
import { hapticFeedback } from '../../utils/haptics';
import { NoteAttachment } from '../../types/attachment';
import { formatAudioDuration, persistAttachmentFile } from '../../utils/attachmentStorage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';

interface AudioRecorderModalProps {
  visible: boolean;
  onClose: () => void;
  onSaved: (attachment: NoteAttachment) => void;
}

export function AudioRecorderModal({ visible, onClose, onSaved }: AudioRecorderModalProps) {
  const { colors, isDark } = useAppTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [recordedDuration, setRecordedDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);

  // Audio player for previewing recorded memo
  const previewPlayer = useAudioPlayer(recordedUri);
  const previewStatus = useAudioPlayerStatus(previewPlayer);

  // Visual pulse animations
  const pulseAnim = useSharedValue(1);
  const barAnim1 = useSharedValue(12);
  const barAnim2 = useSharedValue(22);
  const barAnim3 = useSharedValue(16);
  const barAnim4 = useSharedValue(28);
  const barAnim5 = useSharedValue(18);

  useEffect(() => {
    if (recorderState.isRecording) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      barAnim1.value = withRepeat(withTiming(32, { duration: 320 }), -1, true);
      barAnim2.value = withRepeat(withTiming(44, { duration: 420 }), -1, true);
      barAnim3.value = withRepeat(withTiming(26, { duration: 280 }), -1, true);
      barAnim4.value = withRepeat(withTiming(48, { duration: 490 }), -1, true);
      barAnim5.value = withRepeat(withTiming(36, { duration: 350 }), -1, true);
    } else {
      cancelAnimation(pulseAnim);
      cancelAnimation(barAnim1);
      cancelAnimation(barAnim2);
      cancelAnimation(barAnim3);
      cancelAnimation(barAnim4);
      cancelAnimation(barAnim5);
      pulseAnim.value = withTiming(1, { duration: 200 });
      barAnim1.value = withTiming(12, { duration: 200 });
      barAnim2.value = withTiming(20, { duration: 200 });
      barAnim3.value = withTiming(14, { duration: 200 });
      barAnim4.value = withTiming(24, { duration: 200 });
      barAnim5.value = withTiming(16, { duration: 200 });
    }
  }, [recorderState.isRecording]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const barStyle1 = useAnimatedStyle(() => ({ height: barAnim1.value }));
  const barStyle2 = useAnimatedStyle(() => ({ height: barAnim2.value }));
  const barStyle3 = useAnimatedStyle(() => ({ height: barAnim3.value }));
  const barStyle4 = useAnimatedStyle(() => ({ height: barAnim4.value }));
  const barStyle5 = useAnimatedStyle(() => ({ height: barAnim5.value }));

  // Check & request permission on open
  useEffect(() => {
    if (visible) {
      setRecordedUri(null);
      setRecordedDuration(0);
      (async () => {
        try {
          const { granted } = await requestRecordingPermissionsAsync();
          setHasPermission(granted);
        } catch {
          setHasPermission(false);
        }
      })();
    }
  }, [visible]);

  const handleStartRecord = async () => {
    if (!hasPermission) {
      const { granted } = await requestRecordingPermissionsAsync();
      setHasPermission(granted);
      if (!granted) {
        Alert.alert('Microphone Access Needed', 'Please allow microphone access to record voice notes.');
        return;
      }
    }

    try {
      setIsPreparing(true);
      hapticFeedback.light();
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (err) {
      console.error('Failed to start recording:', err);
      Alert.alert('Recording Error', 'Could not access audio input.');
    } finally {
      setIsPreparing(false);
    }
  };

  const handleStopRecord = async () => {
    try {
      hapticFeedback.medium();
      const currentDuration = Math.max(1, Math.round((recorderState.durationMillis || 0) / 1000));
      await recorder.stop();
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
      if (recorder.uri) {
        setRecordedUri(recorder.uri);
        setRecordedDuration(currentDuration);
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  };

  const handleSaveNote = async () => {
    if (!recordedUri) return;
    setIsSaving(true);
    try {
      hapticFeedback.success();
      const dateStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const name = `Voice Note (${dateStr})`;
      const { uri, size } = await persistAttachmentFile(recordedUri, 'audio', `${name}.m4a`);

      const attachment: NoteAttachment = {
        id: `att_aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: 'audio',
        uri,
        name,
        size,
        duration: recordedDuration,
        createdAt: Date.now(),
      };

      onSaved(attachment);
      handleClose();
    } catch (err) {
      console.error('Failed to save audio attachment:', err);
      Alert.alert('Error', 'Could not save voice recording.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePreview = () => {
    if (!previewPlayer) return;
    hapticFeedback.selection();
    if (previewStatus.playing) {
      previewPlayer.pause();
    } else {
      previewPlayer.play();
    }
  };

  const handleClose = () => {
    if (recorderState.isRecording) {
      recorder.stop().catch(() => {});
    }
    if (previewPlayer && previewStatus.playing) {
      previewPlayer.pause();
    }
    setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
    setRecordedUri(null);
    onClose();
  };

  const durationSeconds = recorderState.isRecording
    ? Math.floor((recorderState.durationMillis || 0) / 1000)
    : recordedDuration;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? '#1C2638' : colors.surface.default,
              borderColor: colors.border.default,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderLeft}>
              <View
                style={[
                  styles.headerIconCircle,
                  { backgroundColor: colors.primary.subtle, borderColor: colors.primary.subtleBorder },
                ]}
              >
                <Ionicons name="mic" size={20} color={colors.primary.default} />
              </View>
              <View>
                <Text style={[styles.sheetTitle, { color: colors.text.primary }]}>Voice Memo</Text>
                <Text style={[styles.sheetSubtitle, { color: colors.text.tertiary }]}>
                  Speak your thoughts freely
                </Text>
              </View>
            </View>

            <TactilePressable
              onPress={handleClose}
              hitSlop={8}
              style={[styles.closeBtn, { backgroundColor: isDark ? '#2A374A' : '#F1F5F9' }]}
            >
              <Ionicons name="close" size={20} color={colors.text.secondary} />
            </TactilePressable>
          </View>

          {/* Central Recording Stage */}
          <View style={styles.stage}>
            <Animated.View style={[styles.pulseCircle, pulseStyle]}>
              <TactilePressable
                onPress={
                  recorderState.isRecording
                    ? handleStopRecord
                    : recordedUri
                    ? handleTogglePreview
                    : handleStartRecord
                }
                disabled={isPreparing || isSaving}
                scaleDownTo={0.92}
                style={[
                  styles.recordButton,
                  {
                    backgroundColor: recorderState.isRecording
                      ? '#EB697F'
                      : recordedUri
                      ? colors.primary.default
                      : colors.primary.default,
                  },
                ]}
              >
                <Ionicons
                  name={
                    recorderState.isRecording
                      ? 'stop'
                      : recordedUri
                      ? previewStatus.playing
                        ? 'pause'
                        : 'play'
                      : 'mic'
                  }
                  size={36}
                  color="#FFFFFF"
                />
              </TactilePressable>
            </Animated.View>

            {/* Timer and Waveform */}
            <Text style={[styles.timerText, { color: colors.text.primary }]}>
              {formatAudioDuration(durationSeconds)}
            </Text>

            {/* Subtle animated sound wave bars */}
            <View style={styles.waveformContainer}>
              <Animated.View style={[styles.waveBar, { backgroundColor: colors.primary.default }, barStyle1]} />
              <Animated.View style={[styles.waveBar, { backgroundColor: colors.primary.default }, barStyle2]} />
              <Animated.View style={[styles.waveBar, { backgroundColor: colors.primary.default }, barStyle3]} />
              <Animated.View style={[styles.waveBar, { backgroundColor: colors.primary.default }, barStyle4]} />
              <Animated.View style={[styles.waveBar, { backgroundColor: colors.primary.default }, barStyle5]} />
            </View>

            <Text style={[styles.statusHint, { color: colors.text.tertiary }]}>
              {recorderState.isRecording
                ? 'Recording... Tap stop when finished'
                : recordedUri
                ? previewStatus.playing
                  ? 'Playing preview...'
                  : 'Tap to preview your recording'
                : 'Tap the mic to start recording'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            {recordedUri ? (
              <>
                <TactilePressable
                  onPress={() => {
                    setRecordedUri(null);
                    setRecordedDuration(0);
                  }}
                  style={[styles.actionBtn, styles.secondaryBtn, { borderColor: colors.border.default }]}
                >
                  <Ionicons name="refresh" size={16} color={colors.text.secondary} style={{ marginRight: 6 }} />
                  <Text style={[styles.btnText, { color: colors.text.secondary }]}>Re-record</Text>
                </TactilePressable>

                <TactilePressable
                  onPress={handleSaveNote}
                  disabled={isSaving}
                  style={[styles.actionBtn, styles.primaryBtn, { backgroundColor: colors.primary.default }]}
                >
                  <Ionicons name="checkmark" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={[styles.btnText, { color: '#FFFFFF', fontWeight: '700' }]}>
                    {isSaving ? 'Attaching...' : 'Attach Memo'}
                  </Text>
                </TactilePressable>
              </>
            ) : recorderState.isRecording ? (
              <TactilePressable
                onPress={handleStopRecord}
                style={[styles.actionBtn, styles.stopBtn, { backgroundColor: '#EB697F' }]}
              >
                <Ionicons name="stop" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={[styles.btnText, { color: '#FFFFFF', fontWeight: '700' }]}>Done Recording</Text>
              </TactilePressable>
            ) : (
              <TactilePressable
                onPress={handleStartRecord}
                disabled={isPreparing}
                style={[styles.actionBtn, styles.primaryBtn, { backgroundColor: colors.primary.default }]}
              >
                <Ionicons name="mic" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={[styles.btnText, { color: '#FFFFFF', fontWeight: '700' }]}>Start Recording</Text>
              </TactilePressable>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  sheetSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  pulseCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 5,
  },
  timerText: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
    marginBottom: 10,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    gap: 6,
    marginBottom: 12,
  },
  waveBar: {
    width: 5,
    borderRadius: 3,
  },
  statusHint: {
    fontSize: 13,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: 24,
  },
  primaryBtn: {},
  secondaryBtn: {
    borderWidth: 1,
  },
  stopBtn: {},
  btnText: {
    fontSize: 15,
  },
});
