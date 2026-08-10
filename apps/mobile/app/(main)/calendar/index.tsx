/**
 * Calendar Screen
 *
 * Fintech-inspired: Clean calendar with event cards
 */

import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { colors, spacing, typography, radius, layout, shadows } from '../../../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_SIZE = (SCREEN_WIDTH - layout.screenPadding * 2 - 48) / 7;

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

// Mock events
const EVENTS: Record<string, Array<{
  id: string;
  title: string;
  time: string;
  type: 'film' | 'edit' | 'publish' | 'deal' | 'meeting';
}>> = {
  '2024-7-15': [
    { id: '1', title: 'React Native Tips', time: '10:00 AM', type: 'publish' },
    { id: '2', title: 'Film: AI Review', time: '2:00 PM', type: 'film' },
  ],
  '2024-7-16': [
    { id: '3', title: 'Edit: Vlog Episode', time: '11:00 AM', type: 'edit' },
  ],
  '2024-7-18': [
    { id: '4', title: 'Northwind Call', time: '3:00 PM', type: 'meeting' },
  ],
  '2024-7-20': [
    { id: '5', title: 'Supabase Deadline', time: '5:00 PM', type: 'deal' },
  ],
  '2024-7-22': [
    { id: '6', title: 'Setup Tour Film', time: '1:00 PM', type: 'film' },
    { id: '7', title: 'Edit: Tips Video', time: '4:00 PM', type: 'edit' },
  ],
};

export default function CalendarScreen() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date(2024, 7, 15));
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(2024, 7, 15));

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: Array<{ date: number; isCurrentMonth: boolean; dateObj: Date }> = [];

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      days.push({
        date: prevMonthLastDay - i,
        isCurrentMonth: false,
        dateObj: new Date(year, month - 1, prevMonthLastDay - i),
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: i,
        isCurrentMonth: true,
        dateObj: new Date(year, month, i),
      });
    }

    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        date: i,
        isCurrentMonth: false,
        dateObj: new Date(year, month + 1, i),
      });
    }

    return days;
  }, [currentDate]);

  const selectedDateKey = selectedDate
    ? `${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`
    : null;

  const selectedEvents = selectedDateKey ? EVENTS[selectedDateKey] || [] : [];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const hasEvents = (date: Date) => {
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    return EVENTS[key] && EVENTS[key].length > 0;
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  const isToday = (date: Date) => {
    const today = new Date(2024, 7, 15);
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'film': return colors.info;
      case 'edit': return colors.warning;
      case 'publish': return colors.teal;
      case 'deal': return colors.error;
      case 'meeting': return colors.accent;
      default: return colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2}>
              <Path d="M15 18l-6-6 6-6" />
            </Svg>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5}>
                <Rect x={3} y={3} width={7} height={7} rx={1} />
                <Rect x={14} y={3} width={7} height={7} rx={1} />
                <Rect x={3} y={14} width={7} height={7} rx={1} />
                <Rect x={14} y={14} width={7} height={7} rx={1} />
              </Svg>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5}>
                <Path d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <Path d="M13.73 21a2 2 0 01-3.46 0" />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>

        {/* Calendar Card */}
        <View style={styles.calendarCard}>
          {/* Month Navigation */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={goToPreviousMonth} style={styles.navArrow}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2}>
                <Path d="M15 18l-6-6 6-6" />
              </Svg>
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </Text>
            <TouchableOpacity onPress={goToNextMonth} style={styles.navArrow}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2}>
                <Path d="M9 18l6-6-6-6" />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((day, index) => (
              <View key={index} style={styles.weekdayCell}>
                <Text style={styles.weekdayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Days Grid */}
          <View style={styles.daysGrid}>
            {calendarDays.map((day, index) => {
              const selected = isSelected(day.dateObj);
              const today = isToday(day.dateObj);
              const hasEvent = hasEvents(day.dateObj);

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    selected && styles.dayCellSelected,
                  ]}
                  onPress={() => setSelectedDate(day.dateObj)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.dayText,
                    !day.isCurrentMonth && styles.dayTextInactive,
                    selected && styles.dayTextSelected,
                    today && !selected && styles.dayTextToday,
                  ]}>
                    {day.date}
                  </Text>
                  {hasEvent && !selected && (
                    <View style={styles.eventDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Events Section */}
        <View style={styles.eventsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedDate?.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
            <TouchableOpacity style={styles.addEventButton}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2}>
                <Path d="M12 5v14M5 12h14" />
              </Svg>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.eventsList}
            contentContainerStyle={styles.eventsContent}
            showsVerticalScrollIndicator={false}
          >
            {selectedEvents.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyIcon}>
                  <Svg width={32} height={32} viewBox="0 0 24 24" fill="none" stroke={colors.neutral400} strokeWidth={1}>
                    <Rect x={3} y={4} width={18} height={18} rx={2} />
                    <Path d="M16 2v4M8 2v4M3 10h18" />
                  </Svg>
                </View>
                <Text style={styles.emptyText}>No events scheduled</Text>
                <TouchableOpacity style={styles.emptyButton}>
                  <Text style={styles.emptyButtonText}>Add Event</Text>
                </TouchableOpacity>
              </View>
            ) : (
              selectedEvents.map((event) => (
                <TouchableOpacity key={event.id} style={styles.eventCard} activeOpacity={0.7}>
                  <View style={[styles.eventIndicator, { backgroundColor: getEventColor(event.type) }]} />
                  <View style={styles.eventContent}>
                    <Text style={styles.eventTitle}>{event.title}</Text>
                    <Text style={styles.eventTime}>{event.time}</Text>
                  </View>
                  <TouchableOpacity style={styles.eventMore}>
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textTertiary} strokeWidth={1.5}>
                      <Circle cx={12} cy={12} r={1} />
                      <Circle cx={19} cy={12} r={1} />
                      <Circle cx={5} cy={12} r={1} />
                    </Svg>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}

            <View style={{ height: layout.tabBarHeight + layout.tabBarBottom + 20 }} />
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.screenPadding,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },

  // Calendar Card
  calendarCard: {
    backgroundColor: colors.surface,
    marginHorizontal: layout.screenPadding,
    borderRadius: radius['2xl'],
    padding: 20,
    marginBottom: 16,
    ...shadows.sm,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  navArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    width: DAY_SIZE,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: DAY_SIZE,
    height: DAY_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
    position: 'relative',
  },
  dayCellSelected: {
    backgroundColor: colors.accent,
  },
  dayText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  dayTextInactive: {
    color: colors.textDisabled,
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dayTextToday: {
    color: colors.teal,
    fontWeight: '700',
  },
  eventDot: {
    position: 'absolute',
    bottom: 6,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.teal,
  },

  // Events Section
  eventsSection: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    marginHorizontal: layout.screenPadding,
    paddingTop: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  addEventButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventsList: {
    flex: 1,
  },
  eventsContent: {
    paddingHorizontal: 20,
    gap: 10,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: colors.textTertiary,
  },
  emptyButton: {
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: radius.lg,
    marginTop: 4,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },

  // Event Card
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: 14,
    gap: 12,
  },
  eventIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  eventTime: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 2,
  },
  eventMore: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
