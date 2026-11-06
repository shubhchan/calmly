import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Line } from 'react-native-svg';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import {
  Chip,
  DateRangePicker,
  formatDateRange,
  ScreenHeader,
  TactilePressable,
  type DateRange,
} from '../../components';
import { useAppTheme } from '../../theme/ThemeContext';
import { fontFamilies } from '../../theme/typography';
import { loadReflectionReport, MindNode, ReflectionReport, ReportPeriod } from '../../services/reflectionReport';

function Metric({ name, value, note, color }: { name: string; value: string; note: string; color: any }) {
  const { colors } = useAppTheme();
  return <View style={[styles.metric, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}>
    <Text style={[styles.metricName, { color: colors.text.secondary }]}>{name}</Text>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
    <Text style={[styles.metricNote, { color: colors.text.tertiary }]}>{note}</Text>
  </View>;
}

/** Relationships represent co-occurring terms and moods on the same calendar days. */
function MindMap({ report }: { report: ReflectionReport }) {
  const { colors } = useAppTheme();
  const [selected, setSelected] = useState<MindNode | null>(null);
  const nodes = report.nodes.slice(0, 12);
  const WIDTH = 320; const HEIGHT = 288; const CX = WIDTH / 2; const CY = HEIGHT / 2;
  const positioned = nodes.map((node, index) => {
    const angle = (index / Math.max(nodes.length, 1)) * Math.PI * 2 - Math.PI / 2;
    const radius = node.kind === 'mood' ? 85 : 115;
    return { ...node, x: CX + Math.cos(angle) * radius, y: CY + Math.sin(angle) * radius, r: Math.min(26, 12 + node.occurrences * 2) };
  });
  const locations = new Map(positioned.map(n => [n.id, n]));
  return <View style={[styles.panel, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}>
    <View style={styles.row}><Text style={[styles.panelTitle, { color: colors.text.primary }]}>Mind map</Text><Ionicons name="git-network-outline" size={22} color={colors.primary.default} /></View>
    <Text style={[styles.caption, { color: colors.text.secondary }]}>Connections show moods and words recorded on the same day. Tap a node to explore its count.</Text>
    {!nodes.length ? <Text style={[styles.empty, { color: colors.text.tertiary }]}>Add check-ins or journal notes to grow your personal map.</Text> : <>
      <View style={styles.mapCanvas}>
        <Svg width="100%" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
          {report.links.map((link, i) => {
            const from = locations.get(link.from); const to = locations.get(link.to);
            if (!from || !to) return null;
            return <Line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={colors.primary.default} strokeWidth={Math.min(3, link.weight)} opacity={0.2 + Math.min(0.5, link.weight * 0.1)} />;
          })}
          {positioned.map(node => <Circle key={node.id} cx={node.x} cy={node.y} r={node.r + 4} fill={node.kind === 'mood' ? colors.primary.default : colors.accents.lavender} opacity={0.13} />)}
          {positioned.map(node => <Circle key={`core-${node.id}`} cx={node.x} cy={node.y} r={node.r} fill={node.kind === 'mood' ? colors.primary.default : colors.accents.lavender} opacity={0.9} />)}
        </Svg>
        {positioned.map(node => <TactilePressable key={node.id} accessibilityRole="button" accessibilityLabel={`${node.label}, ${node.occurrences} occurrences`} onPress={() => setSelected(node)} style={[styles.nodeTouch, { left: `${(node.x / WIDTH) * 100}%`, top: node.y - 24 }]}>
          <Text numberOfLines={1} style={styles.nodeLabel}>{node.label}</Text>
        </TactilePressable>)}
      </View>
      <Text style={[styles.caption, { color: colors.text.secondary, textAlign: 'center' }]}>{selected ? `${selected.label}: ${selected.occurrences} ${selected.kind === 'mood' ? 'check-in(s)' : 'day(s) mentioned'}` : 'Green = emotions  ·  Lavender = journal themes'}</Text>
    </>}
  </View>;
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
    setBusy(true); setError('');
    try { setReport(await loadReflectionReport(period, customRange ?? undefined)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Could not read your saved entries'); }
    finally { setBusy(false); }
  }, [period, customRange]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const applyCustomRange = (range: DateRange) => {
    setCustomRange(range);
    setPeriod('custom');
    setPickerVisible(false);
  };

  return <ScreenContainer scroll={false} backgroundColor={colors.background.default} animate={false}>
    <ScreenHeader title="Your reflections" subtitle="Only your saved notes and check-ins" onBack={() => navigation.goBack()} />
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.rangeRow}>
        <Chip label="Week" selected={period === 'week'} onPress={() => setPeriod('week')} style={styles.rangeChip} />
        <Chip label="Month" selected={period === 'month'} onPress={() => setPeriod('month')} style={styles.rangeChip} />
        <Chip label="Custom" selected={period === 'custom'} onPress={() => setPickerVisible(true)} style={styles.rangeChip} />
      </View>
      {period === 'custom' && customRange ? (
        <Text style={[styles.rangeCaption, { color: colors.text.tertiary }]}>
          {formatDateRange(customRange)}
        </Text>
      ) : null}
      {busy ? <ActivityIndicator style={{ marginTop: 70 }} color={colors.primary.default} size="large" /> : error ? <View style={styles.panel}><Text style={{ color: colors.accents.rose }}>{error}</Text><TactilePressable onPress={refresh}><Text style={{ color: colors.primary.default }}>Try again</Text></TactilePressable></View> : report && <>
        <View style={styles.metricGrid}>
          <Metric name="Days recorded" value={`${report.daysTracked}/${report.daysInPeriod}`} note="Any journal or mood" color={colors.primary.default} />
          <Metric name="Mood check-ins" value={String(report.moodCount)} note="Saved entries" color={colors.accents.lavender} />
          <Metric name="Daily notes" value={String(report.noteCount)} note="Journal reflections" color={colors.accents.sky} />
          <Metric name="Average stress" value={report.averageStress === null ? '—' : `${report.averageStress}/10`} note="From rated check-ins" color={colors.accents.rose} />
        </View>
        <MindMap key={`${period}-${customRange?.start ?? ''}-${customRange?.end ?? ''}`} report={report} />
        <View style={[styles.panel, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}>
          <Text style={[styles.panelTitle, { color: colors.text.primary }]}>Your daily rhythm</Text>
          <Text style={[styles.caption, { color: colors.text.secondary }]}>Each mark represents a day with saved activity, not an inferred score.</Text>
          <View style={styles.dayBarRow}>
            {report.daily.map((day, i) => <View key={day.date} style={styles.barColumn}>
              <View style={[styles.bar, { height: Math.max(4, Math.min(68, (day.moods + day.notes) * 17)), backgroundColor: day.moods || day.notes ? colors.primary.default : colors.border.default, opacity: day.moods || day.notes ? 1 : 0.5 }]} />
              {(report.daily.length === 7 || i % 5 === 0 || i === report.daily.length - 1) && <Text style={[styles.dayLabel, { color: colors.text.tertiary }]}>{day.date.slice(-2)}</Text>}
            </View>)}
          </View>
          <Text style={[styles.caption, { color: colors.text.secondary }]}>Mood frequency: {report.moodDistribution.slice(0, 4).map(x => `${x.name} ${x.count}`).join(' · ') || 'Not enough check-ins yet'}</Text>
        </View>
        <View style={[styles.panel, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}>
          <Text style={[styles.panelTitle, { color: colors.text.primary }]}>Patterns worth noticing</Text>
          {report.observations.map((observation, i) => <View key={i} style={[styles.observation, { borderBottomColor: colors.border.default }]}><Ionicons name="leaf-outline" size={17} color={colors.primary.default} /><Text style={[styles.observationText, { color: colors.text.secondary }]}>{observation}</Text></View>)}
          <Text style={[styles.caption, { color: colors.text.tertiary, marginTop: 8 }]}>Personal reflection only, not a diagnosis or clinical measure.</Text>
        </View>
        <View style={[styles.panel, { backgroundColor: colors.surface.default, borderColor: colors.border.default }]}>
          <Text style={[styles.panelTitle, { color: colors.text.primary }]}>Recent journal reflections</Text>
          {report.recentNotes.length ? report.recentNotes.map(note => <View key={note.id || `${note.createdAt}`} style={[styles.note, { borderBottomColor: colors.border.default }]}>
            <Text style={{ color: colors.text.tertiary, fontSize: 12 }}>{new Date(note.createdAt).toLocaleDateString()}</Text>
            <Text style={[styles.noteTitle, { color: colors.text.primary }]}>{note.title || note.type.replace(/_/g, ' ') || 'Daily note'}</Text>
            <Text numberOfLines={3} style={{ color: colors.text.secondary, lineHeight: 20 }}>{note.body}</Text>
          </View>) : <Text style={[styles.empty, { color: colors.text.tertiary }]}>Your saved daily notes will appear here.</Text>}
        </View>
      </>}
    </ScrollView>
    <DateRangePicker
      visible={pickerVisible}
      onClose={() => setPickerVisible(false)}
      onApply={applyCustomRange}
      initialRange={customRange ?? undefined}
    />
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 120, gap: 18 },
  rangeRow: { flexDirection: 'row', gap: 8 },
  rangeChip: { flex: 1 },
  rangeCaption: { fontSize: 12, textAlign: 'center', marginTop: -8 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  metric: { width: '48%', flexGrow: 1, padding: 15, borderRadius: 18, borderWidth: 1, gap: 5 },
  metricName: { fontSize: 12, fontWeight: '600' }, metricValue: { fontSize: 26, fontWeight: '800' }, metricNote: { fontSize: 11 },
  panel: { borderRadius: 20, borderWidth: 1, padding: 18, gap: 12 },
  panelTitle: { fontSize: 20, fontFamily: fontFamilies.serif.bold, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  caption: { fontSize: 12, lineHeight: 18 }, empty: { fontSize: 14, textAlign: 'center', paddingVertical: 22 },
  mapCanvas: { height: 288, width: '100%', overflow: 'hidden' },
  nodeTouch: { position: 'absolute', marginLeft: -43, width: 86, height: 48, justifyContent: 'center', alignItems: 'center' },
  nodeLabel: { color: '#FFFFFF', fontSize: 10, fontWeight: '800', textAlign: 'center', textTransform: 'capitalize' },
  dayBarRow: { height: 88, flexDirection: 'row', alignItems: 'flex-end', gap: 3, marginVertical: 10 },
  barColumn: { flex: 1, height: 80, alignItems: 'center', justifyContent: 'flex-end', gap: 3 },
  bar: { width: '90%', maxWidth: 16, borderRadius: 5 }, dayLabel: { height: 12, fontSize: 9 },
  observation: { flexDirection: 'row', gap: 10, paddingBottom: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  observationText: { fontSize: 14, lineHeight: 21, flex: 1 },
  note: { paddingVertical: 11, gap: 5, borderBottomWidth: StyleSheet.hairlineWidth }, noteTitle: { fontSize: 15, fontWeight: '700', textTransform: 'capitalize' },
});
