import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeColors } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { Card } from '../../components/Card';
import { PopIn } from '../../components/interactive/PopIn';
import { BrandedLoader } from '../../components/interactive/LoadingState';
import { FontCategory, useFontStore } from '../../theme/fontStore';
import { BUNDLED_FONTS, FONT_CATEGORY_LABELS } from '../../theme/fontRegistry';
import {
  GoogleFontSummary,
  applyBundledFont,
  applyGoogleFont,
  ensureGoogleFontFaces,
  getFontCatalog,
  isFontDownloaded,
} from '../../services/googleFonts';
import { hapticFeedback } from '../../utils/haptics';
import { resolveTint } from '../../theme/tints';
import { motion } from '../../theme/motion';

type CategoryFilter = 'all' | FontCategory;

const CATEGORY_FILTERS: CategoryFilter[] = ['all', 'sans', 'serif', 'handwritten', 'display'];

const PREVIEW_SENTENCE = 'The quiet mind writes clearly.';

export function FontBrowserScreen() {
  const navigation = useNavigation<any>();
  const colors = useThemeColors();
  const activeFont = useFontStore((s) => s.active);

  const [catalog, setCatalog] = useState<GoogleFontSummary[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [applyingFamily, setApplyingFamily] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getFontCatalog()
      .then((fonts) => {
        if (!alive) return;
        setCatalog(fonts);
        setCatalogError(fonts.length <= 20);
      })
      .catch(() => {
        if (alive) setCatalogError(true);
      })
      .finally(() => {
        if (alive) setCatalogLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const filteredGoogleFonts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return catalog.filter((font) => {
      if (category !== 'all' && font.category !== category) return false;
      if (query && !font.family.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [catalog, search, category]);

  const applyBundled = useCallback(
    (key: string) => {
      if (applyBundledFont(key)) {
        hapticFeedback.success();
      }
    },
    [],
  );

  const applyGoogle = useCallback(
    async (font: GoogleFontSummary) => {
      if (applyingFamily) return;
      hapticFeedback.selection();
      setApplyingFamily(font.family);
      try {
        await applyGoogleFont(font.family, font.category);
        hapticFeedback.success();
      } catch (error) {
        console.warn(`Failed to apply Google font "${font.family}":`, error);
        Alert.alert(
          'Couldn’t download font',
          `${font.family} needs a one-time download. Check your connection and try again.`,
        );
      } finally {
        setApplyingFamily(null);
      }
    },
    [applyingFamily],
  );

  const isDark = !!colors.isDark;
  const previewTint = resolveTint(isDark, 'lilac');

  const listHeader = (
    <View style={styles.headerWrap}>
      <PopIn index={0}>
        <Card tone="lilac" variant="elevated" style={styles.previewCard}>
          <View style={styles.previewRow}>
            <Text style={[styles.previewGlyph, { color: previewTint.accent }]}>Aa</Text>
            <View style={styles.previewTextWrap}>
              <Text style={[styles.previewSentence, { color: previewTint.text }]} numberOfLines={2}>
                {PREVIEW_SENTENCE}
              </Text>
              <Text style={[styles.previewActive, { color: previewTint.muted }]} numberOfLines={1}>
                {activeFont.label}
              </Text>
            </View>
          </View>
        </Card>
      </PopIn>

      <PopIn index={1}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Included with Calmly</Text>
      </PopIn>

      {BUNDLED_FONTS.map((font, index) => (
        <PopIn key={font.key} index={2 + index}>
          <FontCard
            title={font.label}
            meta={`${FONT_CATEGORY_LABELS[font.category]} · Included offline`}
            previewFamily={font.faces.regular}
            active={activeFont.key === font.key}
            downloaded
            busy={false}
            colors={colors}
            onPress={() => applyBundled(font.key)}
            accessibilityLabel={`Use ${font.label}`}
          />
        </PopIn>
      ))}

      <PopIn index={6}>
        <Text style={[styles.sectionLabel, { color: colors.textSecondary, marginTop: 10 }]}>
          Google Fonts
        </Text>
      </PopIn>

      <PopIn index={7}>
        <View style={[styles.searchBar, { backgroundColor: colors.bgSecondary, borderColor: colors.borderLight }]}>
          <Ionicons name="search" size={17} color={colors.textTertiary} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={catalogLoading ? 'Loading the library…' : 'Search 1,500+ Google fonts'}
            placeholderTextColor={colors.textTertiary}
            style={[styles.searchInput, { color: colors.textPrimary }]}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            editable={!catalogLoading}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={17} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>
      </PopIn>

      <PopIn index={8}>
        <View style={styles.chipRow}>
          {CATEGORY_FILTERS.map((value) => {
            const selected = category === value;
            const label = value === 'all' ? 'All' : FONT_CATEGORY_LABELS[value];
            return (
              <Pressable
                key={value}
                onPress={() => {
                  hapticFeedback.selection();
                  setCategory(value);
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? colors.accentPrimary + '18' : colors.bgSecondary,
                    borderColor: selected ? colors.accentPrimary : colors.borderLight,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    { color: selected ? colors.accentPrimary : colors.textSecondary },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </PopIn>

      {catalogError && !catalogLoading && (
        <View style={[styles.errorBanner, { backgroundColor: colors.bgSecondary, borderColor: colors.borderLight }]}>
          <Ionicons name="cloud-offline-outline" size={16} color={colors.textTertiary} />
          <Text style={[styles.errorText, { color: colors.textTertiary }]}>
            Couldn’t reach Google Fonts. Bundled fonts above still work offline.
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <ScreenContainer scroll={false} style={styles.container}>
      <View style={styles.navBar}>
        <Pressable
          onPress={() => navigation.goBack()}
          hitSlop={10}
          style={[styles.backButton, { backgroundColor: colors.bgSecondary, borderColor: colors.borderLight }]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={19} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.navTitles}>
          <Text style={[styles.navTitle, { color: colors.textPrimary }]}>Typography</Text>
          <Text style={[styles.navSubtitle, { color: colors.textTertiary }]}>
            One font, everywhere — instantly
          </Text>
        </View>
      </View>

      <FlatList
        style={styles.list}
        data={filteredGoogleFonts}
        keyExtractor={(item) => item.family}
        renderItem={({ item }) => (
          <GoogleFontRow
            font={item}
            active={activeFont.key === `google:${item.family}`}
            applying={applyingFamily === item.family}
            colors={colors}
            onPress={() => applyGoogle(item)}
          />
        )}
        ListHeaderComponent={listHeader}
        ListFooterComponent={
          catalogLoading ? (
            <BrandedLoader label="Fetching the font library…" />
          ) : filteredGoogleFonts.length === 0 && !catalogError ? (
            <Text style={[styles.emptyText, { color: colors.textTertiary }]}>
              No fonts match “{search.trim()}”.
            </Text>
          ) : (
            <View style={{ height: 24 }} />
          )
        }
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
      />
    </ScreenContainer>
  );
}

interface FontCardProps {
  title: string;
  meta: string;
  previewFamily?: string | null;
  active: boolean;
  downloaded: boolean;
  busy: boolean;
  colors: any;
  onPress: () => void;
  accessibilityLabel: string;
}

function FontCard({
  title,
  meta,
  previewFamily,
  active,
  downloaded,
  busy,
  colors,
  onPress,
  accessibilityLabel,
}: FontCardProps) {
  const familyStyle = previewFamily
    ? ({ fontFamily: previewFamily, isPreviewFont: true } as any)
    : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fontCard,
        {
          backgroundColor: active ? (colors.accentPrimary || '#3E7B52') + '10' : colors.bgCard,
          borderColor: active ? (colors.accentPrimary || '#3E7B52') : colors.borderLight,
        },
        pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active, busy }}
    >
      {/* Same Row: Title & Subtitle on left, Apply button on right */}
      <View style={styles.cardHeaderRow}>
        <View style={styles.titleSubtitleCol}>
          <Text
            style={[styles.fontCardTitle, { color: colors.textPrimary }, familyStyle]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text style={[styles.fontCardMeta, { color: colors.textTertiary }]} numberOfLines={1}>
            {meta}
          </Text>
        </View>

        <View style={styles.fontCardAction}>
          {busy ? (
            <ActivityIndicator size="small" color={colors.accentPrimary || '#3E7B52'} />
          ) : active ? (
            <View
              style={[
                styles.statePill,
                {
                  backgroundColor: (colors.accentPrimary || '#3E7B52') + '18',
                  borderColor: colors.accentPrimary || '#3E7B52',
                },
              ]}
            >
              <Ionicons name="checkmark-circle" size={15} color={colors.accentPrimary || '#3E7B52'} />
              <Text style={[styles.statePillText, { color: colors.accentPrimary || '#3E7B52' }]}>
                Applied
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.statePill,
                { backgroundColor: colors.bgSecondary, borderColor: colors.borderLight },
              ]}
            >
              <Ionicons
                name={downloaded ? 'checkmark-done-outline' : 'cloud-download-outline'}
                size={15}
                color={colors.textSecondary}
              />
              <Text style={[styles.statePillText, { color: colors.textSecondary }]}>
                {downloaded ? 'Apply' : 'Get'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Font Sample Preview Text */}
      <Text
        style={[styles.fontCardSample, { color: colors.textSecondary }, familyStyle]}
        numberOfLines={2}
      >
        {PREVIEW_SENTENCE}
      </Text>
    </Pressable>
  );
}

interface GoogleFontRowProps {
  font: GoogleFontSummary;
  active: boolean;
  applying: boolean;
  colors: any;
  onPress: () => void;
}

const GoogleFontRow = React.memo(function GoogleFontRow({
  font,
  active,
  applying,
  colors,
  onPress,
}: GoogleFontRowProps) {
  const [previewFamily, setPreviewFamily] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    ensureGoogleFontFaces(font.family, { previewOnly: true })
      .then((faces) => {
        if (alive) setPreviewFamily(faces.regular);
      })
      .catch(() => {
        // Preview stays in the active font; applying will surface a real error.
      });
    return () => {
      alive = false;
    };
  }, [font.family]);

  const downloaded = isFontDownloaded(font.family);
  const meta = downloaded
    ? `${FONT_CATEGORY_LABELS[font.category]} · Offline ready`
    : `${FONT_CATEGORY_LABELS[font.category]} · One-time download`;

  return (
    <FontCard
      title={font.family}
      meta={meta}
      previewFamily={previewFamily}
      active={active}
      downloaded={downloaded}
      busy={applying}
      colors={colors}
      onPress={onPress}
      accessibilityLabel={`Use ${font.family}`}
    />
  );
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTitles: { flex: 1 },
  navTitle: { fontSize: 24, letterSpacing: -0.3 },
  navSubtitle: { fontSize: 12.5, marginTop: 1 },
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 48,
    gap: 10,
  },
  headerWrap: { gap: 10 },
  previewCard: { marginBottom: 6 },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18 },
  previewGlyph: { fontSize: 38, lineHeight: 44 },
  previewTextWrap: { flex: 1, gap: 3 },
  previewSentence: { fontSize: 17, lineHeight: 23 },
  previewActive: { fontSize: 12.5 },
  sectionLabel: {
    fontSize: 12.5,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 6,
    marginBottom: 2,
  },
  fontCard: {
    borderRadius: 20,
    borderWidth: 1.2,
    paddingHorizontal: 18,
    paddingVertical: 15,
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleSubtitleCol: {
    flex: 1,
    gap: 2,
  },
  fontCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  fontCardMeta: {
    fontSize: 12,
    lineHeight: 16,
  },
  fontCardSample: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  fontCardAction: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    borderWidth: 1,
  },
  statePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 13,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    paddingVertical: 0,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipLabel: { fontSize: 12.5 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 10,
    marginTop: 6,
  },
  errorText: { flex: 1, fontSize: 12.5, lineHeight: 17 },
  emptyText: { textAlign: 'center', fontSize: 13, paddingVertical: 22 },
});
