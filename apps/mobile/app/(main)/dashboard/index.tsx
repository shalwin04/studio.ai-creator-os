/**
 * Dashboard - Home Screen
 *
 * Dark racing style: Hero stats, progress rings, bold typography
 */

import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, spacing, radius, layout, shadows } from '../../../src/theme';

const USER = {
  name: 'James',
  fullName: 'James Chen',
};

const HERO_STATS = {
  totalViews: '2.4M',
  change: '+12%',
  videos: 6,
  hours: 42,
};

const ACTIVITY = [
  { id: '1', type: 'video', title: 'New video published', subtitle: 'How I Built This App', time: '2h ago', color: colors.teal },
  { id: '2', type: 'milestone', title: 'Milestone reached', subtitle: '100K subscribers!', time: '1d ago', color: colors.orange },
  { id: '3', type: 'deal', title: 'Deal expires soon', subtitle: 'Northwind Audio · $3,500', time: '1d left', color: colors.red },
];

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName}>{USER.name}</Text>
            </View>
            <TouchableOpacity style={styles.profileButton}>
              <Text style={styles.profileInitial}>J</Text>
            </TouchableOpacity>
          </View>

          {/* Hero Stats Card */}
          <View style={styles.heroCard}>
            <LinearGradient
              colors={['#1E3A5F', '#0D1B2A']}
              style={styles.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.heroLabel}>TOTAL VIEWS THIS MONTH</Text>
              <View style={styles.heroValueRow}>
                <Text style={styles.heroValue}>{HERO_STATS.totalViews}</Text>
                <View style={styles.heroTrend}>
                  <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.teal} strokeWidth={2.5}>
                    <Path d="M18 15l-6-6-6 6" />
                  </Svg>
                  <Text style={styles.heroTrendText}>{HERO_STATS.change}</Text>
                </View>
              </View>

              {/* Mini Chart */}
              <View style={styles.miniChart}>
                {[0.4, 0.6, 0.5, 0.8, 0.7, 0.9, 0.75, 1, 0.85, 0.6].map((h, i) => (
                  <View key={i} style={[styles.chartBar, { height: h * 32 }]} />
                ))}
              </View>

              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>0{HERO_STATS.videos}</Text>
                  <Text style={styles.heroStatLabel}>Videos</Text>
                </View>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatValue}>{HERO_STATS.hours}</Text>
                  <Text style={styles.heroStatLabel}>Hours</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* Progress Section */}
          <View style={styles.progressSection}>
            <ProgressRing percentage={47} color={colors.accent} />
            <View style={styles.progressStats}>
              <ProgressStat value="11/23" label="Videos Published" />
              <ProgressStat value="3.3M" label="Total Views" />
              <ProgressStat value="675" label="Hours Watched" />
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <QuickAction icon="video" label="New Video" color={colors.accent} />
              <QuickAction icon="idea" label="Add Idea" color={colors.orange} />
              <QuickAction icon="analytics" label="Analytics" color={colors.teal} />
              <QuickAction icon="schedule" label="Schedule" color={colors.lime} />
            </View>
          </View>

          {/* AI Assistant Card */}
          <TouchableOpacity
            style={styles.aiCard}
            activeOpacity={0.9}
            onPress={() => router.push('/(main)/chat')}
          >
            <LinearGradient
              colors={[colors.lime, '#A8E000']}
              style={styles.aiGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.aiContent}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.background} strokeWidth={2}>
                  <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </Svg>
                <Text style={styles.aiTitle}>Ask AI Assistant</Text>
              </View>
              <Text style={styles.aiDescription}>
                Get personalized insights about your channel performance.
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Recent Activity */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity>
                <Text style={styles.viewAll}>View all</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.activityList}>
              {ACTIVITY.map((item, index) => (
                <View key={item.id} style={[styles.activityItem, index === ACTIVITY.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={[styles.activityIcon, { backgroundColor: `${item.color}20` }]}>
                    <View style={[styles.activityDot, { backgroundColor: item.color }]} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{item.title}</Text>
                    <Text style={styles.activitySubtitle}>{item.subtitle}</Text>
                  </View>
                  <Text style={styles.activityTime}>{item.time}</Text>
                </View>
              ))}
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

function ProgressRing({ percentage, color }: { percentage: number; color: string }) {
  const size = 100;
  const strokeWidth = 8;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={styles.progressRing}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.surfaceElevated}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.progressRingContent}>
        <Text style={styles.progressRingValue}>{percentage}%</Text>
      </View>
    </View>
  );
}

function ProgressStat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.progressStatItem}>
      <Text style={styles.progressStatValue}>{value}</Text>
      <Text style={styles.progressStatLabel}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, color }: { icon: string; label: string; color: string }) {
  const icons: Record<string, React.ReactNode> = {
    video: (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <Path d="M23 7l-7 5 7 5V7z" />
        <Rect x={1} y={5} width={15} height={14} rx={2} />
      </Svg>
    ),
    idea: (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <Path d="M9 18h6M10 22h4" />
        <Path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14" />
      </Svg>
    ),
    analytics: (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <Path d="M18 20V10M12 20V4M6 20v-6" />
      </Svg>
    ),
    schedule: (
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <Rect x={3} y={4} width={18} height={18} rx={2} />
        <Path d="M16 2v4M8 2v4M3 10h18" />
      </Svg>
    ),
  };

  return (
    <TouchableOpacity style={styles.quickAction} activeOpacity={0.7}>
      <View style={[styles.quickActionIcon, { backgroundColor: `${color}15` }]}>
        {icons[icon]}
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
  },
  greeting: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },

  // Hero Card
  heroCard: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroGradient: {
    padding: 20,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 14,
  },
  heroValue: {
    fontSize: 44,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -2,
  },
  heroTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroTrendText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.teal,
    marginLeft: 2,
  },
  miniChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    marginBottom: 14,
    height: 32,
  },
  chartBar: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 2,
    opacity: 0.85,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 32,
  },
  heroStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  heroStatLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Progress Section
  progressSection: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius['2xl'],
    padding: 16,
    marginBottom: 20,
    gap: 16,
  },
  progressRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  progressStats: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  progressStatItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: 8,
  },
  progressStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  progressStatLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },

  // Sections
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.accent,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAction: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text,
  },

  // AI Card
  aiCard: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    marginBottom: 20,
  },
  aiGradient: {
    padding: 18,
  },
  aiContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.background,
  },
  aiDescription: {
    fontSize: 12,
    color: colors.background,
    opacity: 0.85,
  },

  // Activity List
  activityList: {
    backgroundColor: colors.surface,
    borderRadius: radius['2xl'],
    padding: 4,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  activitySubtitle: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  activityTime: {
    fontSize: 11,
    color: colors.textTertiary,
  },
});
