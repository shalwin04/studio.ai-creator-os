/**
 * Calendar/Schedule Screen
 *
 * Dark racing style: Upcoming events with countdown, schedule list
 */

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { colors, spacing, typography, radius, layout, shadows } from '../../../src/theme';

interface ScheduleItem {
  id: string;
  day: string;
  month: string;
  title: string;
  type: string;
  location: string;
  locationColor: string;
}

const NEXT_EVENT = {
  type: 'Upload',
  title: 'AI Tips Video',
  location: 'YouTube',
  date: '21 - 23 Aug',
  countdown: { days: 11, hours: 0, minutes: 28 },
};

const SCHEDULE: ScheduleItem[] = [
  { id: '1', day: '06', month: 'Sep', title: 'Supabase Tutorial', type: 'Publish', location: 'YouTube', locationColor: colors.ferrari },
  { id: '2', day: '13', month: 'Sep', title: 'Studio Setup Vlog', type: 'Film', location: 'Studio', locationColor: colors.mclaren },
  { id: '3', day: '26', month: 'Sep', title: 'React Native Guide', type: 'Edit', location: 'Post', locationColor: colors.teal },
  { id: '4', day: '04', month: 'Oct', title: 'Sponsor Meeting', type: 'Call', location: 'Zoom', locationColor: colors.accent },
  { id: '5', day: '11', month: 'Oct', title: 'Year Review Video', type: 'Plan', location: 'Notion', locationColor: colors.lime },
];

export default function CalendarScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Upcoming Events</Text>
              <TouchableOpacity style={styles.dropdownButton}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2}>
                  <Path d="M6 9l6 6 6-6" />
                </Svg>
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Card - Next Event */}
          <View style={styles.heroCard}>
            <LinearGradient
              colors={['#FF8C00', '#FF5722']}
              style={styles.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroHeader}>
                <Text style={styles.heroType}>{NEXT_EVENT.type}</Text>
                <Text style={styles.heroTitle}>{NEXT_EVENT.title}</Text>
                <Text style={styles.heroLocation}>{NEXT_EVENT.location}</Text>
                <Text style={styles.heroDate}>{NEXT_EVENT.date}</Text>
              </View>

              <View style={styles.countdownSection}>
                <Text style={styles.countdownLabel}>Next Upload in</Text>
                <View style={styles.countdownRow}>
                  <CountdownUnit value={NEXT_EVENT.countdown.days} label="Days" />
                  <CountdownUnit value={NEXT_EVENT.countdown.hours} label="Hours" />
                  <CountdownUnit value={NEXT_EVENT.countdown.minutes} label="Minutes" />
                </View>
              </View>

              <TouchableOpacity style={styles.scheduleButton} activeOpacity={0.8}>
                <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2}>
                  <Path d="M5 12h14M12 5l7 7-7 7" />
                </Svg>
                <Text style={styles.scheduleButtonText}>Schedule</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Schedule List */}
          <View style={styles.scheduleSection}>
            {SCHEDULE.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.scheduleItem, index === SCHEDULE.length - 1 && { borderBottomWidth: 0 }]}
                activeOpacity={0.7}
              >
                <View style={styles.scheduleDate}>
                  <Text style={styles.scheduleDateDay}>{item.day}</Text>
                  <Text style={styles.scheduleDateMonth}>{item.month}</Text>
                </View>
                <View style={styles.scheduleInfo}>
                  <Text style={styles.scheduleTitle}>{item.title}</Text>
                  <Text style={styles.scheduleType}>
                    {item.type} • <Text style={{ color: item.locationColor }}>{item.location}</Text>
                  </Text>
                </View>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.textTertiary} strokeWidth={1.5}>
                  <Path d="M9 18l6-6-6-6" />
                </Svg>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Add Section */}
          <View style={styles.quickAddSection}>
            <Text style={styles.sectionTitle}>Quick Add</Text>
            <View style={styles.quickAddGrid}>
              <QuickAddButton icon="video" label="Film Day" color={colors.accent} />
              <QuickAddButton icon="edit" label="Edit Session" color={colors.orange} />
              <QuickAddButton icon="upload" label="Publish" color={colors.teal} />
              <QuickAddButton icon="call" label="Meeting" color={colors.lime} />
            </View>
          </View>

          {/* Bottom padding */}
          <View style={{ height: layout.tabBarHeight + layout.tabBarBottom + 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ============================================
// COMPONENTS
// ============================================

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.countdownUnit}>
      <Text style={styles.countdownValue}>{String(value).padStart(2, '0')}</Text>
      <Text style={styles.countdownUnitLabel}>{label}</Text>
    </View>
  );
}

function QuickAddButton({ icon, label, color }: { icon: string; label: string; color: string }) {
  const icons: Record<string, React.ReactNode> = {
    video: (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <Path d="M23 7l-7 5 7 5V7z" />
        <Rect x={1} y={5} width={15} height={14} rx={2} />
      </Svg>
    ),
    edit: (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <Path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
        <Path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
      </Svg>
    ),
    upload: (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <Path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
      </Svg>
    ),
    call: (
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <Path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
      </Svg>
    ),
  };

  return (
    <TouchableOpacity style={styles.quickAddButton} activeOpacity={0.7}>
      <View style={[styles.quickAddIcon, { backgroundColor: `${color}15` }]}>
        {icons[icon]}
      </View>
      <Text style={styles.quickAddLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
  },

  // Header
  header: {
    paddingVertical: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  dropdownButton: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hero Card
  heroCard: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    marginBottom: 20,
  },
  heroGradient: {
    padding: 24,
  },
  heroHeader: {
    marginBottom: 20,
  },
  heroType: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  heroLocation: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.orange,
  },
  heroDate: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  countdownSection: {
    marginBottom: 20,
  },
  countdownLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 10,
  },
  countdownRow: {
    flexDirection: 'row',
    gap: 16,
  },
  countdownUnit: {
    alignItems: 'flex-start',
  },
  countdownValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -1,
  },
  countdownUnitLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
    gap: 8,
  },
  scheduleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },

  // Schedule List
  scheduleSection: {
    backgroundColor: colors.surface,
    borderRadius: radius['2xl'],
    padding: 4,
    marginBottom: 24,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  scheduleDate: {
    width: 44,
    marginRight: 16,
  },
  scheduleDateDay: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  scheduleDateMonth: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  scheduleType: {
    fontSize: 13,
    color: colors.textTertiary,
  },

  // Quick Add
  quickAddSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  quickAddGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAddButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  quickAddIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
});
