import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert, Share } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { database } from '../../database';
import Affirmation from '../../database/models/Affirmation';
import { Card } from '../../components/Card';
import { PrimaryButton } from '../../components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';

type NavigationProp = NativeStackScreenProps<RootStackParamList, 'AffirmationDetail'>['navigation'];
type RouteProp = NativeStackScreenProps<RootStackParamList, 'AffirmationDetail'>['route'];

export function AffirmationDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProp>();
  const { id } = route.params ?? {};

  const [affirmation, setAffirmation] = useState<{
    id: string;
    text: string;
    category: string;
    favorite: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAffirmation = async () => {
    setLoading(true);
    try {
      const a = await database.get<Affirmation>('affirmations').find(id);
      setAffirmation({
        id: a.id,
        text: a.text,
        category: a.category,
        favorite: a.favorite,
      });
    } catch (error) {
      console.error('Failed to load affirmation:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAffirmation();
  }, [id]);

  const handleToggleFavorite = async () => {
    if (!affirmation) return;
    try {
      await database.write(async () => {
        const a = await database.get<Affirmation>('affirmations').find(id);
        await a.update(aff => { aff.favorite = !affirmation.favorite; });
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
        title: 'Affirmation',
        message: `${affirmation.text}\n\n— via Calmly`,
      });
    } catch (error) {
      console.error('Failed to share:', error);
    }
  };

  const handleCopy = () => {
    if (!affirmation) return;
    Alert.alert('Copied!', 'Affirmation copied to clipboard');
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete affirmation?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await database.write(async () => {
              const a = await database.get<Affirmation>('affirmations').find(id);
              await a.destroyPermanently();
            });
            navigation.goBack();
          },
        },
      ]
    );
  };

  if (loading || !affirmation) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#1E232E" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{affirmation.category}</Text>
          <View style={styles.headerSpacer} />
        </View>

        <Card style={styles.affirmationCard}>
          <Text style={styles.affirmationText}>{affirmation.text}</Text>
        </Card>

        <View style={styles.actions}>
          <TouchableOpacity onPress={handleToggleFavorite} style={styles.actionButton}>
            <Ionicons
              name={affirmation.favorite ? 'heart' : 'heart-outline'}
              size={24}
              color={affirmation.favorite ? '#F5A9A9' : '#5A955A'}
            />
            <Text style={styles.actionLabel}>{affirmation.favorite ? 'Favorited' : 'Favorite'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
            <Ionicons name="share" size={24} color="#5A955A" />
            <Text style={styles.actionLabel}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCopy} style={styles.actionButton}>
            <Ionicons name="copy" size={24} color="#5A955A" />
            <Text style={styles.actionLabel}>Copy</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDFBF7' },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: '#1E232E', textAlign: 'center', textTransform: 'capitalize' },
  headerSpacer: { width: 44 },
  affirmationCard: { padding: 24, gap: 12 },
  affirmationText: { fontSize: 22, fontWeight: '500', color: '#1E232E', lineHeight: 32, textAlign: 'center', fontStyle: 'italic' },
  actions: { flexDirection: 'row', justifyContent: 'space-around', gap: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E4DEBC' },
  actionLabel: { fontSize: 13, fontWeight: '500', color: '#34415A' },
  deleteButton: { marginTop: 8, paddingVertical: 14, alignItems: 'center' },
  deleteButtonText: { fontSize: 16, fontWeight: '600', color: '#F5A9A9' },
  loadingText: { textAlign: 'center', marginTop: 100, color: '#425474' },
});