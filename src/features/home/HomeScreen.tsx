import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, Platform, Text, TextInput, View } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { AppText, TactilePressable } from '../../components';
import { habitRepository } from '../../database/repositories/habitRepository';
import { journalRepository } from '../../database/repositories/journalRepository';
import { moodRepository } from '../../database/repositories/moodRepository';
import { settingsRepository, type AppSettings } from '../../database/repositories/settingsRepository';
import { getDailyPrompt } from '../../utils/dailyPrompt';
import Habit from '../../database/models/Habit';
import { useAppTheme } from '../../theme/ThemeContext';
import { withAlpha } from '../../theme/tokens/colors';
import { bootLog } from '../../components/ErrorBoundary';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { mascotById, ZenMascotAvatar } from '../../components/profile/ZenMascotAvatar';
import { displayFaces } from '../../theme/typography';
import { useResponsive } from '../../theme/responsive';
import {
  JournalReflectionIllustration,
  HabitPlantingIllustration,
  MoodAuraIllustration,
  MoodLandscapeIllustration,
} from '../../components/illustrations';
import {
  searchDestinationsFor,
  searchNotesFor,
  type SearchDestination,
  type SearchNote,
} from '../search/searchIndex';

/** A check-in can hold several feelings, stored comma-separated. */
function formatMoodNames(value: unknown): string {
  const names = String(value ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
  return names.length ? names.join(' and ') : 'present';
}

function isDueToday(habit: Habit): boolean {
  if (!habit) return false;
  const dayOfWeek = new Date().getDay();
  const frequency = (habit as any)?.frequency ?? 'daily';
  let customDays: string[] = [];
  try {
    const raw = (habit as any)?.customDays;
    customDays = JSON.parse(typeof raw === 'string' && raw ? raw : '[]') ?? [];
    if (!Array.isArray(customDays)) customDays = [];
  } catch {
    customDays = [];
  }

  if (frequency === 'daily') return true;
  if (frequency === 'weekdays') return dayOfWeek >= 1 && dayOfWeek <= 5;
  if (frequency === 'custom') return customDays.includes(dayOfWeek.toString());
  return true;
}

/**
 * Today — one greeting, one search, one practice, four doors.
 *
 * Search is the second way through the app: it finds both destinations and
 * the pages the user wrote, so the hub never needs a long directory.
 */
export function HomeScreen() {
  const navigation = useNavigation<any>();
  const { colors, isDark } = useAppTheme();
  const { isWide, pagePadding } = useResponsive();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [todayCompletions, setTodayCompletions] = useState<Record<string, boolean>>({});
  const [journals, setJournals] = useState<any[]>([]);
  const [latestMood, setLatestMood] = useState<any>(null);
  const [profileSettings, setProfileSettings] = useState<AppSettings | null>(null);
  const [query, setQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<TextInput>(null);

  const renderLoggedRef = useRef(false);
  if (!renderLoggedRef.current) {
    renderLoggedRef.current = true;
    bootLog('home-render');
  }
  const loadHomeData = useCallback(async () => {
    try {
      const [allHabits, completions, allJournals, mood, settings] = await Promise.all([
        habitRepository.getAll(false),
        habitRepository.getTodayCompletions(),
        journalRepository.getAll(),
        moodRepository.getLatest(),
        settingsRepository.getSettings().catch(() => null),
      ]);
      setHabits(allHabits ?? []);
      setTodayCompletions(completions ?? {});
      setJournals(allJournals ?? []);
      setLatestMood(mood ?? null);
      setProfileSettings(settings ?? null);
    } catch (error) {
      console.error('Failed to load home data:', error);
      setHabits([]);
      setTodayCompletions({});
      setJournals([]);
      setLatestMood(null);
    }
  }, []);

  useEffect(() => {
    bootLog('home-mounted');
  }, []);

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(loadHomeData, 0);
      return () => clearTimeout(timer);
    }, [loadHomeData])
  );

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const handler = (event: any) => {
      const target = event?.target as any;
      const tag = String(target?.tagName ?? '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || target?.isContentEditable;
      const isShortcut =
        (event?.key === '/' && !typing && !event?.metaKey && !event?.ctrlKey && !event?.altKey) ||
        ((event?.metaKey || event?.ctrlKey) && String(event?.key).toLowerCase() === 'k');
      if (!isShortcut) return;
      event.preventDefault?.();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const dueHabits = (habits ?? []).filter((habit) => {
    try {
      return !!habit && isDueToday(habit);
    } catch {
      return false;
    }
  });
  const doneCount = dueHabits.filter((habit) => todayCompletions?.[(habit as any)?.id]).length;

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const thoughtOfTheDay = getDailyPrompt();

  const dateLabel = format(new Date(), 'EEEE, MMMM d');
  const recentPage = journals?.[0];
  const searchMode = query.trim().length > 0;

  const options = useMemo(() => searchDestinationsFor(query), [query]);
  const notes = useMemo(() => searchNotesFor(journals, query), [journals, query]);
  const hasResults = options.length > 0 || notes.length > 0;

  const openDestination = useCallback(
    (destination: SearchDestination) => {
      setQuery('');
      searchRef.current?.blur();
      navigation?.navigate?.(destination.route, destination.params);
    },
    [navigation]
  );

  const openNote = useCallback(
    (note: SearchNote) => {
      setQuery('');
      searchRef.current?.blur();
      navigation?.navigate?.('JournalEntry', {
        id: note.id,
        type: note.type,
        preview: { title: note.title, body: note.body, favorite: note.favorite },
      });
    },
    [navigation]
  );

  const homePhotoUri =
    profileSettings?.userAvatar?.kind === 'custom'
      ? profileSettings.userAvatar.uri
      : profileSettings?.userAvatar?.kind === 'google'
      ? profileSettings?.googlePhotoUrl
      : undefined;
  const homeActiveMascotId =
    profileSettings?.userAvatar?.kind === 'mascot' ? profileSettings.userAvatar.mascotId : undefined;
  const homeActiveMascot = homeActiveMascotId ? mascotById(homeActiveMascotId) : undefined;
  const homeInitial = (profileSettings?.userName?.trim() || 'S').charAt(0).toUpperCase();

  const doorArtWidth = isWide ? 104 : 66;
  const doorArtHeight = isWide ? 94 : 60;

  const doors: {
    key: string;
    title: string;
    note: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    illustration: React.ReactNode;
    onPress: () => void;
  }[] = [
    {
      key: 'check-in',
      title: 'Check in',
      note: latestMood ? `Last felt ${formatMoodNames(latestMood.mood)}` : 'How you feel, in one tap',
      icon: 'partly-sunny-outline',
      illustration: <MoodAuraIllustration width={doorArtWidth} height={doorArtHeight} />,
      onPress: () => navigation?.navigate?.('MoodCheckIn', { fromHome: true }),
    },
    {
      key: 'write',
      title: 'Write',
      note: 'A page for today',
      icon: 'create-outline',
      illustration: <JournalReflectionIllustration width={doorArtWidth} height={doorArtHeight} />,
      onPress: () => navigation?.navigate?.('JournalEntry', { type: 'daily_reflection' }),
    },
    {
      key: 'habits',
      title: 'Habits',
      note: dueHabits.length ? `${doneCount} of ${dueHabits.length} kept today` : 'Start with one small thing',
      icon: 'checkmark-circle-outline',
      illustration: <HabitPlantingIllustration width={doorArtWidth} height={doorArtHeight} />,
      onPress: () => navigation?.navigate?.('Habits'),
    },
    {
      key: 'reflect',
      title: 'Reflect',
      note: 'Your week, gently',
      icon: 'analytics-outline',
      illustration: <MoodLandscapeIllustration width={doorArtWidth} height={doorArtHeight} />,
      onPress: () => navigation?.navigate?.('Insights'),
    },
  ];

  return (
    <ScreenContainer
      contentContainerStyle={{
        paddingHorizontal: pagePadding,
        paddingTop: isWide ? 40 : 20,
        paddingBottom: 120,
      }}
      backgroundColor={colors.background.default}
    >
      <View style={{ flexDirection: isWide ? 'row' : 'column', gap: isWide ? 40 : 0 }}>
        <View style={{ flex: isWide ? 1.55 : undefined }}>
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <View style={{ flex: 1 }}>
              <AppText variant="overline" tone="tertiary">
                {dateLabel}
              </AppText>
              <AppText variant="h1" style={{ marginTop: 8, fontSize: isWide ? 48 : 40, lineHeight: isWide ? 58 : 50 }}>
                {greeting}
                {profileSettings?.userName ? `,\n${profileSettings.userName}` : '.'}
              </AppText>
            </View>
            <TactilePressable
              onPress={() => navigation?.navigate?.('Profile')}
              scaleDownTo={0.94}
              accessibilityRole="button"
              accessibilityLabel="Open your profile"
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: homeActiveMascot ? homeActiveMascot.background : isDark ? colors.primary.subtle : colors.primary.default,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {homePhotoUri ? (
                <Image
                  source={{ uri: homePhotoUri }}
                  style={{ width: '100%', height: '100%', borderRadius: 14 }}
                  accessibilityRole="image"
                  accessibilityLabel="Profile photo"
                />
              ) : homeActiveMascotId ? (
                <ZenMascotAvatar id={homeActiveMascotId} size={44} shape="square" borderRadius={14} />
              ) : (
                <Text style={{ fontFamily: displayFaces.regular, fontSize: 18, color: isDark ? colors.primary.default : colors.primary.foreground }}>
                  {homeInitial}
                </Text>
              )}
            </TactilePressable>
          </View>

          {/* Search stays mounted so typing never moves the cursor. */}
          <View
            style={{
              marginTop: 22,
              height: isWide ? 54 : 50,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingHorizontal: 16,
              borderRadius: 16,
              backgroundColor: searchFocused ? colors.surface.default : colors.surface.muted,
              borderWidth: searchFocused ? 1 : 0,
              borderColor: searchFocused ? colors.primary.default : 'transparent',
              maxWidth: isWide ? 620 : undefined,
            }}
          >
            <Ionicons name="search-outline" size={18} color={colors.text.tertiary} />
            <TextInput
              ref={searchRef}
              style={{ flex: 1, fontSize: 14.5, color: colors.text.primary, paddingVertical: 0 }}
              value={query}
              onChangeText={setQuery}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search options and notes"
              placeholderTextColor={colors.text.tertiary}
              accessibilityLabel="Search options and notes"
              returnKeyType="search"
            />
            {query ? (
              <TactilePressable
                onPress={() => setQuery('')}
                scaleDownTo={0.86}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                style={{ padding: 4 }}
              >
                <Ionicons name="close-circle" size={17} color={colors.text.tertiary} />
              </TactilePressable>
            ) : (
              <View
                style={{
                  borderWidth: 1,
                  borderColor: colors.border.subtle,
                  borderRadius: 6,
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                }}
              >
                <AppText variant="caption" tone="tertiary" style={{ fontSize: 10.5 }}>
                  /
                </AppText>
              </View>
            )}
          </View>

          {searchMode ? (
            <View style={{ marginTop: 26, maxWidth: isWide ? 760 : undefined }}>
              {options.length > 0 ? (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                    <AppText variant="overline" tone="tertiary">
                      Options
                    </AppText>
                    <AppText variant="caption" tone="tertiary">
                      {`${options.length} found`}
                    </AppText>
                  </View>
                  {options.map((destination) => (
                    <SearchOptionRow
                      key={destination.id}
                      destination={destination}
                      onPress={() => openDestination(destination)}
                    />
                  ))}
                </>
              ) : null}

              {notes.length > 0 ? (
                <View style={{ marginTop: options.length > 0 ? 26 : 0 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                    <AppText variant="overline" tone="tertiary">
                      Notes
                    </AppText>
                    <AppText variant="caption" tone="tertiary">
                      {`${notes.length} found`}
                    </AppText>
                  </View>
                  {notes.map((note) => (
                    <SearchNoteRow key={note.id} note={note} onPress={() => openNote(note)} />
                  ))}
                </View>
              ) : null}

              {!hasResults ? (
                <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                  <MoodAuraIllustration width={120} height={108} />
                  <AppText variant="title" center style={{ marginTop: 10 }}>
                    Nothing matches that
                  </AppText>
                  <AppText variant="bodySmall" tone="tertiary" center style={{ marginTop: 4 }}>
                    Try a different word.
                  </AppText>
                </View>
              ) : null}
            </View>
          ) : (
            <>
              {/* One thing */}
              <View
                style={{
                  marginTop: 24,
                  borderRadius: 26,
                  backgroundColor: isDark ? colors.primary.subtle : colors.primary.default,
                  borderWidth: isDark ? 1 : 0,
                  borderColor: isDark ? colors.primary.subtleBorder : 'transparent',
                  padding: isWide ? 28 : 22,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    position: 'absolute',
                    right: -30,
                    top: -40,
                    width: 170,
                    height: 170,
                    borderRadius: 85,
                    borderWidth: 1,
                    borderColor: isDark ? colors.primary.subtleBorder : withAlpha(colors.primary.foreground, 0.25),
                  }}
                  pointerEvents="none"
                />
                <View
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: 26,
                    width: 86,
                    height: 86,
                    borderRadius: 43,
                    backgroundColor: isDark ? withAlpha(colors.primary.default, 0.08) : withAlpha(colors.primary.foreground, 0.12),
                  }}
                  pointerEvents="none"
                />

                <AppText
                  variant="overline"
                  color={isDark ? colors.primary.default : withAlpha(colors.primary.foreground, 0.72)}
                >
                  One thing · 3 minutes
                </AppText>
                <AppText
                  variant="display"
                  color={isDark ? colors.text.primary : colors.primary.foreground}
                  style={{ fontSize: isWide ? 36 : 28, lineHeight: isWide ? 44 : 30, marginTop: 10, marginBottom: 8, maxWidth: 320 }}
                >
                  {thoughtOfTheDay}
                </AppText>
                <AppText
                  variant="bodySmall"
                  color={isDark ? colors.text.secondary : withAlpha(colors.primary.foreground, 0.85)}
                  style={{ lineHeight: 20, maxWidth: 250 }}
                >
                  Box breathing. Nothing else to do.
                </AppText>

                <TactilePressable
                  onPress={() => navigation?.navigate?.('BreathingSession', { preset: 'box', duration: 180 })}
                  scaleDownTo={0.96}
                  accessibilityRole="button"
                  accessibilityLabel="Begin a three minute breath session"
                  style={{
                    alignSelf: 'flex-start',
                    height: 46,
                    marginTop: 20,
                    paddingHorizontal: 24,
                    borderRadius: 15,
                    backgroundColor: isDark ? colors.primary.default : colors.primary.foreground,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AppText variant="label" color={isDark ? colors.primary.foreground : colors.primary.default} style={{ fontWeight: '600' }}>
                    Begin
                  </AppText>
                </TactilePressable>
              </View>

              {/* Four doors */}
              <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: 28, marginBottom: 12 }}>
                <AppText variant="h3">Four doors</AppText>
                <AppText variant="caption" tone="tertiary">
                  Choose one
                </AppText>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                {doors.map((door) => (
                  <TactilePressable
                    key={door.key}
                    onPress={door.onPress}
                    scaleDownTo={0.99}
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${door.title}`}
                    style={{
                      width: '48%',
                      flexGrow: 1,
                      minHeight: isWide ? 168 : 142,
                      padding: isWide ? 18 : 14,
                      borderRadius: 20,
                      backgroundColor: colors.surface.default,
                      justifyContent: 'space-between',
                      overflow: 'hidden',
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 11,
                          backgroundColor: colors.surface.selected,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name={door.icon} size={17} color={colors.primary.default} />
                      </View>
                      {/* The art keeps its own corner so it never sits on the text. */}
                      <View style={{ marginTop: -6, marginRight: -6 }} pointerEvents="none">
                        {door.illustration}
                      </View>
                    </View>
                    <View style={{ marginTop: 14 }}>
                      <AppText variant="title" style={{ fontWeight: '600' }}>
                        {door.title}
                      </AppText>
                      <AppText
                        variant="caption"
                        tone="tertiary"
                        style={{ marginTop: 2, lineHeight: 16 }}
                        numberOfLines={2}
                      >
                        {door.note}
                      </AppText>
                    </View>
                  </TactilePressable>
                ))}
              </View>

              {!isWide ? (
                <View style={{ alignItems: 'center', marginTop: 34, paddingHorizontal: 20 }}>
                  <View style={{ width: 26, height: 1, backgroundColor: colors.border.strong, marginBottom: 14 }} />
                  <AppText variant="bodySmall" tone="secondary" center style={{ fontStyle: 'italic', maxWidth: 280, lineHeight: 20 }}>
                    You do not have to finish the day before it starts.
                  </AppText>
                </View>
              ) : null}
            </>
          )}
        </View>

        {isWide && !searchMode ? (
          <View style={{ width: 330, gap: 18 }}>
            <View style={{ padding: 22, borderRadius: 20, backgroundColor: colors.surface.default }}>
              <AppText variant="overline" tone="tertiary">
                Lately
              </AppText>
              {recentPage ? (
                <>
                  <AppText variant="h3" style={{ marginTop: 10 }} numberOfLines={1}>
                    {String(recentPage.title ?? '').trim() || 'A page for today'}
                  </AppText>
                  <AppText variant="bodySmall" tone="secondary" numberOfLines={3} style={{ marginTop: 6, lineHeight: 20 }}>
                    {String(recentPage.body ?? '').replace(/\s+/g, ' ').trim() || 'One honest line is enough.'}
                  </AppText>
                  <AppText variant="caption" tone="tertiary" style={{ marginTop: 14 }}>
                    {recentPage.createdAt ? format(new Date(recentPage.createdAt), 'd MMMM') : 'Today'}
                  </AppText>
                </>
              ) : (
                <>
                  <AppText variant="h3" style={{ marginTop: 10 }}>
                    No pages yet
                  </AppText>
                  <AppText variant="bodySmall" tone="secondary" style={{ marginTop: 6, lineHeight: 20 }}>
                    One short line is enough to begin.
                  </AppText>
                </>
              )}
            </View>

            <View style={{ paddingHorizontal: 8, paddingTop: 12 }}>
              <View style={{ width: 26, height: 1, backgroundColor: colors.border.strong, marginBottom: 14 }} />
              <AppText variant="bodyLarge" tone="secondary" style={{ fontStyle: 'italic', lineHeight: 28 }}>
                You do not have to finish the day before it starts.
              </AppText>
            </View>
          </View>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

function SearchOptionRow({
  destination,
  onPress,
}: {
  destination: SearchDestination;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <TactilePressable
      onPress={onPress}
      scaleDownTo={0.99}
      accessibilityRole="button"
      accessibilityLabel={`Open ${destination.title}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 11,
          backgroundColor: colors.surface.selected,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={destination.icon} size={17} color={colors.primary.default} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="title" style={{ fontWeight: '600' }}>
          {destination.title}
        </AppText>
        <AppText variant="caption" tone="tertiary" style={{ marginTop: 1 }}>
          {destination.note}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={15} color={colors.text.tertiary} />
    </TactilePressable>
  );
}

function SearchNoteRow({ note, onPress }: { note: SearchNote; onPress: () => void }) {
  const { colors } = useAppTheme();
  const date = new Date(note.createdAt);
  return (
    <TactilePressable
      onPress={onPress}
      scaleDownTo={0.99}
      accessibilityRole="button"
      accessibilityLabel={`Open ${note.title}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 13,
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
      }}
    >
      <View style={{ width: 34, alignItems: 'center' }}>
        <Text style={{ fontFamily: displayFaces.regular, fontSize: 17, color: colors.primary.default }}>
          {format(date, 'd')}
        </Text>
        <AppText variant="caption" tone="tertiary" style={{ fontSize: 9.5 }}>
          {format(date, 'MMM').toUpperCase()}
        </AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="title" style={{ fontWeight: '600' }} numberOfLines={1}>
          {note.title}
        </AppText>
        <AppText variant="caption" tone="tertiary" numberOfLines={2} style={{ marginTop: 2, lineHeight: 17 }}>
          {note.body.replace(/\s+/g, ' ').trim() || 'No words yet.'}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={15} color={colors.text.tertiary} />
    </TactilePressable>
  );
}
