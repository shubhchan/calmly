import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Share } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { database } from '../../database';
import Affirmation from '../../database/models/Affirmation';
import { Card } from '../../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { PopIn } from '../../components/interactive/PopIn';
import { DetailSkeleton } from '../../components/interactive/LoadingState';
import { resolveTint } from '../../theme/tints';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'AffirmationDetail'>['navigation'];
type RouteProp = NativeStackScreenProps<RootStackParamList, 'AffirmationDetail'>['route'];

export function AffirmationDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const colors = useThemeColors();
  const lilacTint = resolveTint(!!colors.isDark, 'lilac');
  const { id } = route.params ?? {};

  const [affirmation, setAffirmation] = useState<{
    id: string;
    text: string;
    category: string;
    favorite: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAffirmation = async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let a = null;
      try {
        a = await database.get<Affirmation>('affirmations').find(id);
      } catch {
        a = null;
      }
      if (!a) {
        setAffirmation(null);
        return;
      }
      setAffirmation({
        id: a?.id ?? id ?? '',
        text: a?.text ?? '',
        category: a?.category ?? '',
        favorite: a?.favorite ?? false,
      });
    } catch (error) {
      console.error('Failed to load affirmation:', error);
      setAffirmation((prev) => prev ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAffirmation();
  }, [id]);

  const handleToggleFavorite = async () => {
    if (!affirmation || !id) return;
    try {
      let a = null;
      try {
        a = await database.get<Affirmation>('affirmations').find(id);
      } catch {
        return;
      }
      if (!a) return;
      await database.write(async () => {
        await a.update((aff) => {
          aff.favorite = !affirmation.favorite;
        });
      });
      setAffirmation({ ...affirmation, favorite: !affirmation.favorite });
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  const handleShare = async () => {
    if (!affirmation) return;
    try {
      await Share.share({
        title: 'Mindful Affirmation',
        message: `"${affirmation?.text ?? ''}"\n\n— via Calmly`,
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert(
      'Delete affirmation?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            try {
              await database.write(async () => {
                let a = null;
                try {
                  a = await database.get<Affirmation>('affirmations').find(id);
                } catch {
                  a = null;
                }
                if (a) await a.destroyPermanently();
              });
            } catch {}
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (!id) {
    return (
      <ScreenContainer scroll={false} backgroundColor={colors.bgPrimary} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.textSecondary }}>Not found</Text>
      </ScreenContainer>
    );
  }

  if (loading) {
    return (
      <ScreenContainer contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16 }}>
        <DetailSkeleton />
      </ScreenContainer>
    );
  }

  if (!affirmation) {
    return (
      <ScreenContainer scroll={false} backgroundColor={colors.bgPrimary} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.textSecondary }}>Affirmation not found</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <PopIn index={0}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{affirmation?.category ?? ''}</Text>
        <View style={{ width: 40 }} />
      </View>
      </PopIn>

      <PopIn index={1}>
      <Card tone="lilac" style={styles.affirmationCard}>
        <Ionicons name="chatbubble-ellipses-outline" size={32} color={lilacTint.accent + '60'} style={{ marginBottom: 4 }} />
        <Text style={[styles.affirmationText, { color: lilacTint.text }]}>{affirmation?.text ?? ''}</Text>
      </Card>
      </PopIn>

      <PopIn index={2}>
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={handleToggleFavorite}
          style={[
            styles.actionButton,
            { backgroundColor: colors.bgCard, borderColor: colors.borderLight },
            affirmation?.favorite && { borderColor: (colors.accentPeach || '#EB876D') + '60' },
          ]}
        >
          <Ionicons
            name={affirmation?.favorite ? 'heart' : 'heart-outline'}
            size={20}
            color={affirmation?.favorite ? (colors.accentPeach || '#EB876D') : colors.accentPrimary}
          />
          <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>
            {affirmation?.favorite ? 'Favorited' : 'Favorite'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleShare}
          style={[styles.actionButton, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}
        >
          <Ionicons name="share-outline" size={20} color={colors.accentPrimary} />
          <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Share</Text>
        </TouchableOpacity>
      </View>
      </PopIn>

      <PopIn index={3}>
      <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
        <Text style={[styles.deleteButtonText, { color: colors.accentRose || '#EB697F' }]}>Delete Affirmation</Text>
      </TouchableOpacity>
      </PopIn>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60, gap: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', textTransform: 'capitalize', letterSpacing: -0.3 },
  affirmationCard: {
    padding: 28,
    borderRadius: 24,
    alignItems: 'center',
    gap: 12,
  },
  affirmationText: {
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 36,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 14 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionLabel: { fontSize: 14, fontWeight: '600' },
  deleteButton: { marginTop: 12, paddingVertical: 14, alignItems: 'center' },
  deleteButtonText: { fontSize: 15, fontWeight: '600' },
});