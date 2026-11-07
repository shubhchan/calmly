import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line } from 'react-native-svg';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import {
  AppText,
  Chip,
  DateRangePicker,
  formatDateRange,
  ScreenHeader,
  TactilePressable,
  type DateRange,
} from '../../components';
import { useAppTheme } from '../../theme/ThemeContext';
import { loadReflectionReport, MindNode, ReflectionReport, ReportPeriod } from '../../services/reflectionReport';

function Metric({ name, value, note }: { name: string; value: string; note: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.metric, { backgroundColor: colors.surface.default }]}>
      <AppText variant="caption" tone="tertiary">
        {name}
      </AppText>
      <AppText variant="h2" style={{ marginTop: 4 }}>
        {value}
      </AppText>
      <AppText variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
        {note}
      </AppText>
    </View>
  );
}

/** Relationships represent co-occurring terms and moods on the same calendar days. */
function MindMap({ report }: { report: ReflectionReport }) {
  const { colors } = useAppTheme();
  const [selected, setSelected] = useState<MindNode | null>(null);
  const nodes = report.nodes.slice(0, 12);
  const WIDTH = 320;
  const HEIGHT = 288;
  const CX = WIDTH / 2;
  const CY = HEIGHT / 2;
  const positioned = nodes.map((node, index) => {
    const angle = (index / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const radius = node.kind === 'mood' ? 85 : 115;
    return {
      ...node,
      x: CX + Math.cos(angle) * radius,
      y: CY + Math.sin(angle) * radius,
      r: Math.min(26, 12 + node.occurrences * 2),
    };
  });
  const locations = new Map(positioned.map((n) => [n.id, n]));
  const themeColor = colors.accents.peach;

  return (
    <View style={[styles.panel, { backgroundColor: colors.surface.default }]}>
      <View style={styles.row}>
        <AppText variant="title">Mind map</AppText>
        <Ionicons name="git-network-outline" size={20} color={colors.text.tertiary} />
      </View>
      <AppText variant="bodySmall" tone="secondary">
        Connections show moods and words recorded on the same day. Tap a node to read its count.
      </AppText>
      {!nodes.length ? (
        <AppText variant="bodySmall" tone="tertiary" style={{ paddingVertical: 24, textAlign: 'center' }}>
          Add check-ins or journal notes to grow your personal map.
        </AppText>
      ) : (
        <>
          <View style={styles.mapCanvas}>
            <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
              {report.links.map((link, i) => {
                const from = locations.get(link.from);
                const to = locations.get(link.to);
                if (!from || !to) return null;
                return (
                  <Line
                    key={i}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={colors.primary.default}
                    strokeWidth={Math.min(3, link.weight)}
                    opacity={0.18 + Math.min(0.4, link.weight * 0.1)}
                  />
                );
              })}
              {positioned.map((node) => (
                <Circle
                  key={node.id}
                  cx={node.x}
                  cy={node.y}
                  r={node.r + 4}
                  fill={node.kind === 'mood' ? colors.primary.default : themeColor}
                  opacity={0.12}
                />
              ))}
              {positioned.map((node) => (
                <Circle
                  key={`core-${node.id}`}
                  cx={node.x}
                  cy={node.y}
                  r={node.r}
                  fill={node.kind === 'mood' ? colors.primary.default : themeColor}
                  opacity={0.9}
                />
              ))}
            </Svg>
            {positioned.map((node) => (
              <TactilePressable
                key={node.id}
                accessibilityRole="button"
                accessibilityLabel={`${node.label}, ${node.occurrences} occurrences`}
                onPress={() => setSelected(node)}
                style={[styles.nodeTouch, { left: `${(node.x / WIDTH) * 100}%`, top: node.y - 24 }]}
              >
                <AppText
                  numberOfLines={1}
                  style={[styles.nodeLabel, { color: colors.primary.foreground }]}
                >
                  {node.label}
                </AppText>
              </TactilePressable>
            ))}
          </View>
          <AppText variant="caption" tone="tertiary" center>
            {selected
              ? `${selected.label}: ${selected.occurrences} ${
                  selected.kind === 'mood' ? 'check-in(s)' : 'day(s) mentioned'
                }`
              : 'Pine = feelings · Reed = journal themes'}
          </AppText>
        </>
      )}
    </View>
  );
}

export function ReflectionReportScreen({ navigation }: any) {
  const { colors } = useAppTheme();
  const [period, setPeriod] = useState<ReportPeriod>('week');
  const [customRange, setCustomRange] = useState<DateRange | null>(null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [report, setReport] = useState<ReflectionReport | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (period === 'custom' && !customRange) return;
    setBusy(true);
    setError('');
    try {
      setReport(await loadReflectionReport(period, customRange ?? undefined));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read your saved entries');
    } finally {
      setBusy(false);
    }
  }, [period, customRange]);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const applyCustomRange = (range: DateRange) => {
    setCustomRange(range);
    setPeriod('custom');
    setPickerVisible(false);
  };

  return (
    <ScreenContainer scroll={false} backgroundColor={colors.background.default} animate={false}>
      <ScreenHeader
        title="Your reflections"
        subtitle="Only your saved notes and check-ins"
        onBack={() => navigation.goBack()}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.rangeRow}>
          <Chip label="Week" selected={period === 'week'} onPress={() => setPeriod('week')} style={styles.rangeChip} />
          <Chip label="Month" selected={period === 'month'} onPress={() => setPeriod('month')} style={styles.rangeChip} />
          <Chip label="Custom" selected={period === 'custom'} onPress={() => setPickerVisible(true)} style={styles.rangeChip} />
        </View>

        {period === 'custom' && customRange ? (
          <AppText variant="caption" tone="tertiary" center>
            {formatDateRange(customRange)}
          </AppText>
        ) : null}

        {busy ? (
          <ActivityIndicator style={{ marginTop: 70 }} color={colors.primary.default} size="large" />
        ) : error ? (
          <View style={{ alignItems: 'center', paddingVertical: 48 }}>
            <AppText variant="body" tone="error" center>
              {error}
            </AppText>
            <TactilePressable onPress={refresh} style={{ paddingVertical: 12 }}>
              <AppText variant="label" tone="link">
                Try again
              </AppText>
            </TactilePressable>
          </View>
        ) : report ? (
          <>
            <View style={styles.metricGrid}>
              <Metric name="Days recorded" value={`${report.daysTracked}/${report.daysInPeriod}`} note="Any journal or mood" />
              <Metric name="Mood check-ins" value={String(report.moodCount)} note="Saved entries" />
              <Metric name="Daily notes" value={String(report.noteCount)} note="Journal reflections" />
              <Metric
                name="Average stress"
                value={report.averageStress === null ? '—' : `${report.averageStress}/10`}
                note="From rated check-ins"
              />
            </View>

            <MindMap key={`${period}-${customRange?.start ?? ''}-${customRange?.end ?? ''}`} report={report} />

            <View style={[styles.panel, { backgroundColor: colors.surface.default }]}>
              <AppText variant="title">Your daily rhythm</AppText>
              <AppText variant="bodySmall" tone="secondary">
                Each mark is a day with saved activity, not an inferred score.
              </AppText>
              <View style={styles.dayBarRow}>
                {report.daily.map((day, i) => (
                  <View key={day.date} style={styles.barColumn}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: Math.max(4, Math.min(68, (day.moods + day.notes) * 17)),
                          backgroundColor:
                            day.moods || day.notes ? colors.primary.default : colors.border.default,
                          opacity: day.moods || day.notes ? 1 : 0.5,
                        },
                      ]}
                    />
                    {(report.daily.length === 7 || i % 5 === 0 || i === report.daily.length - 1) && (
                      <AppText variant="caption" tone="tertiary" style={styles.dayLabel}>
                        {day.date.slice(-2)}
                      </AppText>
                    )}
                  </View>
                ))}
              </View>
              <AppText variant="bodySmall" tone="secondary">
                Mood frequency:{' '}
                {report.moodDistribution.slice(0, 4).map((x) => `${x.name} ${x.count}`).join(' · ') ||
                  'Not enough check-ins yet'}
              </AppText>
            </View>

            <View style={[styles.panel, { backgroundColor: colors.surface.default }]}>
              <AppText variant="title">Patterns worth noticing</AppText>
              {report.observations.map((observation, i) => (
                <View
                  key={i}
                  style={[
                    styles.observation,
                    { borderBottomColor: colors.border.default },
                  ]}
                >
                  <Ionicons name="leaf-outline" size={16} color={colors.text.tertiary} style={{ marginTop: 3 }} />
                  <AppText variant="bodySmall" tone="secondary" style={{ flex: 1 }}>
                    {observation}
                  </AppText>
                </View>
              ))}
              <AppText variant="caption" tone="tertiary" style={{ marginTop: 8 }}>
                Personal reflection only, not a diagnosis or clinical measure.
              </AppText>
            </View>

            <View style={[styles.panel, { backgroundColor: colors.surface.default }]}>
              <AppText variant="title">Recent journal reflections</AppText>
              {report.recentNotes.length ? (
                report.recentNotes.map((note) => (
                  <View
                    key={note.id || `${note.createdAt}`}
                    style={[styles.note, { borderBottomColor: colors.border.default }]}
                  >
                    <AppText variant="caption" tone="tertiary">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </AppText>
                    <AppText variant="body" style={{ marginTop: 2 }}>
                      {note.title || note.type.replace(/_/g, ' ') || 'Daily note'}
                    </AppText>
                    <AppText variant="bodySmall" tone="secondary" numberOfLines={3} style={{ marginTop: 2 }}>
                      {note.body}
                    </AppText>
                  </View>
                ))
              ) : (
                <AppText variant="bodySmall" tone="tertiary" style={{ paddingVertical: 20, textAlign: 'center' }}>
                  Your saved daily notes will appear here.
                </AppText>
              )}
            </View>
          </>
        ) : null}
      </ScrollView>

      <DateRangePicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onApply={applyCustomRange}
        initialRange={customRange ?? undefined}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 48, gap: 20 },
  rangeRow: { flexDirection: 'row', gap: 8 },
  rangeChip: { flex: 1 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metric: { width: '48%', flexGrow: 1, padding: 16, borderRadius: 20, gap: 2 },
  panel: { borderRadius: 20, padding: 20, gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mapCanvas: { height: 288, width: '100%', overflow: 'hidden' },
  nodeTouch: { position: 'absolute', marginLeft: -43, width: 86, height: 48, justifyContent: 'center', alignItems: 'center' },
  nodeLabel: { fontSize: 10, fontWeight: '600', textAlign: 'center', textTransform: 'capitalize' },
  dayBarRow: { height: 88, flexDirection: 'row', alignItems: 'flex-end', gap: 3, marginVertical: 4 },
  barColumn: { flex: 1, height: 80, alignItems: 'center', justifyContent: 'flex-end', gap: 3 },
  bar: { width: '90%', maxWidth: 16, borderRadius: 5 },
  dayLabel: { fontSize: 9, lineHeight: 12 },
  observation: { flexDirection: 'row', gap: 10, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  note: { paddingVertical: 12, gap: 1, borderBottomWidth: StyleSheet.hairlineWidth },
});
