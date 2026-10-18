import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { Card, CardContent, PrimaryButton, AppIcon, JournalReflectionIllustration, ScreenHeader, TactilePressable } from '../../components';
import type { AppIconName } from '../../components';
import { RootStackParamList, JournalType } from '../../types/navigation';
import { useAppTheme } from '../../theme/ThemeContext';
import { journalRepository } from '../../database/repositories/journalRepository';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PopIn } from '../../components/interactive/PopIn';
import { FormSkeleton } from '../../components/interactive/LoadingState';

const journalTypeLabels: Record<JournalType, string> = {
  free: 'Free writing',
  daily_reflection: 'Daily reflection',
  gratitude: 'Gratitude',
  stress: 'Stress release',
  sleep: 'Sleep journal',
  morning: 'Morning pages',
  evening: 'Evening unwind',
  brain_dump: 'Brain dump',
};

const journalTypeIcons: Record<JournalType, AppIconName> = {
  free: 'l-write',
  daily_reflection: 'i-sun',
  gratitude: 'l-gift',
  stress: 'l-pulse',
  sleep: 'i-moon',
  morning: 'i-sun',
  evening: 'i-moon',
  brain_dump: 'i-bulb',
};

export function JournalEntryScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'JournalEntry'>>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const params = (route as any)?.params ?? {};
  const rawType = (params as any)?.type;
  const type: JournalType = (rawType && (journalTypeLabels as any)[rawType] ? rawType : 'free') as JournalType;
  const id = (params as any)?.id ?? undefined;
  const isEditing = !!id;
  const typeIcon: AppIconName = (journalTypeIcons as any)?.[type] ?? 'l-write';
  const typeLabel = (journalTypeLabels as any)?.[type] ?? (typeof type === 'string' ? type : 'Entry');

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const { colors } = useAppTheme();

  // Load entry if editing
  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    const loadEntry = async () => {
      setLoading(true);
      try {
        const entry = await journalRepository.getById(id);
        if (entry && isMounted) {
          setTitle(entry.title || '');
          setContent(entry.body || '');
          setIsFavorite(!!entry.favorite);
        }
      } catch (err) {
        console.error('Failed to load entry:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadEntry();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleSave = async () => {
    const trimmedTitle = (title || '').trim();
    const trimmedContent = (content || '').trim();

    if (!trimmedContent && !trimmedTitle) {
      Alert.alert('Empty reflection', 'Please share your thoughts before saving.');
      return;
    }

    setSaving(true);
    try {
      if (isEditing && id) {
        await journalRepository.update(id, {
          title: trimmedTitle,
          body: trimmedContent,
          favorite: isFavorite,
        });
      } else {
        await journalRepository.create({
          type,
          title: trimmedTitle,
          body: trimmedContent,
          favorite: isFavorite,
        });
      }
      navigation.goBack();
    } catch (err) {
      console.error('Failed to save reflection:', err);
      Alert.alert('Save Error', 'Could not save your reflection. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(
      'Delete reflection?',
      'This entry will be permanently removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              await journalRepository.delete(id);
              navigation.goBack();
            } catch (err) {
              console.error('Failed to delete entry:', err);
              Alert.alert('Error', 'Could not delete entry.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer scroll={false} backgroundColor={colors.background.default}>
      <PopIn index={0}>
      <ScreenHeader
        title={isEditing ? 'Edit Reflection' : 'New Reflection'}
        right={
          isEditing ? (
            <TactilePressable
              onPress={handleDelete}
              hitSlop={8}
              style={{ padding: 4 }}
            >
              <Ionicons name="trash-outline" size={22} color="#EB697F" />
            </TactilePressable>
          ) : undefined
        }
      />
      </PopIn>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
      {/* Visual Zen Header Card */}
      <PopIn index={1}>
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 12,
          marginBottom: 16,
        }}
      >
        <JournalReflectionIllustration width={150} height={120} />
      </View>
      </PopIn>

      <PopIn index={2}>
      {loading ? (
        <FormSkeleton fields={2} />
      ) : (
        <Card variant="elevated" style={{ marginBottom: 20 }}>
          <CardContent style={{ padding: 20 }}>
            {/* Type Header Pill */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.primary.subtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: colors.primary.subtleBorder,
                }}
              >
                <AppIcon name={typeIcon} size={20} color={colors.primary.default} />
              </View>
              <View style={{ marginLeft: 12 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text.primary }}>
                  {typeLabel}
                </Text>
                <Text style={{ fontSize: 12, color: colors.text.tertiary }}>
                  {isEditing ? 'Tap below to modify' : 'Safe & private offline notes'}
                </Text>
              </View>
            </View>

            {/* Title input */}
            <TextInput
              placeholder="Title (optional)"
              placeholderTextColor={colors.text.tertiary}
              value={title}
              onChangeText={setTitle}
              style={{
                fontSize: 18,
                fontWeight: '700',
                color: colors.text.primary,
                borderBottomWidth: 1,
                borderBottomColor: colors.border.default,
                paddingBottom: 10,
                marginBottom: 14,
              }}
            />

            {/* Content input */}
            <TextInput
              multiline
              numberOfLines={10}
              placeholder="What thoughts or feelings are present for you right now?"
              placeholderTextColor={colors.text.tertiary}
              value={content}
              onChangeText={setContent}
              style={{
                fontSize: 16,
                lineHeight: 24,
                color: colors.text.primary,
                minHeight: 180,
                textAlignVertical: 'top',
                paddingTop: 4,
              }}
            />

            {/* Bottom Actions Row */}
            <View
              style={{
                marginTop: 16,
                paddingTop: 14,
                borderTopWidth: 1,
                borderTopColor: colors.border.default,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              <Pressable
                onPress={() => setIsFavorite(!isFavorite)}
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 9999,
                    backgroundColor: isFavorite ? '#FDF1F4' : colors.primary.subtle,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={16}
                  color={isFavorite ? '#DB3A60' : colors.text.tertiary}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: isFavorite ? '#DB3A60' : colors.text.tertiary,
                  }}
                >
                  {isFavorite ? 'Favorited' : 'Favorite'}
                </Text>
              </Pressable>
            </View>
          </CardContent>
        </Card>
      )}
      </PopIn>

      {/* Buttons */}
      <PopIn index={3}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <PrimaryButton
          title={saving ? 'Saving...' : 'Save Reflection'}
          variant="primary"
          size="lg"
          onPress={handleSave}
          disabled={saving || loading}
          style={{ flex: 2 }}
          fullWidth={false}
        />
        <PrimaryButton
          title="Cancel"
          variant="outline"
          size="lg"
          onPress={() => navigation?.goBack?.()}
          disabled={saving}
          style={{ flex: 1 }}
          fullWidth={false}
        />
      </View>
      </PopIn>
      </ScrollView>
    </ScreenContainer>
  );
}