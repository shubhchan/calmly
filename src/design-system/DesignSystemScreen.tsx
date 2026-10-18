import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { AppIcon } from '../components/AppIcon';
import { useAppTheme, useTheme } from '../theme/ThemeContext';
import { AccentColor } from '../types/navigation';
import {
  AppText,
  Avatar,
  Badge,
  BottomSheet,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  ConfirmDialog,
  Divider,
  EmptyState,
  IconButton,
  InlineAlert,
  ListItem,
  LoadingIndicator,
  LoadingOverlay,
  Modal,
  ProgressBar,
  RadioGroup,
  SearchInput,
  SectionHeader,
  SkeletonCard,
  SkeletonList,
  SkeletonText,
  Surface,
  Switch,
  TextInput,
} from '../components/ui';
import { radius, spacing } from '../theme/tokens';

const ACCENTS: AccentColor[] = ['sage', 'lavender', 'sky', 'peach', 'rose', 'ocean'];
const THEME_MODES: { value: 'light' | 'dark' | 'system'; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

function Swatch({ name, color }: { name: string; color: string }) {
  const theme = useAppTheme();
  return (
    <View style={styles.swatchCell}>
      <View
        style={[
          styles.swatch,
          {
            backgroundColor: color,
            borderColor: theme.colors.border.default,
          },
        ]}
      />
      <AppText variant="caption" tone="tertiary" numberOfLines={1}>
        {name}
      </AppText>
    </View>
  );
}

function SwatchGroup({ title, items }: { title: string; items: { name: string; color: string }[] }) {
  return (
    <View style={styles.swatchGroup}>
      <AppText variant="label" tone="secondary">
        {title}
      </AppText>
      <View style={styles.swatchRow}>
        {items.map((item) => (
          <Swatch key={item.name} name={item.name} color={item.color} />
        ))}
      </View>
    </View>
  );
}

export function DesignSystemScreen() {
  const theme = useAppTheme();
  const context = useTheme();
  const c = theme.colors;

  const [checkbox, setCheckbox] = useState(true);
  const [switchValue, setSwitchValue] = useState(true);
  const [radio, setRadio] = useState('calm');
  const [chip, setChip] = useState('all');
  const [search, setSearch] = useState('');
  const [email, setEmail] = useState('');
  const [progress, setProgress] = useState(0.45);
  const [saving, setSaving] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [overlayVisible, setOverlayVisible] = useState(false);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => setSaving(false), 1600);
  };

  const handleOverlay = () => {
    setOverlayVisible(true);
    setTimeout(() => setOverlayVisible(false), 1400);
  };

  return (
    <ScreenContainer contentContainerStyle={styles.content} bottomPadding={spacing[10]}>
      <View style={styles.header}>
        <AppText variant="h1">Design System</AppText>
        <AppText variant="body" tone="secondary" style={styles.headerSubtitle}>
          Live reference for Calmly's tokens, themes and UI components
        </AppText>
        <AppText variant="caption" tone="tertiary" style={styles.headerMeta}>
          {`Mode: ${theme.mode} · Accent: ${theme.accent} · OS-independent`}
        </AppText>
      </View>

      {/* Live theme controls */}
      <Surface padding={5} border="subtle" radiusToken="2xl" elevationLevel="sm" style={styles.block}>
        <SectionHeader title="Theme" subtitle="Every swatch and component below reacts instantly" />
        <View style={styles.chipRow}>
          {THEME_MODES.map((mode) => (
            <Chip
              key={mode.value}
              label={mode.label}
              size="sm"
              selected={context.theme === mode.value}
              onPress={() => context.setTheme(mode.value)}
            />
          ))}
        </View>
        <View style={[styles.chipRow, styles.chipRowSpaced]}>
          {ACCENTS.map((accent) => (
            <Chip
              key={accent}
              label={accent}
              size="sm"
              selected={theme.accent === accent}
              onPress={() => context.setAccent(accent)}
            />
          ))}
        </View>
      </Surface>

      {/* Typography */}
      <Surface padding={5} border="subtle" radiusToken="2xl" elevationLevel="sm" style={styles.block}>
        <SectionHeader title="Typography" subtitle="Semantic variants resolve from the active font" />
        <View style={styles.stack}>
          <AppText variant="display">Display — calm mornings</AppText>
          <AppText variant="h1">Heading 1</AppText>
          <AppText variant="h2">Heading 2</AppText>
          <AppText variant="h3">Heading 3</AppText>
          <AppText variant="title">Title</AppText>
          <AppText variant="bodyLarge">Body large — breath in, breath out.</AppText>
          <AppText variant="body">Body — a steady baseline for reading.</AppText>
          <AppText variant="bodySmall">Body small — supporting copy.</AppText>
          <AppText variant="label">Label</AppText>
          <AppText variant="labelSmall">Label small</AppText>
          <AppText variant="caption">Caption — 11pt</AppText>
          <AppText variant="overline">Overline</AppText>
          <Divider spacingToken={2} />
          <AppText variant="body" tone="secondary">Secondary tone</AppText>
          <AppText variant="body" tone="tertiary">Tertiary tone</AppText>
          <AppText variant="body" tone="link">Link tone</AppText>
          <AppText variant="body" tone="success">Success tone</AppText>
          <AppText variant="body" tone="error">Error tone</AppText>
        </View>
      </Surface>

      {/* Colors */}
      <Surface padding={5} border="subtle" radiusToken="2xl" elevationLevel="sm" style={styles.block}>
        <SectionHeader title="Color tokens" subtitle="Semantic roles — never hardcode a hex" />
        <SwatchGroup
          title="Primary / action"
          items={[
            { name: 'default', color: c.primary.default },
            { name: 'pressed', color: c.primary.pressed },
            { name: 'subtle', color: c.primary.subtle },
            { name: 'border', color: c.primary.subtleBorder },
            { name: 'foreground', color: c.primary.foreground },
          ]}
        />
        <SwatchGroup
          title="Background / surface"
          items={[
            { name: 'bg default', color: c.background.default },
            { name: 'bg secondary', color: c.background.secondary },
            { name: 'bg tertiary', color: c.background.tertiary },
            { name: 'surface', color: c.surface.default },
            { name: 'surface muted', color: c.surface.muted },
          ]}
        />
        <SwatchGroup
          title="Text"
          items={[
            { name: 'primary', color: c.text.primary },
            { name: 'secondary', color: c.text.secondary },
            { name: 'tertiary', color: c.text.tertiary },
            { name: 'link', color: c.text.link },
            { name: 'disabled', color: c.text.disabled },
          ]}
        />
        <SwatchGroup
          title="Borders"
          items={[
            { name: 'subtle', color: c.border.subtle },
            { name: 'default', color: c.border.default },
            { name: 'strong', color: c.border.strong },
          ]}
        />
        <SwatchGroup
          title="Status"
          items={[
            { name: 'success', color: c.status.success.default },
            { name: 'warning', color: c.status.warning.default },
            { name: 'error', color: c.status.error.default },
            { name: 'info', color: c.status.info.default },
            { name: 'success soft', color: c.status.success.subtle },
          ]}
        />
        <SwatchGroup
          title="Accents"
          items={ACCENTS.map((accent) => ({ name: accent, color: c.accents[accent] }))}
        />
      </Surface>

      {/* Buttons */}
      <Surface padding={5} border="subtle" radiusToken="2xl" elevationLevel="sm" style={styles.block}>
        <SectionHeader title="Buttons" subtitle="Pill actions with press physics and haptics" />
        <View style={styles.buttonRow}>
          <Button title="Primary" onPress={() => {}} />
          <Button title="Secondary" variant="secondary" onPress={() => {}} />
          <Button title="Outline" variant="outline" onPress={() => {}} />
        </View>
        <View style={[styles.buttonRow, styles.chipRowSpaced]}>
          <Button title="Ghost" variant="ghost" onPress={() => {}} />
          <Button title="Delete" variant="destructive" onPress={() => {}} />
          <Button title="Disabled" disabled onPress={() => {}} />
        </View>
        <View style={[styles.buttonRow, styles.chipRowSpaced]}>
          <Button title="Small" size="sm" onPress={() => {}} />
          <Button title="Medium" size="md" onPress={() => {}} />
          <Button title="Large" size="lg" onPress={() => {}} />
        </View>
        <View style={[styles.buttonRow, styles.chipRowSpaced]}>
          <Button
            title={saving ? 'Saving…' : 'With icon'}
            loading={saving}
            leftIcon={(color, size) => <AppIcon name="i-check" size={size} color={color} animated={false} />}
            onPress={handleSave}
          />
          <Button title="Dismiss" variant="outline" onPress={() => {}} />
        </View>
        <Button title="Full width primary" fullWidth style={styles.fullWidthButton} onPress={() => {}} />
      </Surface>

      {/* Icon buttons */}
      <Surface padding={5} border="subtle" radiusToken="2xl" elevationLevel="sm" style={styles.block}>
        <SectionHeader title="Icon buttons" subtitle="Circular, always labelled for screen readers" />
        <View style={styles.buttonRow}>
          <IconButton icon="i-close" accessibilityLabel="Dismiss" variant="ghost" onPress={() => {}} />
          <IconButton icon="i-search" accessibilityLabel="Search" variant="subtle" onPress={() => {}} />
          <IconButton icon="i-add" accessibilityLabel="Add" variant="outline" onPress={() => {}} />
          <IconButton icon="i-check" accessibilityLabel="Confirm" variant="solid" onPress={() => {}} />
          <IconButton icon="i-close" accessibilityLabel="Disabled" disabled onPress={() => {}} />
        </View>
      </Surface>

      {/* Inputs */}
      <Surface padding={5} border="subtle" radiusToken="2xl" elevationLevel="sm" style={styles.block}>
        <SectionHeader title="Inputs" subtitle="Focus, error and disabled states included" />
        <View style={styles.stack}>
          <TextInput
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            helperText="Only used on this device"
            leftIconName="i-person"
            keyboardType="email-address"
          />
          <TextInput
            label="With error"
            placeholder="Required"
            value=""
            onChangeText={() => {}}
            errorText="This field is required"
          />
          <TextInput label="Disabled" placeholder="Unavailable" value="Locked" onChangeText={() => {}} disabled />
          <SearchInput placeholder="Search reflections…" value={search} onChangeText={setSearch} />
        </View>
      </Surface>

      {/* Selection */}
      <Surface padding={5} border="subtle" radiusToken="2xl" elevationLevel="sm" style={styles.block}>
        <SectionHeader title="Selection controls" />
        <View style={styles.stack}>
          <Checkbox
            checked={checkbox}
            onToggle={() => setCheckbox((v) => !v)}
            label="Include a gratitude note"
            description="Adds a small prompt at the end of your entry"
          />
          <Switch
            value={switchValue}
            onValueChange={setSwitchValue}
            label="Daily reminder"
            description="A gentle nudge at 8:00 PM"
          />
          <RadioGroup
            options={[
              { value: 'calm', label: 'Calm', description: 'Soft ambient tone' },
              { value: 'focus', label: 'Focus', description: 'Sharper, minimal tone' },
              { value: 'sleep', label: 'Sleep', description: 'Warm, dimmed tone' },
            ]}
            value={radio}
            onChange={setRadio}
          />
        </View>
      </Surface>

      {/* Chips & badges */}
      <Surface padding={5} border="subtle" radiusToken="2xl" elevationLevel="sm" style={styles.block}>
        <SectionHeader title="Chips & badges" />
        <View style={styles.chipRow}>
          {['all', 'journal', 'mood', 'habits'].map((value) => (
            <Chip
              key={value}
              label={value}
              selected={chip === value}
              onPress={() => setChip(value)}
            />
          ))}
        </View>
        <View style={[styles.chipRow, styles.chipRowSpaced]}>
          <Badge label="Neutral" />
          <Badge label="Primary" tone="primary" />
          <Badge label="Success" tone="success" />
          <Badge label="Warning" tone="warning" />
          <Badge label="Error" tone="error" />
          <Badge label="Info" tone="info" iconName="i-sparkles" />
        </View>
      </Surface>

      {/* Avatars */}
      <Surface padding={5} border="subtle" radiusToken="2xl" elevationLevel="sm" style={styles.block}>
        <SectionHeader title="Avatars" />
        <View style={styles.buttonRow}>
          <Avatar name="Calmly" size="lg" />
          <Avatar iconName="i-leaf" size="lg" tone="sage" />
          <Avatar name="Mood" size="lg" tone="blush" />
          <Avatar name="Night" size="lg" tone="navy" />
          <Avatar name="Sky" size="lg" tone="sky" />
        </View>
      </Surface>

      {/* List items */}
      <Surface padding={5} border="subtle" radiusToken="2xl" elevationLevel="sm" style={styles.block}>
        <SectionHeader title="List items" />
        <ListItem
          title="Morning pages"
          subtitle="3 prompts · 10 min"
          leftIconName="i-book"
          chevron
          onPress={() => {}}
        />
        <Divider />
        <ListItem title="Current streak" valueText="12 days" leftIconName="i-flame" />
        <Divider />
        <ListItem
          title="Reminder"
          subtitle="Disabled until tomorrow"
          leftIconName="i-time"
          chevron
          disabled
        />
      </Surface>

      {/* Feedback */}
      <Surface padding={5} border="subtle" radiusToken="2xl" elevationLevel="sm" style={styles.block}>
        <SectionHeader title="Feedback" subtitle="Alerts, progress and loaders" />
        <View style={styles.stack}>
          <InlineAlert tone="success" title="Saved" message="Your entry is safe on this device." />
          <InlineAlert tone="warning" message="You're offline — changes stay local." />
          <InlineAlert tone="error" title="Something went wrong" message="Could not sync, try again." />
          <InlineAlert tone="info" message="New breathing preset available." onDismiss={() => {}} />
          <View style={styles.progressBlock}>
            <ProgressBar value={progress} label="Weekly goal" showValue />
            <Button
              title="Bump progress"
              variant="outline"
              size="sm"
              onPress={() => setProgress((v) => (v >= 0.95 ? 0.15 : Math.min(1, v + 0.2)))}
            />
          </View>
          <LoadingIndicator label="Loading calm…" centered={false} />
        </View>
      </Surface>

      {/* Skeletons */}
      <Surface padding={5} border="subtle" radiusToken="2xl" elevationLevel="sm" style={styles.block}>
        <SectionHeader title="Skeletons" subtitle="Shimmering placeholders — same rhythm as the app" />
        <View style={styles.stack}>
          <SkeletonText lines={3} />
          <SkeletonList rows={3} />
          <SkeletonCard height={88} />
        </View>
      </Surface>

      {/* Surfaces & cards */}
      <Surface padding={5} border="subtle" radiusToken="2xl" elevationLevel="sm" style={styles.block}>
        <SectionHeader title="Surfaces & cards" />
        <View style={styles.stack}>
          <Surface padding={4} border="default" radiusToken="lg" background="secondary">
            <AppText variant="body">Surface · secondary background</AppText>
          </Surface>
          <Surface padding={4} radiusToken="lg" elevationLevel="md">
            <AppText variant="body">Surface · elevated card</AppText>
          </Surface>
          <Card variant="elevated" tone="lilac">
            <CardContent>
              <AppText variant="title">Tinted card</AppText>
              <AppText variant="bodySmall" tone="secondary">
                Pastel tints stay readable in both themes
              </AppText>
            </CardContent>
          </Card>
        </View>
      </Surface>

      {/* Overlays */}
      <Surface padding={5} border="subtle" radiusToken="2xl" elevationLevel="sm" style={styles.block}>
        <SectionHeader title="Overlays" subtitle="Modal, confirm dialog and bottom sheet" />
        <View style={styles.buttonRow}>
          <Button title="Open modal" variant="secondary" onPress={() => setModalVisible(true)} />
          <Button title="Confirm" variant="outline" onPress={() => setConfirmVisible(true)} />
          <Button title="Sheet" variant="ghost" onPress={() => setSheetVisible(true)} />
        </View>
        <Button
          title="Show loading overlay"
          variant="outline"
          fullWidth
          style={styles.fullWidthButton}
          onPress={handleOverlay}
        />
      </Surface>

      {/* Empty state */}
      <Surface padding={5} border="subtle" radiusToken="2xl" elevationLevel="sm" style={styles.block}>
        <SectionHeader title="Empty state" />
        <EmptyState
          iconName="i-journal"
          iconTone="coral"
          title="No entries yet"
          description="Your reflections will appear here as you write them."
          action={{ label: 'Write your first entry', onPress: () => {} }}
        />
      </Surface>

      <AppText variant="caption" tone="tertiary" center style={styles.footer}>
        Spacing follows the 4pt scale · radii follow the shape tokens · every color above comes from
        the active theme
      </AppText>

      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title="Modal title"
        footer={
          <View style={styles.footerRow}>
            <Button title="Cancel" variant="secondary" size="sm" onPress={() => setModalVisible(false)} />
            <Button title="Done" size="sm" onPress={() => setModalVisible(false)} />
          </View>
        }
      >
        <AppText variant="body" tone="secondary">
          Themed dialogs animate in and out, dismiss on backdrop press, and respect reduced motion.
        </AppText>
      </Modal>

      <ConfirmDialog
        visible={confirmVisible}
        title="Delete this entry?"
        message="This cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => setConfirmVisible(false)}
        onCancel={() => setConfirmVisible(false)}
      />

      <BottomSheet
        visible={sheetVisible}
        onClose={() => setSheetVisible(false)}
        title="Quick actions"
        subtitle="Bottom sheet built on the same modal system"
      >
        <ListItem title="Pin to top" leftIconName="i-pin" onPress={() => setSheetVisible(false)} />
        <ListItem title="Share" leftIconName="i-share" onPress={() => setSheetVisible(false)} />
        <ListItem title="Delete" leftIconName="i-trash" onPress={() => setSheetVisible(false)} />
      </BottomSheet>

      <LoadingOverlay visible={overlayVisible} label="Syncing…" />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    gap: spacing[4],
  },
  header: {
    marginBottom: spacing[1],
  },
  headerSubtitle: {
    marginTop: spacing[1],
  },
  headerMeta: {
    marginTop: spacing[2],
  },
  block: {
    overflow: 'hidden',
  },
  stack: {
    marginTop: spacing[4],
    gap: spacing[4],
  },
  chipRow: {
    marginTop: spacing[4],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    alignItems: 'center',
  },
  chipRowSpaced: {
    marginTop: spacing[3],
  },
  buttonRow: {
    marginTop: spacing[4],
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
    alignItems: 'center',
  },
  fullWidthButton: {
    marginTop: spacing[4],
  },
  progressBlock: {
    gap: spacing[3],
  },
  swatchGroup: {
    marginTop: spacing[4],
    gap: spacing[2],
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[3],
  },
  swatchCell: {
    width: 62,
    gap: spacing[1],
  },
  swatch: {
    height: 40,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing[3],
    justifyContent: 'flex-end',
  },
  footer: {
    marginTop: spacing[2],
    paddingHorizontal: spacing[4],
  },
});
