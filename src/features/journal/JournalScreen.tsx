import React, { useState, useRef, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  AppIcon,
  Divider,
  EmptyState,
  IconButton,
  ListItem,
  Modal,
  PageHeader,
  SearchInput,
} from '../../components';
import { useAppTheme } from '../../theme/ThemeContext';
import { journalRepository } from '../../database/repositories/journalRepository';
import { format } from 'date-fns';
import { hapticFeedback } from '../../utils/haptics';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ListSkeleton } from '../../components/interactive/LoadingState';
import Animated from 'react-native-reanimated';
import { sharedElementStyle, sharedTransitionTags } from '../../theme/sharedTransitions';
import { shape, spacing } from '../../theme/tokens';

interface JournalTemplate {
  id: string;
  label: string;
  desc: string;
  icon: string;
  color: string;
}

const journalTypes: JournalTemplate[] = [
  { id: 'free', label: 'Free Writing', desc: 'Unstructured flow of thoughts', icon: 'i-create-outline', color: '#5EBE7B' },
  { id: 'daily_reflection', label: 'Daily Review', desc: 'Reflect upon today’s events', icon: 'i-sunny-outline', color: '#F59E0B' },
  { id: 'gratitude', label: 'Gratitude', desc: 'Counting subtle blessings', icon: 'i-heart-outline', color: '#F43F5E' },
  { id: 'stress', label: 'Stress Release', desc: 'Release mental tension', icon: 'i-leaf-outline', color: '#10B981' },
  { id: 'sleep', label: 'Sleep & Dreams', desc: 'Nighttime closure & rest', icon: 'i-moon-outline', color: '#6366F1' },
  { id: 'morning', label: 'Morning Pages', desc: 'Mindful dawn clarity', icon: 'i-cafe-outline', color: '#0EA5E9' },
  { id: 'brain_dump', label: 'Brain Dump', desc: 'Declutter racing thoughts', icon: 'i-sparkles-outline', color: '#8B5CF6' },
];

const DOCK_HEIGHT = 52;
const DOCK_GAP = spacing[3];
const TAB_BAR_BASE_HEIGHT = 58;

export function JournalScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [templatesVisible, setTemplatesVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const hasLoadedRef = useRef(false);

  const tabBarHeight = TAB_BAR_BASE_HEIGHT + Math.max(insets.bottom, 10);
  const dockOffset = tabBarHeight + DOCK_GAP;
  const contentBottom = dockOffset + DOCK_HEIGHT + spacing[5];

  const filteredEntries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((entry) => {
      const title = (entry.title ?? '').toLowerCase();
      const body = (entry.body ?? '').toLowerCase();
      const typeLabel = (journalTypes.find((t) => t.id === entry.type)?.label ?? '').toLowerCase();
      return title.includes(q) || body.includes(q) || typeLabel.includes(q);
    });
  }, [entries, searchQuery]);

  const loadEntries = useCallback(async (showSpinner: boolean = false) => {
    if (showSpinner || !hasLoadedRef.current) setLoading(true);
    try {
      const all = await journalRepository.getAll();
      setEntries(all ?? []);
    } catch (e) {
      console.error('Failed to load journals:', e);
      setEntries([]);
    } finally {
      hasLoadedRef.current = true;
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  const openEntry = useCallback(
    (type: string) => {
      setTemplatesVisible(false);
      navigation?.navigate?.('JournalEntry', { type });
    },
    [navigation]
  );

  const handleToggleFavorite = async (entry: any) => {
    hapticFeedback.medium();
    try {
      await journalRepository.toggleFavorite(entry.id);
      loadEntries();
    } catch (e) {
      console.error('Failed to toggle favorite:', e);
    }
  };

  const renderEntry = (entry: any, index: number) => {
    const typeConfig = journalTypes.find((t) => t.id === entry.type) ?? journalTypes[0];
    const formattedDate = format(entry.createdAt ? new Date(entry.createdAt) : new Date(), 'MMM d, yyyy');
    const snippet = (entry.body ?? '').replace(/\s+/g, ' ').trim();
    const title = (entry.title ?? '').trim() || typeConfig.label;
    const subtitle = snippet ? `${formattedDate} · ${snippet}` : `${formattedDate} · ${typeConfig.label}`;

    return (
      <View key={entry.id}>
        {index > 0 ? <Divider /> : null}
        <ListItem
          title={title}
          subtitle={subtitle}
          onPress={() =>
            navigation.navigate('JournalEntry', {
              id: entry.id,
              type: (entry.type ?? 'free') as any,
              preview: { title: entry.title, body: entry.body, favorite: !!entry.favorite },
            })
          }
          left={
            <Animated.View
              sharedTransitionTag={entry.id ? sharedTransitionTags.journalEntryIcon(entry.id) : undefined}
              sharedTransitionStyle={sharedElementStyle}
              style={[styles.entryIcon, { backgroundColor: typeConfig.color + '1F' }]}
            >
              <AppIcon name={typeConfig.icon} size={20} color={typeConfig.color} />
            </Animated.View>
          }
          right={
            <IconButton
              icon={entry.favorite ? 'i-heart' : 'i-heart-outline'}
              accessibilityLabel={entry.favorite ? 'Remove from favorites' : 'Add to favorites'}
              variant="ghost"
              size="sm"
              tone={entry.favorite ? 'error' : 'subtle'}
              onPress={() => handleToggleFavorite(entry)}
            />
          }
          style={styles.entryRow}
        />
      </View>
    );
  };

  const showEmptyState = !loading && entries.length === 0;
  const showNoResults = !loading && entries.length > 0 && filteredEntries.length === 0;

  return (
    <ScreenContainer scroll={false} bottomPadding={0} style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: contentBottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => loadEntries(true)}
            tintColor={colors.primary.default}
          />
        }
      >
        <PageHeader
          title="My Journal"
          subtitle={`${entries.length} reflection${entries.length === 1 ? '' : 's'} recorded`}
          right={
            <IconButton
              icon="i-sparkles"
              accessibilityLabel="Open journal templates"
              variant="subtle"
              tone="primary"
              onPress={() => setTemplatesVisible(true)}
            />
          }
        />

        {loading && entries.length === 0 ? (
          <ListSkeleton rows={4} showHeader={false} />
        ) : showEmptyState ? (
          <EmptyState
            iconName="i-create-outline"
            iconTone="sage"
            title="A fresh blank canvas"
            description="Write down your thoughts, a moment of presence, or release whatever weighs on you."
            action={{ label: 'Start first entry', onPress: () => openEntry('free') }}
            style={styles.stateBlock}
          />
        ) : showNoResults ? (
          <EmptyState
            iconName="i-search"
            iconTone="lilac"
            title="No reflections found"
            description={`No entries match “${searchQuery.trim()}”. Try different keywords.`}
            action={{ label: 'Clear search', onPress: () => setSearchQuery(''), variant: 'secondary' }}
            style={styles.stateBlock}
          />
        ) : (
          <View
            style={[
              styles.list,
              { backgroundColor: colors.surface.default, borderColor: colors.border.default },
            ]}
          >
            {filteredEntries.map(renderEntry)}
          </View>
        )}
      </ScrollView>

      <View style={[styles.dock, { bottom: dockOffset }]} pointerEvents="box-none">
        <View
          style={[
            styles.searchShell,
            { backgroundColor: colors.surface.default },
          ]}
        >
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search reflections"
            accessibilityLabel="Search journal entries"
            style={styles.searchField}
          />
        </View>
        <IconButton
          icon="i-add"
          accessibilityLabel="New journal entry"
          variant="solid"
          size="lg"
          onPress={() => openEntry('free')}
        />
      </View>

      <Modal
        visible={templatesVisible}
        onClose={() => setTemplatesVisible(false)}
        position="bottom"
        scrollable
        title="Start a reflection"
      >
        <View style={styles.templateList}>
          {journalTypes.map((item) => (
            <ListItem
              key={item.id}
              title={item.label}
              subtitle={item.desc}
              chevron
              onPress={() => openEntry(item.id)}
              left={
                <View style={[styles.templateIcon, { backgroundColor: item.color + '1F' }]}>
                  <AppIcon name={item.icon} size={20} color={item.color} />
                </View>
              }
              style={styles.templateRow}
            />
          ))}
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    gap: spacing[6],
  },
  stateBlock: {
    marginTop: spacing[6],
  },
  list: {
    borderRadius: shape.card,
    borderWidth: 1,
    paddingHorizontal: spacing[2],
  },
  entryRow: {
    paddingHorizontal: spacing[2],
  },
  entryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dock: {
    position: 'absolute',
    left: spacing[5],
    right: spacing[5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  searchShell: {
    flex: 1,
    height: DOCK_HEIGHT,
    borderRadius: shape.searchInput,
    justifyContent: 'center',
  },
  searchField: {
    flex: 1,
    justifyContent: 'center',
  },
  templateList: {
    gap: spacing[1],
  },
  templateRow: {
    paddingHorizontal: spacing[2],
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
