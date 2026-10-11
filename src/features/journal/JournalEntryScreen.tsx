import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable } from 'react-native';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { Card, CardContent, PrimaryButton, AppIcon } from '../../components';
import type { AppIconName } from '../../components';
import { RootStackParamList, JournalType } from '../../types/navigation';
import { useThemeColors } from '../../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

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

  let themeColors: ReturnType<typeof useThemeColors> | undefined;
  try {
    themeColors = useThemeColors();
  } catch {
    themeColors = undefined;
  }
  const colors = themeColors ?? {
    bgPrimary: '#FBF9F5',
    bgCard: '#FFFFFF',
    borderLight: '#E6E0D4',
    textPrimary: '#1A212D',
    textSecondary: '#384455',
    textTertiary: '#607085',
    accentPrimary: '#3E7B52',
    accentBg: '#EDF5EF',
    accentBorder: '#C2DCBF',
    isDark: false,
  } as any;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bgPrimary }}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Bar */}
      <View style={{ marginBottom: 20 }}>
        <Pressable
          onPress={() => navigation?.goBack?.()}
          style={({ pressed }) => [
            {
              flexDirection: 'row',
              alignItems: 'center',
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary }}>
            {isEditing ? 'Edit Reflection' : 'New Reflection'}
          </Text>
        </Pressable>
      </View>

      <Card variant="elevated" style={{ marginBottom: 20 }}>
        <CardContent style={{ padding: 20 }}>
          {/* Type Badge Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18 }}>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.accentBg,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.accentBorder,
              }}
            >
              <AppIcon name={typeIcon} size={22} color={colors.accentPrimary} />
            </View>
            <View style={{ marginLeft: 12 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: colors.textPrimary }}>
                {typeLabel}
              </Text>
              <Text style={{ fontSize: 13, color: colors.textTertiary, marginTop: 2 }}>
                {isEditing ? 'Editing existing entry' : 'Write freely in your calm space'}
              </Text>
            </View>
          </View>

          {/* Title input */}
          <TextInput
            placeholder="Title (optional)"
            placeholderTextColor={colors.textTertiary}
            value={title}
            onChangeText={setTitle}
            style={{
              fontSize: 20,
              fontWeight: '700',
              color: colors.textPrimary,
              borderBottomWidth: 1,
              borderBottomColor: colors.borderLight,
              paddingBottom: 12,
              marginBottom: 16,
            }}
          />

          {/* Content input */}
          <TextInput
            multiline
            numberOfLines={12}
            placeholder="What thoughts or feelings are present for you right now?"
            placeholderTextColor={colors.textTertiary}
            value={content}
            onChangeText={setContent}
            style={{
              fontSize: 16,
              lineHeight: 24,
              color: colors.textPrimary,
              minHeight: 200,
              textAlignVertical: 'top',
              paddingTop: 4,
            }}
          />

          {/* Bottom Actions Row */}
          <View
            style={{
              marginTop: 20,
              paddingTop: 16,
              borderTopWidth: 1,
              borderTopColor: colors.borderLight,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 9999,
                    backgroundColor: colors.accentBg,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons name="pricetag-outline" size={15} color={colors.accentPrimary} style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.accentPrimary }}>Tag</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: 9999,
                    backgroundColor: colors.accentBg,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Ionicons name="camera-outline" size={15} color={colors.accentPrimary} style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.accentPrimary }}>Photo</Text>
              </Pressable>
            </View>

            <Pressable
              onPress={() => setIsFavorite(!isFavorite)}
              style={({ pressed }) => [
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 9999,
                  backgroundColor: isFavorite ? '#FDF1F4' : colors.accentBg,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={16}
                color={isFavorite ? '#DB3A60' : colors.textTertiary}
                style={{ marginRight: 4 }}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: isFavorite ? '#DB3A60' : colors.textTertiary,
                }}
              >
                {isFavorite ? 'Favorited' : 'Favorite'}
              </Text>
            </Pressable>
          </View>
        </CardContent>
      </Card>

      {/* Buttons */}
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <PrimaryButton
          title="Save Reflection"
          variant="primary"
          size="lg"
          onPress={() => navigation?.goBack?.()}
          style={{ flex: 2 }}
          fullWidth={false}
        />
        <PrimaryButton
          title="Cancel"
          variant="outline"
          size="lg"
          onPress={() => navigation?.goBack?.()}
          style={{ flex: 1 }}
          fullWidth={false}
        />
      </View>
    </ScrollView>
  );
}