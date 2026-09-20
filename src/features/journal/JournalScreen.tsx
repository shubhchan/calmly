import React from 'react';
import { View, Text, ScrollView, Pressable, FlatList, StyleProp, ViewStyle } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Card, CardContent, PrimaryButton, StatPill } from '../../components';
import { RootStackParamList } from '../../types/navigation';

const journalTypes = [
  { id: 'free', label: 'Free writing', icon: '✍️', color: '#5A955A' },
  { id: 'daily_reflection', label: 'Daily reflection', icon: '🌅', color: '#877FC5' },
  { id: 'gratitude', label: 'Gratitude', icon: '🙏', color: '#EB876D' },
  { id: 'stress', label: 'Stress release', icon: '💨', color: '#EB697F' },
  { id: 'sleep', label: 'Sleep journal', icon: '🌙', color: '#5F9BB4' },
  { id: 'morning', label: 'Morning pages', icon: '☀️', color: '#6B9BCD' },
  { id: 'evening', label: 'Evening unwind', icon: '🌆', color: '#877FC5' },
  { id: 'brain_dump', label: 'Brain dump', icon: '🧠', color: '#5A955A' },
];

const mockEntries = [
  { id: '1', title: 'Morning reflections', type: 'morning', date: 'Sep 16', mood: '😊', favorite: true },
  { id: '2', title: 'Gratitude for small things', type: 'gratitude', date: 'Sep 15', mood: '🙏', favorite: true },
  { id: '3', title: 'Stressful meeting at work', type: 'stress', date: 'Sep 14', mood: '😰', favorite: false },
];

export function JournalScreen() {
  const navigation = useNavigation<any>();

  const renderJournalType = (item: typeof journalTypes[0], index: number) => (
    <Pressable
      onPress={() => navigation.navigate('JournalEntry', { type: item.id as any })}
      className="flex-1"
      style={{ minWidth: 140 }}
    >
      <Card variant="elevated" className="h-full">
        <CardContent className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <Text style={{ fontSize: 32 }}>{item.icon}</Text>
          <Text className="text-label-md font-semibold mt-3 text-center" style={{ color: '#1E232E' }}>
            {item.label}
          </Text>
        </CardContent>
      </Card>
    </Pressable>
  );

  const renderEntry = ({ item }: { item: typeof mockEntries[0]; index: number }) => (
    <Card variant="elevated" className="mb-3">
      <CardContent>
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-center flex-1">
            <Text style={{ fontSize: 24, marginRight: 12 }}>{item.mood}</Text>
            <View>
              <Text className="text-headline-sm font-semibold" style={{ color: '#1E232E' }}>
                {item.title}
              </Text>
              <Text className="text-body-sm" style={{ color: '#425474' }}>
                {item.date} · {journalTypes.find(t => t.id === item.type)?.label}
              </Text>
            </View>
          </View>
          {item.favorite && (
            <Text style={{ fontSize: 20 }}>❤️</Text>
          )}
        </View>
      </CardContent>
    </Card>
  );

  return (
    <ScrollView
      className="flex-1 bg-[var(--color-bg-primary)]"
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 }}
    >
      <View className="mb-8">
        <Text className="text-display-sm font-bold" style={{ color: '#1E232E' }}>
          My Journal
        </Text>
        <Text className="text-body-lg mt-1" style={{ color: '#34415A' }}>
          {mockEntries.length} entries · Tap to continue or start new
        </Text>
      </View>

      <View className="mb-6">
        <Text className="text-headline-md font-semibold mb-3" style={{ color: '#1E232E' }}>
          Start a new entry
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20, gap: 12 }}
        >
          {journalTypes.map(renderJournalType)}
        </ScrollView>
      </View>

      <View className="mb-6">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-headline-md font-semibold" style={{ color: '#1E232E' }}>
            Recent Entries
          </Text>
          <Pressable
            onPress={() => {}}
            className="text-label-md"
          >
            <Text style={{ color: '#5A955A' }}>View all</Text>
          </Pressable>
        </View>
        {mockEntries.length > 0 ? (
          <FlatList
            data={mockEntries}
            renderItem={renderEntry}
            keyExtractor={item => item.id}
            ListEmptyComponent={
              <EmptyState
                icon="📖"
                title="No entries yet"
                subtitle="Your first thought can start here 🌱"
                actionLabel="Create entry"
                onAction={() => navigation.navigate('JournalEntry', { type: 'free' })}
              />
            }
          />
        ) : (
          <EmptyState
            icon="📖"
            title="No entries yet"
            subtitle="Your first thought can start here 🌱"
            actionLabel="Create entry"
            onAction={() => navigation.navigate('JournalEntry', { type: 'free' })}
          />
        )}
      </View>
    </ScrollView>
  );
}

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}

function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="flex items-center py-12 px-4">
      <Text style={{ fontSize: 48 }}>{icon}</Text>
      <Text className="text-headline-sm font-semibold mt-4 text-center" style={{ color: '#1E232E' }}>
        {title}
      </Text>
      <Text className="text-body-md mt-2 text-center" style={{ color: '#425474' }}>
        {subtitle}
      </Text>
      {actionLabel && onAction && (
        <PrimaryButton
          title={actionLabel}
          variant="primary"
          size="sm"
          onPress={onAction}
          className="mt-4 w-auto"
          fullWidth={false}
        />
      )}
    </View>
  );
}