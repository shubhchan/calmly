import React, { useState, useRef, useCallback, useMemo } from 'react';
import { RefreshControl, ScrollView, TextInput, View } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
  LinearTransition,
} from 'react-native-reanimated';
import { AppText, Modal, TactilePressable } from '../../components';
import { useAppTheme } from '../../theme/ThemeContext';
import { useAppReducedMotion } from '../../theme/motion';
import { journalRepository } from '../../database/repositories/journalRepository';
import { format } from 'date-fns';
import { hapticFeedback } from '../../utils/haptics';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ListSkeleton } from '../../components/interactive/LoadingState';

interface JournalTemplate {
  id: string;
  label: string;
  desc: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
}

const journalTypes: JournalTemplate[] = [
  { id: 'free', label: 'Free writing', desc: 'Unstructured flow of thought', icon: 'create-outline' },
  { id: 'daily_reflection', label: 'Daily review', desc: 'Look back on the day', icon: 'sunny-outline' },
  { id: 'gratitude', label: 'Gratitude', desc: 'Name what you noticed', icon: 'heart-outline' },
  { id: 'stress', label: 'Stress release', desc: 'Put the weight down', icon: 'leaf-outline' },
  { id: 'sleep', label: 'Sleep and dreams', desc: 'Close the night', icon: 'moon-outline' },
  { id: 'morning', label: 'Morning pages', desc: 'Clear the early mind', icon: 'cafe-outline' },
  { id: 'brain_dump', label: 'Brain dump', desc: 'Empty it all onto the page', icon: 'sparkles-outline' },
];

const TAB_BAR_BASE_HEIGHT = 60;

/**
 * Journal — direction B.
 *
 * An index, not a dashboard: one large title, one quiet prompt, and a
 * plain list of pages that reads like a book's table of contents.
 */
export function JournalScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useAppReducedMotion();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [templatesVisible, setTemplatesVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const hasLoadedRef = useRef(false);

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'gratitude' | 'reflection' | 'free'>('all');

  const contentBottom = TAB_BAR_BASE_HEIGHT + Math.max(insets.bottom, 10) + 48;

  const filteredEntries = useMemo(() => {
    let list = entries;
    if (selectedCategory !== 'all') {
      if (selectedCategory === 'gratitude') {
        list = list.filter((e) => e.type === 'gratitude');
      } else if (selectedCategory === 'reflection') {
        list = list.filter((e) => e.type === 'daily_reflection' || e.type === 'morning');
      } else if (selectedCategory === 'free') {
        list = list.filter((e) => e.type === 'free' || e.type === 'brain_dump' || e.type === 'stress');
      }
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return list;
    return list.filter((entry) => {
      const title = (entry.title ?? '').toLowerCase();
      const body = (entry.body ?? '').toLowerCase();
      const typeLabel = (journalTypes.find((t) => t.id === entry.type)?.label ?? '').toLowerCase();
      return title.includes(q) || body.includes(q) || typeLabel.includes(q);
    });
  }, [entries, searchQuery, selectedCategory]);

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

  const showEmptyState = !loading && entries.length === 0;
  const showNoResults = !loading && entries.length > 0 && filteredEntries.length === 0;

  /** In-place reveal animations for conditional blocks. Shared so the whole
   *  screen uses one motion vocabulary: fade + short rise in, quick fade out.
   *  With reduce-motion on they collapse to undefined (instant swap). */
  const fadeEnter = useMemo(
    () =>
      reducedMotion
        ? undefined
        : FadeInDown.springify().mass(0.45).damping(18).stiffness(210),
    [reducedMotion]
  );
  const fadeExit = useMemo(
    () => (reducedMotion ? undefined : FadeOut.duration(150)),
    [reducedMotion]
  );
  /** Rows reflow (height/position) smoothly when filtering, exit on removal. */
  const rowLayout = reducedMotion ? undefined : LinearTransition;

  return (
    <ScreenContainer scroll={false} bottomPadding={0} style={{ flex: 1 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: contentBottom }}
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
        {/* Header — Still Water v2 */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10 }}>
          <View style={{ flex: 1 }}>
            <AppText variant="overline" tone="tertiary">
              Journal
            </AppText>
            <AppText variant="display" style={{ fontSize: 32, lineHeight: 44, paddingBottom: 4, marginTop: 4 }}>
              Your pages
            </AppText>
          </View>
          <TactilePressable
            onPress={() => setTemplatesVisible(true)}
            scaleDownTo={0.92}
            accessibilityRole="button"
            accessibilityLabel="Start a new journal entry"
            style={{
              width: 44,
              height: 44,
              borderRadius: 15,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.primary.default,
            }}
          >
            <Ionicons name="add" size={24} color={colors.primary.foreground} />
          </TactilePressable>
        </View>

        {/* Category filter chips */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 18 }}>
          {[
            { id: 'all', label: 'All' },
            { id: 'gratitude', label: 'Gratitude' },
            { id: 'reflection', label: 'Reflection' },
            { id: 'free', label: 'Free' },
          ].map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TactilePressable
                key={cat.id}
                onPress={() => setSelectedCategory(cat.id as any)}
                scaleDownTo={0.96}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                style={{
                  height: 34,
                  paddingHorizontal: 15,
                  borderRadius: 999,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isSelected ? colors.primary.default : colors.surface.muted,
                }}
              >
                <AppText
                  variant="label"
                  color={isSelected ? colors.primary.foreground : colors.text.secondary}
                  style={{ fontWeight: isSelected ? '600' : '500' }}
                >
                  {cat.label}
                </AppText>
              </TactilePressable>
            );
          })}
        </View>

        {/* Search */}
        <View
          style={{
            marginTop: 18,
            height: 44,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 14,
            borderRadius: 12,
            backgroundColor: colors.surface.muted,
          }}
        >
          <Ionicons name="search-outline" size={17} color={colors.text.tertiary} />
          <TextInput
            style={{ flex: 1, fontSize: 15, color: colors.text.primary, padding: 0 }}
            placeholder="Search your pages"
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessibilityLabel="Search journal entries"
            returnKeyType="search"
          />
        {/* Clear search: fades in only while text exists */}
        {searchQuery ? (
          <Animated.View
            entering={FadeIn.duration(140)}
            exiting={FadeOut.duration(100)}
          >
            <TactilePressable
              onPress={() => setSearchQuery('')}
              scaleDownTo={0.88}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              style={{ padding: 4 }}
            >
              <Ionicons name="close-circle" size={17} color={colors.text.tertiary} />
            </TactilePressable>
          </Animated.View>
        ) : null}
      </View>

      {/* Entries list */}
      <View style={{ marginTop: 20 }}>
        {loading && entries.length === 0 ? (
          <Animated.View key="skeleton" entering={fadeEnter} exiting={fadeExit}>
            <ListSkeleton rows={4} showHeader={false} />
          </Animated.View>
        ) : showEmptyState ? (
          <Animated.View
            key="empty"
            entering={fadeEnter}
            exiting={fadeExit}
            style={{ alignItems: 'center', paddingVertical: 28, paddingHorizontal: 16 }}
          >
              {/* "A page waiting" illustration from Doop */}
              <View style={{ width: 180, height: 160, alignItems: 'center', justifyContent: 'center' }}>
                <Svg viewBox="0 0 360 320" width={180} height={160}>
                  <Path d="M66 104h102v138c-28-9-70-9-102 0z" fill={colors.surface.default} />
                  <Path d="M294 104H192v138c28-9 70-9 102 0z" fill={colors.surface.default} />
                  <Path d="M180 104v138" stroke={colors.border.subtle} strokeWidth="2" />
                  <Path d="M104 128h38M104 146h50M104 164h30" stroke={isDark ? colors.border.strong : '#C9DCD3'} strokeWidth="4" strokeLinecap="round" />
                  <Path d="M232 240c-3-26 4-46 4-46" stroke={colors.primary.default} strokeWidth="3" fill="none" strokeLinecap="round" />
                  <Path d="M237 196c12-11 27-9 27-9-2 15-13 23-27 23z" fill={colors.primary.default} />
                  <Path d="M235 214c-10-9-21-7-21-7 2 11 9 17 21 17z" fill={colors.primary.default} opacity={0.55} />
                  <Circle cx="238" cy="184" r="6" fill="#B08A4F" opacity={0.85} />
                  <Path d="M66 242h228" stroke={colors.border.subtle} strokeWidth="2" />
                </Svg>
              </View>
              <AppText variant="h3" center style={{ marginTop: 12 }}>
                A page waiting
              </AppText>
              <AppText variant="bodySmall" tone="tertiary" center style={{ marginTop: 6, maxWidth: 260 }}>
                A few honest lines are enough. No one else reads this.
              </AppText>
              <TactilePressable
                onPress={() => setTemplatesVisible(true)}
                scaleDownTo={0.97}
                style={{
                  marginTop: 18,
                  height: 44,
                  paddingHorizontal: 22,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.surface.selected,
                }}
              >
                <AppText variant="button" style={{ color: colors.primary.default }}>Write something</AppText>
              </TactilePressable>
          </Animated.View>
        ) : showNoResults ? (
          <Animated.View
            key="no-results"
            entering={fadeEnter}
            exiting={fadeExit}
            style={{ alignItems: 'center', paddingVertical: 32 }}
          >
              <AppText variant="title" center>
                Nothing matches that
              </AppText>
              <AppText variant="bodySmall" tone="tertiary" center style={{ marginTop: 4 }}>
                Try a different word.
              </AppText>
          </Animated.View>
          ) : (
            (filteredEntries ?? []).map((entry, index) => {
              const typeConfig = journalTypes.find((t) => t.id === entry.type) ?? journalTypes[0];
              const snippet = (entry.body ?? '').replace(/\s+/g, ' ').trim();
              const title = (entry.title ?? '').trim() || typeConfig.label;
              const dateObj = entry.createdAt ? new Date(entry.createdAt) : new Date();
              const dayNumber = format(dateObj, 'd');
              const dateLabel = format(dateObj, 'd MMM');
              const isGratitude = entry.type === 'gratitude';
              const isLast = index === (filteredEntries ?? []).length - 1;

              return (
                <Animated.View
                  key={entry.id ?? `entry-${index}`}
                  exiting={reducedMotion ? undefined : FadeOutDown.duration(160)}
                  layout={rowLayout}
                >
                <TactilePressable
                  onPress={() =>
                    navigation.navigate('JournalEntry', {
                      id: entry.id,
                      type: (entry.type ?? 'free') as any,
                      preview: { title: entry.title, body: entry.body, favorite: !!entry.favorite },
                    })
                  }
                  scaleDownTo={0.99}
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${title}`}
                  style={{
                    backgroundColor: 'transparent',
                    paddingVertical: 15,
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: colors.border.default,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
                    {/* Day number badge — Doop OsupK6rtOr */}
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 12,
                        backgroundColor: colors.surface.default,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 2,
                      }}
                    >
                      <AppText
                        variant="title"
                        style={{
                          fontSize: 15,
                          fontWeight: '600',
                          color: colors.primary.default,
                        }}
                      >
                        {dayNumber}
                      </AppText>
                    </View>

                    {/* Content */}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                        <AppText
                          variant="overline"
                          color={isGratitude ? (isDark ? '#D2B078' : '#B08A4F') : colors.text.tertiary}
                          style={{ letterSpacing: 1.1, fontSize: 10.5 }}
                        >
                          {typeConfig.label}
                        </AppText>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <AppText variant="caption" tone="tertiary">
                            {dateLabel}
                          </AppText>
                          <TactilePressable
                            onPress={() => handleToggleFavorite(entry)}
                            scaleDownTo={0.86}
                            accessibilityRole="button"
                            accessibilityLabel={entry.favorite ? 'Remove from favorites' : 'Add to favorites'}
                            style={{ padding: 2 }}
                          >
                            <Ionicons
                              name={entry.favorite ? 'heart' : 'heart-outline'}
                              size={15}
                              color={entry.favorite ? colors.primary.default : colors.text.tertiary}
                            />
                          </TactilePressable>
                        </View>
                      </View>

                      <AppText variant="h3" style={{ fontSize: 16.5, marginTop: 2 }} numberOfLines={1}>
                        {title}
                      </AppText>

                      {snippet ? (
                        <AppText
                          variant="bodySmall"
                          tone="secondary"
                          numberOfLines={2}
                          style={{ marginTop: 4, lineHeight: 19 }}
                        >
                          {snippet}
                        </AppText>
                      ) : null}
                    </View>
                  </View>
                </TactilePressable>
                </Animated.View>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal
        visible={templatesVisible}
        onClose={() => setTemplatesVisible(false)}
        position="bottom"
        scrollable
        title="Start a page"
      >
        <View style={{ gap: 4 }}>
          {journalTypes.map((item) => (
            <TactilePressable
              key={item.id}
              onPress={() => openEntry(item.id)}
              scaleDownTo={0.99}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
                paddingVertical: 13,
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.surface.selected,
                }}
              >
                <Ionicons name={item.icon} size={18} color={colors.primary.default} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="title">{item.label}</AppText>
                <AppText variant="caption" tone="tertiary" style={{ marginTop: 1 }}>
                  {item.desc}
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
            </TactilePressable>
          ))}
        </View>
      </Modal>
    </ScreenContainer>
  );
}
