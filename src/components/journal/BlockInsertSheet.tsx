import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet } from '../ui/BottomSheet';
import { AppText } from '../ui/AppText';
import { TactilePressable } from '../interactive/TactilePressable';
import {
  BlockSize,
  BlockBreath,
  SIZE_LABEL,
} from '../../features/journal/pageBlocks';

export type InsertKind = 'photo' | 'camera' | 'voice' | 'video' | 'file' | 'sketch' | 'prompt';

const KINDS: { id: InsertKind; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'photo', label: 'Photo', icon: 'image-outline' },
  { id: 'camera', label: 'Camera', icon: 'camera-outline' },
  { id: 'sketch', label: 'Sketch', icon: 'pencil-outline' },
  { id: 'voice', label: 'Voice memo', icon: 'mic-outline' },
  { id: 'video', label: 'Video', icon: 'videocam-outline' },
  { id: 'file', label: 'File', icon: 'document-outline' },
  { id: 'prompt', label: "Today's prompt", icon: 'bulb-outline' },
];

const SIZES: BlockSize[] = ['quarter', 'third', 'half', 'full'];
const BREATHS: { id: BlockBreath; label: string }[] = [
  { id: 'tight', label: 'Tight' },
  { id: 'comfortable', label: 'Comfortable' },
  { id: 'airy', label: 'Airy' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  size: BlockSize;
  breath: BlockBreath;
  onSizeChange: (s: BlockSize) => void;
  onBreathChange: (b: BlockBreath) => void;
  /** Present when inserting. Null when only adjusting an existing block. */
  onPickKind?: (kind: InsertKind) => void;
  /** Sizes allowed for the block being edited. Defaults to all sizes. */
  sizeOptions?: BlockSize[];
  /** Callback to delete the block currently being edited. */
  onDeleteBlock?: () => void;
  accent: string;
  ink: string;
  surface: string;
  border: string;
}

export function BlockInsertSheet(p: Props) {
  const sizes = p.sizeOptions ?? SIZES;
  const isEditing = !p.onPickKind;

  return (
    <BottomSheet visible={p.visible} onClose={p.onClose}>
      <View style={styles.body}>
        <AppText style={[styles.heading, { color: p.ink }]}>
          {isEditing ? 'Resize block' : 'Size'}
        </AppText>
        <Segmented
          options={sizes.map((s) => ({ id: s, label: SIZE_LABEL[s] }))}
          value={p.size}
          onChange={(v) => p.onSizeChange(v as BlockSize)}
          accent={p.accent}
          ink={p.ink}
          surface={p.surface}
          border={p.border}
        />

        <AppText style={[styles.heading, { color: p.ink }]}>Breath</AppText>
        <Segmented
          options={BREATHS}
          value={p.breath}
          onChange={(v) => p.onBreathChange(v as BlockBreath)}
          accent={p.accent}
          ink={p.ink}
          surface={p.surface}
          border={p.border}
        />

        {p.onPickKind ? (
          <View style={styles.kinds}>
            {KINDS.map((k) => (
              <Pressable
                key={k.id}
                onPress={() => p.onPickKind?.(k.id)}
                accessibilityRole="button"
                accessibilityLabel={k.label}
                style={[styles.kind, { borderColor: p.border }]}
              >
                <Ionicons name={k.icon} size={20} color={p.accent} />
                <AppText style={[styles.kindLabel, { color: p.ink }]}>{k.label}</AppText>
              </Pressable>
            ))}
          </View>
        ) : null}

        {isEditing && p.onDeleteBlock ? (
          <View style={styles.deleteContainer}>
            <TactilePressable
              onPress={p.onDeleteBlock}
              accessibilityRole="button"
              accessibilityLabel="Delete this block"
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={17} color="#E05252" />
              <AppText style={styles.deleteLabel}>Delete block</AppText>
            </TactilePressable>
          </View>
        ) : null}
      </View>
    </BottomSheet>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  accent,
  ink,
  surface,
  border,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  accent: string;
  ink: string;
  surface: string;
  border: string;
}) {
  return (
    <View style={[styles.segmented, { borderColor: border, backgroundColor: surface }]}>
      {options.map((o) => {
        const selected = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={[styles.seg, selected && { backgroundColor: accent }]}
          >
            <Text style={{ color: selected ? '#FFFFFF' : ink, fontWeight: '600', fontSize: 14 }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  heading: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 6,
  },
  segmented: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, padding: 3 },
  seg: { flex: 1, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  kinds: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  kind: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  kindLabel: { fontSize: 14, fontWeight: '600' },
  deleteContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  deleteButton: {
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(224, 82, 82, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E05252',
  },
});
