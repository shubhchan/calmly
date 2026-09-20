import React from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleProp, ViewStyle } from 'react-native';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { Card, CardContent, PrimaryButton } from '../../components';
import { RootStackParamList, JournalType } from '../../types/navigation';

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

const journalTypeIcons: Record<JournalType, string> = {
  free: '✍️',
  daily_reflection: '🌅',
  gratitude: '🙏',
  stress: '💨',
  sleep: '🌙',
  morning: '☀️',
  evening: '🌆',
  brain_dump: '🧠',
};

export function JournalEntryScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'JournalEntry'>>();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { type = 'free', id } = route.params ?? {};
  const isEditing = !!id;

  return (
    <ScrollView
      className="flex-1 bg-[var(--color-bg-primary)]"
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 }}
    >
      <View className="mb-6">
        <Pressable
          onPress={() => navigation.goBack()}
          className="flex-row items-center"
        >
          <Text style={{ fontSize: 24, marginRight: 8 }}>←</Text>
          <Text className="text-body-lg font-medium" style={{ color: '#1E232E' }}>
            {isEditing ? 'Edit Entry' : 'New Entry'}
          </Text>
        </Pressable>
      </View>

      <Card variant="elevated" className="mb-6">
        <CardContent>
          <View className="flex-row items-center mb-4">
            <View
              className="flex items-center justify-center rounded-full"
              style={{
                width: 40,
                height: 40,
                backgroundColor: '#F0F4F0',
              }}
            >
              <Text style={{ fontSize: 20 }}>{journalTypeIcons[type]}</Text>
            </View>
            <View className="ml-3">
              <Text className="text-headline-sm font-semibold" style={{ color: '#1E232E' }}>
                {journalTypeLabels[type]}
              </Text>
              <Text className="text-body-sm" style={{ color: '#425474' }}>
                {isEditing ? 'Editing existing entry' : 'Start writing...'}
              </Text>
            </View>
          </View>

          <TextInput
            placeholder="Title (optional)"
            className="text-headline-md font-semibold mb-4 bg-transparent"
            style={{
              color: '#1E232E',
              borderBottomWidth: 1,
              borderBottomColor: '#E4DEBC',
              paddingBottom: 8,
            }}
          />

          <TextInput
            multiline
            numberOfLines={15}
            placeholder="What's on your mind?"
            className="text-body-lg bg-transparent"
            style={{
              color: '#1E232E',
              minHeight: 200,
              textAlignVertical: 'top',
            }}
          />

          <View className="mt-6 pt-4 border-t border-[var(--color-border-light)] flex-row items-center justify-between">
            <View className="flex-row gap-2">
              <Pressable className="flex-row items-center gap-1 px-3 py-1.5 rounded-full" style={{ backgroundColor: '#F5F0DE' }}>
                <Text style={{ fontSize: 16 }}>🏷️</Text>
                <Text className="text-label-sm" style={{ color: '#34415A' }}>Add tag</Text>
              </Pressable>
              <Pressable className="flex-row items-center gap-1 px-3 py-1.5 rounded-full" style={{ backgroundColor: '#F5F0DE' }}>
                <Text style={{ fontSize: 16 }}>📷</Text>
                <Text className="text-label-sm" style={{ color: '#34415A' }}>Add photo</Text>
              </Pressable>
              <Pressable className="flex-row items-center gap-1 px-3 py-1.5 rounded-full" style={{ backgroundColor: '#F5F0DE' }}>
                <Text style={{ fontSize: 16 }}>🎤</Text>
                <Text className="text-label-sm" style={{ color: '#34415A' }}>Record audio</Text>
              </Pressable>
            </View>
            <Pressable className="flex-row items-center gap-1 px-3 py-1.5 rounded-full" style={{ backgroundColor: '#F0F4F0' }}>
              <Text style={{ fontSize: 16 }}>❤️</Text>
              <Text className="text-label-sm" style={{ color: '#5A955A' }}>Favorite</Text>
            </Pressable>
          </View>
        </CardContent>
      </Card>

      <View className="flex-row gap-3">
        <PrimaryButton
          title="Save"
          variant="primary"
          size="lg"
          onPress={() => navigation.goBack()}
          className="flex-1"
          fullWidth
        />
        <PrimaryButton
          title="Cancel"
          variant="outline"
          size="lg"
          onPress={() => navigation.goBack()}
          className="flex-1"
          fullWidth
        />
      </View>
    </ScrollView>
  );
}