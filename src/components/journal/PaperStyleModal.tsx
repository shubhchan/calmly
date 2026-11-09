import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { AppText, Modal, TactilePressable } from '../../components';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import {
  PAPERS,
  PRIMARY_PAPERS,
  MORE_PAPERS,
  ACCENT_COLORS,
  PaperStyle,
  paperColor,
} from '../../features/journal/papers';
import { PaperTexture } from './PaperTexture';
import { hapticFeedback } from '../../utils/haptics';

interface PaperStyleModalProps {
  visible: boolean;
  onClose: () => void;
  selectedPaperId: string;
  onSelectPaper: (paperId: string) => void;
  accentColor?: string;
  onSelectAccentColor?: (color: string) => void;
}

export function PaperStyleModal({
  visible,
  onClose,
  selectedPaperId,
  onSelectPaper,
  accentColor,
  onSelectAccentColor,
}: PaperStyleModalProps) {
  const { colors, isDark } = useAppTheme();
  const [showMore, setShowMore] = useState(false);

  const activePaper = PAPERS.find((p) => p.id === selectedPaperId) ?? PAPERS[2];
  const activeAccent = accentColor || activePaper.accent;

  const renderPaperTile = (paper: PaperStyle) => {
    const isSelected = paper.id === selectedPaperId;
    const tileBg = paperColor(paper, isDark);

    return (
      <TouchableOpacity
        key={paper.id}
        onPress={() => {
          hapticFeedback.selection();
          onSelectPaper(paper.id);
          if (onSelectAccentColor && !accentColor) {
            onSelectAccentColor(paper.accent);
          }
        }}
        activeOpacity={0.88}
        style={{
          flex: 1,
          minWidth: '47%',
          padding: 7,
          borderRadius: 16,
          backgroundColor: isSelected ? (isDark ? '#26332C' : '#FFFFFF') : isDark ? '#1C2520' : '#F4F5F1',
          borderWidth: isSelected ? 1.5 : 1,
          borderColor: isSelected ? activeAccent : 'transparent',
          shadowColor: '#14241E',
          shadowOffset: { width: 0, height: isSelected ? 3 : 1 },
          shadowOpacity: isSelected ? 0.12 : 0.04,
          shadowRadius: isSelected ? 6 : 2,
        }}
      >
        {/* Paper swatch preview box */}
        <View
          style={{
            height: 64,
            borderRadius: 11,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: tileBg,
            borderWidth: 1,
            borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,36,32,0.08)',
          }}
        >
          {/* Texture pattern overlay */}
          <PaperTexture texture={paper.texture} isDark={isDark} />

          {/* Sample lines */}
          <View
            style={{
              position: 'absolute',
              left: 10,
              right: 10,
              top: 26,
              height: 1,
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,36,32,0.10)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: 10,
              right: 10,
              top: 40,
              height: 1,
              backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(26,36,32,0.10)',
            }}
          />

          {/* Sample ink text */}
          <AppText
            numberOfLines={1}
            style={{
              position: 'absolute',
              left: 11,
              top: 10,
              fontFamily: fontFamilies.display.regular,
              fontSize: 10,
              color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(26,36,32,0.5)',
            }}
          >
            {paper.inkText}
          </AppText>

          {/* Checkmark badge */}
          {isSelected && (
            <View
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                width: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: activeAccent,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M20 6L9 17l-5-5"
                  stroke="#FFFFFF"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
          )}
        </View>

        {/* Tile footer meta */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            paddingTop: 8,
            paddingHorizontal: 3,
            paddingBottom: 2,
          }}
        >
          <AppText style={{ fontSize: 13.5, fontWeight: '600', color: colors.text.primary }}>
            {paper.name}
          </AppText>
          <AppText style={{ fontSize: 11, color: colors.text.tertiary }}>
            {paper.feeling}
          </AppText>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      position="bottom"
      title="Paper & mood"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        <AppText style={{ fontSize: 13, lineHeight: 18, color: colors.text.secondary, marginBottom: 16 }}>
          Color and texture carry the feeling. Pick what matches today.
        </AppText>

        {/* 2x2 Primary Papers Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {PRIMARY_PAPERS.map(renderPaperTile)}
        </View>

        {/* More Papers (Dusk & Ember) */}
        {!showMore ? (
          <TouchableOpacity
            onPress={() => {
              hapticFeedback.light();
              setShowMore(true);
            }}
            style={{
              marginTop: 12,
              height: 44,
              borderRadius: 14,
              backgroundColor: isDark ? colors.surface.default : '#F4F5F1',
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              gap: 10,
            }}
          >
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"
                stroke={colors.text.secondary}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <AppText style={{ flex: 1, fontSize: 12.5, color: colors.text.primary }}>
              More papers · <AppText style={{ fontWeight: '600' }}>Dusk</AppText> and{' '}
              <AppText style={{ fontWeight: '600' }}>Ember</AppText>
            </AppText>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M9 6l6 6-6 6" stroke={colors.text.tertiary} strokeWidth={2} strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
        ) : (
          <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {MORE_PAPERS.map(renderPaperTile)}
          </View>
        )}

        {/* Accent Color Palette Section */}
        {onSelectAccentColor && (
          <View style={{ marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.border.subtle }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <AppText
                style={{
                  fontSize: 11,
                  fontWeight: '700',
                  letterSpacing: 1.1,
                  textTransform: 'uppercase',
                  color: colors.text.tertiary,
                }}
              >
                Accent color
              </AppText>
              <AppText style={{ fontSize: 11, color: activeAccent, fontWeight: '600' }}>
                {ACCENT_COLORS.find((c) => c.color.toLowerCase() === activeAccent.toLowerCase())?.name || 'Custom'}
              </AppText>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
              {ACCENT_COLORS.map((item) => {
                const isSelected = item.color.toLowerCase() === activeAccent.toLowerCase();
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      hapticFeedback.selection();
                      onSelectAccentColor(item.color);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={item.name}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: isSelected ? 2 : 0,
                      borderColor: item.color,
                      padding: 2,
                    }}
                  >
                    <View
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 15,
                        backgroundColor: item.color,
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.15,
                        shadowRadius: 2,
                      }}
                    >
                      {isSelected && (
                        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                          <Path
                            d="M20 6L9 17l-5-5"
                            stroke="#FFFFFF"
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Buttons matching Doop 26DIvsEVtC */}
        <View style={{ marginTop: 20, gap: 10 }}>
          <TactilePressable
            onPress={() => {
              hapticFeedback.selection();
              onClose();
            }}
            scaleDownTo={0.98}
            accessibilityRole="button"
            accessibilityLabel={`Use ${activePaper.name}`}
            style={{
              height: 48,
              borderRadius: 16,
              backgroundColor: activeAccent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppText style={{ fontSize: 14.5, fontWeight: '600', color: '#F6F8F4' }}>
              Use {activePaper.name}
            </AppText>
          </TactilePressable>

          <TouchableOpacity
            onPress={() => {
              hapticFeedback.light();
              onSelectPaper('mist');
              if (onSelectAccentColor) {
                onSelectAccentColor('#2C4F45');
              }
              onClose();
            }}
            style={{ paddingVertical: 6, alignItems: 'center' }}
          >
            <AppText style={{ fontSize: 13, color: colors.text.secondary }}>
              Keep the page plain
            </AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Modal>
  );
}
