import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  addMonths,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from 'date-fns';
import { borderWidths, radius, spacing } from '../../theme/tokens';
import { useAppTheme } from '../../theme/ThemeContext';
import { TactilePressable } from '../interactive/TactilePressable';
import { AppText } from './AppText';
import { Button } from './Button';
import { IconButton } from './IconButton';
import { Modal } from './Modal';

export interface DateRange {
  start: number;
  end: number;
}

export interface DateRangePickerProps {
  visible: boolean;
  onClose: () => void;
  onApply: (range: DateRange) => void;
  initialRange?: DateRange;
  title?: string;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** Compact inclusive date range label, e.g. `Mar 1, 2026 – Mar 14, 2026`. */
export function formatDateRange(range: DateRange): string {
  return `${format(new Date(range.start), 'MMM d, yyyy')} – ${format(new Date(range.end), 'MMM d, yyyy')}`;
}

/**
 * Calendar range picker. Tap the first day, then the last day, then apply.
 * Future days are disabled and past months stay reachable.
 */
export function DateRangePicker({
  visible,
  onClose,
  onApply,
  initialRange,
  title = 'Custom range',
}: DateRangePickerProps) {
  const { colors } = useAppTheme();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);

  useEffect(() => {
    if (!visible) return;
    const nextStart = initialRange ? new Date(initialRange.start) : subDays(new Date(), 29);
    const nextEnd = initialRange ? new Date(initialRange.end) : new Date();
    setStart(startOfDay(nextStart));
    setEnd(startOfDay(nextEnd));
    setMonth(startOfMonth(nextEnd));
  }, [visible, initialRange]);

  const today = startOfDay(new Date());
  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfWeek(startOfMonth(month)),
        end: endOfWeek(endOfMonth(month)),
      }),
    [month]
  );

  const canGoForward = isBefore(month, startOfMonth(today));

  const selectDay = (day: Date) => {
    const value = startOfDay(day);
    if (isAfter(value, today)) return;
    if (!start || (start && end)) {
      setStart(value);
      setEnd(null);
      return;
    }
    if (isBefore(value, start)) {
      setStart(value);
      setEnd(null);
      return;
    }
    setEnd(value);
  };

  const apply = () => {
    if (!start) return;
    const last = end ?? start;
    onApply({ start: start.getTime(), end: endOfDay(last).getTime() });
  };

  return (
    <Modal visible={visible} onClose={onClose} position="center" title={title} scrollable>
      <View style={styles.body}>
        <View style={styles.monthRow}>
          <IconButton
            icon="i-chevron-back"
            accessibilityLabel="Previous month"
            variant="ghost"
            size="sm"
            onPress={() => setMonth((current) => subMonths(current, 1))}
          />
          <AppText variant="label">{format(month, 'MMMM yyyy')}</AppText>
          <IconButton
            icon="i-chevron-forward"
            accessibilityLabel="Next month"
            variant="ghost"
            size="sm"
            disabled={!canGoForward}
            onPress={() => setMonth((current) => addMonths(current, 1))}
          />
        </View>

        <View style={styles.weekdays}>
          {WEEKDAYS.map((label, index) => (
            <View key={`${label}-${index}`} style={styles.weekdayCell}>
              <AppText variant="caption" tone="tertiary">
                {label}
              </AppText>
            </View>
          ))}
        </View>

        <View style={styles.grid}>
          {days.map((day) => {
            const isStart = !!start && day.getTime() === start.getTime();
            const isEnd = !!end && day.getTime() === end.getTime();
            const isEdge = isStart || isEnd;
            const inRange = !!start && day.getTime() >= start.getTime() && day.getTime() <= (end ?? start).getTime();
            const outside = !isSameMonth(day, month);
            const future = isAfter(day, today);

            const ink = isEdge
              ? colors.primary.foreground
              : future
                ? colors.text.disabled
                : outside
                  ? colors.text.tertiary
                  : inRange
                    ? colors.primary.default
                    : colors.text.primary;

            return (
              <TactilePressable
                key={day.toISOString()}
                onPress={() => selectDay(day)}
                disabled={future}
                hapticStyle="selection"
                accessibilityRole="button"
                accessibilityLabel={format(day, 'MMMM d, yyyy')}
                accessibilityState={{ selected: inRange, disabled: future }}
                scaleDownTo={0.92}
                style={styles.dayCell}
              >
                <View
                  style={[
                    styles.dayCircle,
                    isEdge && { backgroundColor: colors.primary.default },
                    inRange && !isEdge && { backgroundColor: colors.primary.subtle },
                    !inRange && { backgroundColor: 'transparent' },
                  ]}
                >
                  <AppText variant="bodySmall" color={ink} style={outside && !isEdge ? styles.outsideText : undefined}>
                    {format(day, 'd')}
                  </AppText>
                </View>
              </TactilePressable>
            );
          })}
        </View>

        <AppText variant="caption" tone="tertiary">
          {start
            ? end
              ? formatDateRange({ start: start.getTime(), end: end.getTime() })
              : `${format(start, 'MMM d, yyyy')} – tap the last day`
            : 'Tap the first day of your range'}
        </AppText>

        <Button title="Apply range" onPress={apply} disabled={!start} fullWidth />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: spacing[3],
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weekdays: {
    flexDirection: 'row',
  },
  weekdayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borderWidths.thin,
    borderColor: 'transparent',
  },
  outsideText: {
    opacity: 0.6,
  },
});
