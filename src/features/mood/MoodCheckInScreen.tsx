import React, { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, Button, MoodFace, TactilePressable } from '../../components';
import { RootStackParamList, MoodType } from '../../types/navigation';
import { useAppTheme } from '../../theme/ThemeContext';
import { moodRepository } from '../../database/repositories/moodRepository';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { hapticFeedback } from '../../utils/haptics';
import { Storage } from '../../services/storage';
import { resolveTint, type TintName } from '../../theme/tints';

type Step = 'mood' | 'note';

interface MoodOption {
  id: MoodType;
  label: string;
  energy: 'low' | 'medium' | 'high';
  tint: TintName;
  /** How much of the felt strength reads as tension for older reports. */
  stressFactor: number;
}

/** The full feeling vocabulary. Each id already exists in past records. */
const MOODS: MoodOption[] = [
  { id: 'happy', label: 'Happy', energy: 'high', tint: 'cream', stressFactor: 0.3 },
  { id: 'excited', label: 'Excited', energy: 'high', tint: 'coral', stressFactor: 0.5 },
  { id: 'grateful', label: 'Grateful', energy: 'medium', tint: 'cream', stressFactor: 0.3 },
  { id: 'content', label: 'Content', energy: 'medium', tint: 'mint', stressFactor: 0.4 },
  { id: 'peaceful', label: 'Calm', energy: 'medium', tint: 'sky', stressFactor: 0.3 },
  { id: 'hopeful', label: 'Hopeful', energy: 'medium', tint: 'lilac', stressFactor: 0.4 },
  { id: 'proud', label: 'Proud', energy: 'high', tint: 'sage', stressFactor: 0.3 },
  { id: 'motivated', label: 'Motivated', energy: 'high', tint: 'coral', stressFactor: 0.5 },
  { id: 'relieved', label: 'Relieved', energy: 'medium', tint: 'mint', stressFactor: 0.3 },
  { id: 'connected', label: 'Connected', energy: 'medium', tint: 'sage', stressFactor: 0.3 },
  { id: 'anxious', label: 'Anxious', energy: 'high', tint: 'sky', stressFactor: 1 },
  { id: 'stressed', label: 'Stressed', energy: 'high', tint: 'coral', stressFactor: 1 },
  { id: 'overwhelmed', label: 'Overwhelmed', energy: 'high', tint: 'blush', stressFactor: 1 },
  { id: 'angry', label: 'Angry', energy: 'high', tint: 'blush', stressFactor: 0.9 },
  { id: 'frustrated', label: 'Frustrated', energy: 'high', tint: 'coral', stressFactor: 0.9 },
  { id: 'sad', label: 'Sad', energy: 'low', tint: 'lilac', stressFactor: 0.8 },
  { id: 'exhausted', label: 'Tired', energy: 'low', tint: 'blush', stressFactor: 0.9 },
  { id: 'lonely', label: 'Lonely', energy: 'low', tint: 'lilac', stressFactor: 0.8 },
  { id: 'uncertain', label: 'Unsure', energy: 'low', tint: 'sky', stressFactor: 0.8 },
  { id: 'bored', label: 'Bored', energy: 'low', tint: 'cream', stressFactor: 0.6 },
];

/** First twelve sit on the wheel; the rest stay one tap away. */
const WHEEL_IDS: MoodType[] = [
  'happy',
  'excited',
  'grateful',
  'content',
  'peaceful',
  'hopeful',
  'anxious',
  'stressed',
  'angry',
  'sad',
  'exhausted',
  'lonely',
];

const WHEEL_MOODS = WHEEL_IDS.map((id) => MOODS.find((mood) => mood.id === id)).filter(
  (mood): mood is MoodOption => !!mood,
);

const MORE_MOODS = MOODS.filter((mood) => !WHEEL_IDS.includes(mood.id));

const CONTEXTS = [
  'Work',
  'School',
  'Family',
  'Friends',
  'Partner',
  'Kids',
  'Sleep',
  'Health',
  'Money',
  'Body',
  'Home',
  'Weather',
  'News',
  'Social media',
  'Food',
  'Exercise',
  'Commute',
  'Nothing in particular',
];

const NOTHING = 'Nothing in particular';
const CUSTOM_CONTEXTS_KEY = 'mood_custom_contexts';

function readCustomContexts(): string[] {
  try {
    const raw = Storage.getString(CUSTOM_CONTEXTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  } catch {
    return [];
  }
}

/**
 * Mood check-in — a circular wheel of feelings, one strength line, and plenty
 * of plain reason pills plus your own words. The note stays optional.
 */
export function MoodCheckInScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { colors } = useAppTheme();

  const [step, setStep] = useState<Step>('mood');
  const [selectedMoods, setSelectedMoods] = useState<MoodOption[]>([]);
  const [strength, setStrength] = useState(5);
  const [contexts, setContexts] = useState<string[]>([]);
  const [customContexts, setCustomContexts] = useState<string[]>(readCustomContexts);
  const [addingContext, setAddingContext] = useState(false);
  const [contextDraft, setContextDraft] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const close = () => navigation?.goBack?.();

  const toggleMood = (mood: MoodOption) => {
    hapticFeedback.selection();
    setSelectedMoods((current) =>
      current.some((item) => item.id === mood.id)
        ? current.filter((item) => item.id !== mood.id)
        : [...current, mood],
    );
  };

  const removeMood = (id: MoodType) => {
    hapticFeedback.selection();
    setSelectedMoods((current) => current.filter((item) => item.id !== id));
  };

  const toggleContext = (value: string) => {
    hapticFeedback.selection();
    setContexts((current) => {
      if (value === NOTHING) {
        return current.includes(value) ? [] : [value];
      }
      const withoutNothing = current.filter((item) => item !== NOTHING);
      return withoutNothing.includes(value)
        ? withoutNothing.filter((item) => item !== value)
        : [...withoutNothing, value];
    });
  };

  const addCustomContext = () => {
    const value = contextDraft.trim().replace(/\s+/g, ' ').slice(0, 28);
    if (!value) {
      setAddingContext(false);
      setContextDraft('');
      return;
    }
    const exists = [...CONTEXTS, ...customContexts].some(
      (item) => item.toLowerCase() === value.toLowerCase(),
    );
    if (!exists) {
      const next = [...customContexts, value];
      setCustomContexts(next);
      Storage.setString(CUSTOM_CONTEXTS_KEY, JSON.stringify(next));
      setContexts((current) => [...current.filter((item) => item !== NOTHING), value]);
    } else if (!contexts.includes(value)) {
      setContexts((current) => [...current.filter((item) => item !== NOTHING), value]);
    }
    hapticFeedback.success();
    setContextDraft('');
    setAddingContext(false);
  };

  const save = async () => {
    if (selectedMoods.length === 0 || saving) return;
    const primary = selectedMoods[0];
    const averageStress =
      selectedMoods.reduce((sum, mood) => sum + mood.stressFactor, 0) / selectedMoods.length;
    setSaving(true);
    setSaveError('');
    try {
      await moodRepository.create({
        mood: selectedMoods.map((mood) => mood.id).join(','),
        intensity: strength,
        stress: Math.max(1, Math.round(strength * averageStress)),
        energy: primary.energy,
        context: contexts.join(', '),
        needs: note.trim(),
      });
      hapticFeedback.success();
      close();
    } catch (error) {
      console.error('Failed to save mood check-in:', error);
      setSaveError('We could not save this check-in. Try again.');
      setSaving(false);
    }
  };

  return (
    <ScreenContainer
      scroll={false}
      animate={false}
      backgroundColor={colors.background.default}
    >
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 24,
            paddingTop: 10,
            height: 48,
          }}
        >
          <TactilePressable
            onPress={step === 'note' ? () => setStep('mood') : close}
            scaleDownTo={0.9}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={step === 'note' ? 'Back to mood' : 'Close check-in'}
            style={{ width: 36, alignItems: 'flex-start' }}
          >
            <Ionicons
              name={step === 'note' ? 'chevron-back' : 'close'}
              size={21}
              color={colors.text.secondary}
            />
          </TactilePressable>
          <AppText variant="caption" tone="tertiary">
            {step === 'note' ? 'Step 2 of 2' : 'Step 1 of 2'}
          </AppText>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 'mood' ? (
            <>
              <AppText variant="overline" tone="tertiary">
                Check in
              </AppText>
              <AppText variant="h2" style={{ marginTop: 8 }}>
                How are you, right now?
              </AppText>
              <AppText variant="bodySmall" tone="tertiary" style={{ marginTop: 7 }}>
                Tap every feeling that fits.
              </AppText>

              <MoodWheel selected={selectedMoods} onSelect={toggleMood} />

              {selectedMoods.length > 0 ? (
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  {selectedMoods.map((mood) => (
                    <TactilePressable
                      key={mood.id}
                      onPress={() => removeMood(mood.id)}
                      scaleDownTo={0.95}
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${mood.label}`}
                      style={{
                        height: 32,
                        paddingLeft: 12,
                        paddingRight: 8,
                        borderRadius: 999,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: colors.primary.subtle,
                      }}
                    >
                      <MoodFace mood={mood.id} size={15} color={colors.primary.default} />
                      <AppText variant="caption" tone="link">
                        {mood.label}
                      </AppText>
                      <Ionicons name="close" size={12} color={colors.text.tertiary} />
                    </TactilePressable>
                  ))}
                </View>
              ) : null}

              <MoreFeelings
                moods={MORE_MOODS}
                selectedIds={selectedMoods.map((mood) => mood.id)}
                onSelect={toggleMood}
              />

              {/* Strength */}
              <View style={{ marginTop: 30 }}>
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    marginBottom: 12,
                  }}
                >
                  <AppText variant="bodySmall" style={{ fontWeight: '600' }}>
                    How strong is it?
                  </AppText>
                  <AppText variant="caption" tone="link">
                    {strength} of 10
                  </AppText>
                </View>
                <StrengthSlider value={strength} onChange={setStrength} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                  <AppText variant="caption" tone="tertiary">
                    A little
                  </AppText>
                  <AppText variant="caption" tone="tertiary">
                    Very much
                  </AppText>
                </View>
              </View>

              {/* Reasons */}
              <View style={{ marginTop: 32 }}>
                <AppText variant="overline" tone="tertiary" style={{ marginBottom: 9 }}>
                  Anything behind it?
                </AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {[...CONTEXTS, ...customContexts].map((value) => {
                    const selected = contexts.includes(value);
                    return (
                      <TactilePressable
                        key={value}
                        onPress={() => toggleContext(value)}
                        scaleDownTo={0.95}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: selected }}
                        accessibilityLabel={value}
                        style={{
                          height: 34,
                          paddingHorizontal: 14,
                          borderRadius: 999,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: selected ? colors.surface.selected : colors.surface.muted,
                        }}
                      >
                        <AppText variant="caption" tone={selected ? 'link' : 'secondary'}>
                          {value}
                        </AppText>
                      </TactilePressable>
                    );
                  })}

                  {addingContext ? (
                    <View
                      style={{
                        height: 34,
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderRadius: 999,
                        backgroundColor: colors.surface.default,
                        borderWidth: 1,
                        borderColor: colors.border.default,
                        paddingLeft: 14,
                        paddingRight: 4,
                        gap: 4,
                      }}
                    >
                      <TextInput
                        value={contextDraft}
                        onChangeText={setContextDraft}
                        onSubmitEditing={addCustomContext}
                        placeholder="Your reason"
                        placeholderTextColor={colors.text.tertiary}
                        autoFocus
                        maxLength={28}
                        returnKeyType="done"
                        accessibilityLabel="Write your own reason"
                        style={{
                          minWidth: 120,
                          fontSize: 12,
                          color: colors.text.primary,
                          paddingVertical: 0,
                        }}
                      />
                      <TactilePressable
                        onPress={addCustomContext}
                        scaleDownTo={0.9}
                        hitSlop={6}
                        accessibilityRole="button"
                        accessibilityLabel="Add reason"
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: colors.primary.default,
                        }}
                      >
                        <Ionicons name="checkmark" size={16} color={colors.primary.foreground} />
                      </TactilePressable>
                    </View>
                  ) : (
                    <TactilePressable
                      onPress={() => {
                        hapticFeedback.selection();
                        setAddingContext(true);
                      }}
                      scaleDownTo={0.95}
                      accessibilityRole="button"
                      accessibilityLabel="Add your own reason"
                      style={{
                        height: 34,
                        paddingHorizontal: 14,
                        borderRadius: 999,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        borderWidth: 1,
                        borderColor: colors.border.strong,
                      }}
                    >
                      <Ionicons name="add" size={15} color={colors.text.secondary} />
                      <AppText variant="caption" tone="secondary">
                        Add your own
                      </AppText>
                    </TactilePressable>
                  )}
                </View>
              </View>
            </>
          ) : (
            <>
              <AppText variant="overline" tone="tertiary">
                A few words
              </AppText>
              <AppText variant="h2" style={{ marginTop: 8 }}>
                Anything you want to add?
              </AppText>
              <AppText variant="bodySmall" tone="tertiary" style={{ marginTop: 7 }}>
                Optional. One line is plenty.
              </AppText>
              <TextInput
                value={note}
                onChangeText={setNote}
                multiline
                placeholder="What is behind this feeling?"
                placeholderTextColor={colors.text.tertiary}
                accessibilityLabel="Note for this check-in"
                style={{
                  marginTop: 24,
                  minHeight: 140,
                  borderRadius: 16,
                  backgroundColor: colors.surface.default,
                  paddingHorizontal: 16,
                  paddingTop: 14,
                  paddingBottom: 14,
                  fontSize: 17,
                  lineHeight: 26,
                  color: colors.text.primary,
                  textAlignVertical: 'top',
                }}
              />
              <AppText variant="caption" tone="tertiary" style={{ marginTop: 12 }}>
                Saved with your mood, on this device only.
              </AppText>
            </>
          )}

          {saveError ? (
            <AppText variant="caption" tone="error" center style={{ marginTop: 14 }} accessibilityRole="alert">
              {saveError}
            </AppText>
          ) : null}
        </ScrollView>

        {/* Action */}
        <View
          style={{
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 24,
            gap: 12,
            backgroundColor: colors.background.default,
          }}
        >
          {step === 'mood' ? (
            <>
              <Button
                title="Save this moment"
                onPress={save}
                fullWidth
                loading={saving}
                disabled={selectedMoods.length === 0 || saving}
              />
              <TactilePressable
                onPress={() => setStep('note')}
                scaleDownTo={0.97}
                accessibilityRole="button"
                accessibilityLabel="Add a note first"
                style={{ alignItems: 'center', paddingVertical: 2 }}
              >
                <AppText variant="caption" tone="tertiary">
                  Add a note first
                </AppText>
              </TactilePressable>
            </>
          ) : (
            <>
              <Button title="Save this moment" onPress={save} fullWidth loading={saving} disabled={saving} />
              <TactilePressable
                onPress={save}
                scaleDownTo={0.97}
                accessibilityRole="button"
                accessibilityLabel="Skip the note and save"
                style={{ alignItems: 'center', paddingVertical: 2 }}
              >
                <AppText variant="caption" tone="tertiary">
                  Skip the note
                </AppText>
              </TactilePressable>
            </>
          )}
        </View>
      </View>
    </ScreenContainer>
  );
}

/** A ring of feelings. The chosen ones fill the middle of the wheel. */
function MoodWheel({
  selected,
  onSelect,
}: {
  selected: MoodOption[];
  onSelect: (mood: MoodOption) => void;
}) {
  const { colors, isDark } = useAppTheme();
  const [size, setSize] = useState(0);
  const primary = selected[0];

  const center = size / 2;
  const ringRadius = size * 0.28;
  const labelRadius = size * 0.385;
  const dotSize = Math.max(30, size * 0.098);
  const labelWidth = Math.max(58, size * 0.19);
  const centerDiameter = size * 0.3;

  return (
    <View
      onLayout={(event) => {
        const next = event.nativeEvent.layout.width;
        if (next !== size) setSize(next);
      }}
      style={{ width: '100%', aspectRatio: 1, alignSelf: 'center', marginTop: 18 }}
    >
      {size > 0 ? (
        <>
          {/* Quiet inner rings suggest a wheel without drawing attention. */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: center - ringRadius,
              top: center - ringRadius,
              width: ringRadius * 2,
              height: ringRadius * 2,
              borderRadius: ringRadius,
              borderWidth: 1,
              borderColor: colors.border.subtle,
            }}
          />

          <View
            style={{
              position: 'absolute',
              left: center - centerDiameter / 2,
              top: center - centerDiameter / 2,
              width: centerDiameter,
              height: centerDiameter,
              borderRadius: centerDiameter / 2,
              backgroundColor: colors.surface.default,
              borderWidth: 1,
              borderColor: colors.border.subtle,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 6,
            }}
          >
            {primary ? (
              <>
                {selected.length > 1 ? (
                  <>
                    <AppText variant="h3" style={{ lineHeight: 32 }}>
                      {selected.length}
                    </AppText>
                    <AppText variant="caption" tone="tertiary" style={{ fontSize: 10 }}>
                      feelings
                    </AppText>
                  </>
                ) : (
                  <>
                    <MoodFace mood={primary.id} size={27} color={colors.primary.default} />
                    <AppText
                      variant="title"
                      center
                      numberOfLines={2}
                      style={{ marginTop: 2, fontSize: 15, lineHeight: 19 }}
                    >
                      {primary.label}
                    </AppText>
                  </>
                )}
              </>
            ) : (
              <AppText variant="caption" tone="tertiary" center style={{ lineHeight: 15 }}>
                Pick a{'\n'}feeling
              </AppText>
            )}
          </View>

          {WHEEL_MOODS.map((mood, index) => {
            const angle = ((-90 + (360 / WHEEL_MOODS.length) * index) * Math.PI) / 180;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            const tint = resolveTint(isDark, mood.tint);
            const isSelected = selected.some((item) => item.id === mood.id);
            const actualDot = isSelected ? dotSize + 6 : dotSize;
            const dotLeft = center + ringRadius * cos - actualDot / 2;
            const dotTop = center + ringRadius * sin - actualDot / 2;

            return (
              <React.Fragment key={mood.id}>
                <TactilePressable
                  onPress={() => onSelect(mood)}
                  scaleDownTo={0.9}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={mood.label}
                  style={{
                    position: 'absolute',
                    left: dotLeft,
                    top: dotTop,
                    width: actualDot,
                    height: actualDot,
                    borderRadius: actualDot / 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected ? tint.accent : tint.bg,
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected ? tint.accent : tint.border,
                  }}
                >
                  <MoodFace
                    mood={mood.id}
                    size={actualDot * 0.72}
                    color={isSelected ? colors.primary.foreground : tint.accent}
                  />
                </TactilePressable>

                <AppText
                  variant="caption"
                  tone={isSelected ? 'primary' : 'secondary'}
                  center
                  numberOfLines={1}
                  style={{
                    position: 'absolute',
                    left: center + labelRadius * cos - labelWidth / 2,
                    top: center + labelRadius * sin - 7,
                    width: labelWidth,
                    fontSize: 10.5,
                    lineHeight: 14,
                    fontWeight: isSelected ? '600' : '500',
                  }}
                >
                  {mood.label}
                </AppText>
              </React.Fragment>
            );
          })}
        </>
      ) : null}
    </View>
  );
}

/** Remaining feelings, shown only when the wheel's twelve are not enough. */
function MoreFeelings({
  moods,
  selectedIds,
  onSelect,
}: {
  moods: MoodOption[];
  selectedIds: MoodType[];
  onSelect: (mood: MoodOption) => void;
}) {
  const { colors } = useAppTheme();
  const [open, setOpen] = useState(false);
  const hasSelection = moods.some((mood) => selectedIds.includes(mood.id));

  return (
    <View style={{ marginTop: 14, alignItems: 'center' }}>
      {open || hasSelection ? (
        <>
          <AppText variant="overline" tone="tertiary" style={{ marginBottom: 10, alignSelf: 'flex-start' }}>
            More feelings
          </AppText>
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
          {moods.map((mood) => {
            const selected = selectedIds.includes(mood.id);
            return (
              <TactilePressable
                key={mood.id}
                onPress={() => onSelect(mood)}
                scaleDownTo={0.95}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selected }}
                accessibilityLabel={mood.label}
                style={{
                  height: 32,
                  paddingHorizontal: 13,
                  borderRadius: 999,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: selected ? colors.surface.selected : colors.surface.muted,
                }}
              >
                <MoodFace
                  mood={mood.id}
                  size={14}
                  color={selected ? colors.primary.default : colors.text.secondary}
                />
                <AppText variant="caption" tone={selected ? 'link' : 'secondary'}>
                  {mood.label}
                </AppText>
              </TactilePressable>
            );
          })}
          </View>
        </>
      ) : (
        <TactilePressable
          onPress={() => {
            hapticFeedback.selection();
            setOpen(true);
          }}
          scaleDownTo={0.96}
          accessibilityRole="button"
          accessibilityLabel="Show more feelings"
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6 }}
        >
          <AppText variant="caption" tone="tertiary">
            More feelings
          </AppText>
          <Ionicons name="chevron-down" size={14} color={colors.text.tertiary} />
        </TactilePressable>
      )}
    </View>
  );
}

/** Ten equal zones on one track. The thumb marks the chosen step. */
function StrengthSlider({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  const { colors } = useAppTheme();
  const percent = `${((value - 1) / 9) * 100}%` as const;

  return (
    <View style={{ height: 22, justifyContent: 'center' }}>
      <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surface.muted }}>
        <View style={{ width: percent, height: 8, borderRadius: 4, backgroundColor: colors.primary.default }} />
      </View>
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: percent,
          marginLeft: -11,
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: colors.surface.default,
          borderWidth: 2,
          borderColor: colors.primary.default,
        }}
      />
      <View style={{ position: 'absolute', left: 0, right: 0, flexDirection: 'row' }}>
        {Array.from({ length: 10 }, (_, index) => index + 1).map((step) => (
          <TactilePressable
            key={step}
            onPress={() => {
              hapticFeedback.selection();
              onChange(step);
            }}
            hapticStyle="none"
            scaleDownTo={1}
            accessibilityRole="adjustable"
            accessibilityLabel={`Strength ${step} of 10`}
            style={{ flex: 1, height: 22 }}
          />
        ))}
      </View>
    </View>
  );
}
