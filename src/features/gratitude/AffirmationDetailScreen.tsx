import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Share } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { database } from '../../database';
import Affirmation from '../../database/models/Affirmation';
import { Card } from '../../components/Card';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeContext';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { ScreenHeader } from '../../components';
import { PopIn } from '../../components/interactive/PopIn';
import { DetailSkeleton } from '../../components/interactive/LoadingState';
import { resolveTint } from '../../theme/tints';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'AffirmationDetail'>['navigation'];
type RouteProp = NativeStackScreenProps<RootStackParamList, 'AffirmationDetail'>['route'];

export function AffirmationDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { colors, isDark } = useAppTheme();
  const lilacTint = resolveTint(!!isDark, 'lilac');
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
      <ScreenContainer scroll={false} backgroundColor={colors.background.default} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text.secondary }}>Not found</Text>
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
      <ScreenContainer scroll={false} backgroundColor={colors.background.default} style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text.secondary }}>Affirmation not found</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentContainerStyle={styles.content}>
      <PopIn index={0}>
      <ScreenHeader title={affirmation?.category ?? ''} />
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
            { backgroundColor: colors.surface.default, borderColor: colors.border.default },
            affirmation?.favorite && { borderColor: (colors.accents.peach) + '60' },
          ]}
        >
          <Ionicons
            name={affirmation?.favorite ? 'heart' : 'heart-outline'}
            size={20}
            color={affirmation?.favorite ? (colors.accents.peach) : colors.primary.default}
          />
          <Text style={[styles.actionLabel, { color: colors.text.primary }]}>
            {affirmation?.favorite ? 'Favorited' : 'Favorite'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleShare}
          style={[styles.actionButton, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}
        >
          <Ionicons name="share-outline" size={20} color={colors.primary.default} />
          <Text style={[styles.actionLabel, { color: colors.text.primary }]}>Share</Text>
        </TouchableOpacity>
      </View>
      </PopIn>

      <PopIn index={3}>
      <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
        <Text style={[styles.deleteButtonText, { color: colors.accents.rose }]}>Delete Affirmation</Text>
      </TouchableOpacity>
      </PopIn>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60, gap: 20 },
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