import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Modal } from '../ui/Modal';
import { AppText } from '../ui/AppText';
import { AppIcon } from '../AppIcon';
import { Button } from '../ui/Button';
import { useAppTheme } from '../../theme/ThemeContext';
import { radius, sizes, spacing, shape } from '../../theme/tokens';
import { fontFamilies } from '../../theme/typography';

export interface WhatsNewModalProps {
  visible: boolean;
  onClose: () => void;
}

interface FeatureHighlight {
  id: string;
  icon: string;
  title: string;
  description: string;
  badge: string;
}

const HIGHLIGHTS: FeatureHighlight[] = [
  {
    id: 'editorial',
    icon: 'i-bulb',
    title: 'Still Water Typography',
    description: 'Newsreader display serif alongside Figtree sans for quiet, legible reflections.',
    badge: 'Editorial',
  },
  {
    id: 'inline-blocks',
    icon: 'i-sparkles',
    title: 'Inline Journal Blocks',
    description: 'Insert sketches, photos, voice memos, and videos at your cursor. Tap to resize or breath.',
    badge: 'Journal',
  },
  {
    id: 'paper-textures',
    icon: 'i-leaf',
    title: 'Tactile Paper Textures',
    description: 'Six living papers with notebook ruled lines, dot grids, and WCAG AA contrast tinting.',
    badge: 'Paper',
  },
  {
    id: 'zen-playground',
    icon: 'i-flower',
    title: 'Zen Playground',
    description: 'Tactile sand garden, relaxing bubble pop, and breathing companion right from Calm.',
    badge: 'Calm',
  },
];

export function WhatsNewModal({ visible, onClose }: WhatsNewModalProps) {
  const { colors, isDark } = useAppTheme();
  const plateSize = sizes.touchTarget + spacing[3]; // 44 + 12 = 56px, standard design system plate

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      position="center"
      maxWidth={420}
      dismissOnBackdropPress={true}
      showCloseButton={false}
      footer={
        <Button
          title="Got it"
          variant="primary"
          onPress={onClose}
          fullWidth
        />
      }
    >
      <View style={styles.body}>
        {/* Design system standard tinted icon plate */}
        <View
          style={[
            styles.iconPlate,
            {
              width: plateSize,
              height: plateSize,
              backgroundColor: colors.primary.subtle,
            },
          ]}
        >
          <AppIcon
            name="i-sparkles"
            size={28}
            color={colors.primary.default}
            animated={false}
          />
        </View>

        {/* Dialog Header */}
        <AppText
          variant="h3"
          center
          style={{
            fontFamily: fontFamilies.display.regular,
            fontSize: 24,
            lineHeight: 30,
            letterSpacing: -0.3,
            color: colors.text.primary,
          }}
        >
          What’s New in Calmly
        </AppText>
        <AppText
          variant="bodySmall"
          tone="secondary"
          center
          style={{ marginTop: spacing[1], marginBottom: spacing[4], paddingHorizontal: spacing[2] }}
        >
          Still Water release · crafted with quiet intention
        </AppText>

        {/* Highlights List */}
        <ScrollView
          style={styles.scrollList}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {HIGHLIGHTS.map((item) => (
            <View
              key={item.id}
              style={[
                styles.itemRow,
                {
                  backgroundColor: colors.surface.default,
                  borderColor: colors.border.subtle,
                },
              ]}
            >
              <View
                style={[
                  styles.itemIconWrap,
                  {
                    backgroundColor: colors.surface.muted,
                  },
                ]}
              >
                <AppIcon name={item.icon} size={18} color={colors.primary.default} animated={false} />
              </View>

              <View style={styles.itemTextWrap}>
                <View style={styles.itemHeader}>
                  <AppText style={[styles.itemTitle, { color: colors.text.primary }]}>
                    {item.title}
                  </AppText>
                  <View
                    style={[
                      styles.itemBadge,
                      {
                        backgroundColor: isDark
                          ? 'rgba(74, 107, 93, 0.22)'
                          : 'rgba(44, 79, 69, 0.08)',
                      },
                    ]}
                  >
                    <AppText
                      style={[
                        styles.itemBadgeText,
                        { color: colors.primary.default },
                      ]}
                    >
                      {item.badge}
                    </AppText>
                  </View>
                </View>
                <AppText
                  variant="caption"
                  tone="secondary"
                  style={{ marginTop: 2, lineHeight: 16 }}
                >
                  {item.description}
                </AppText>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: {
    alignItems: 'center',
    paddingTop: spacing[2],
  },
  iconPlate: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  scrollList: {
    maxHeight: 290,
    width: '100%',
  },
  scrollContent: {
    gap: spacing[2],
    paddingBottom: spacing[1],
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: shape.card,
    borderWidth: 1,
    gap: spacing[3],
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextWrap: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[2],
  },
  itemTitle: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  itemBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.sm,
  },
  itemBadgeText: {
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
