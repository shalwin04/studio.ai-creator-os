/**
 * Stats/Leaderboard Screen
 *
 * Dark racing style: Rankings, stats, bold numbers
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, spacing, typography, radius, layout, shadows } from '../../../src/theme';

type ViewType = 'videos' | 'revenue' | 'growth';

interface VideoStat {
  id: string;
  rank: number;
  title: string;
  category: string;
  views: string;
  categoryColor: string;
}

const VIDEO_STATS: VideoStat[] = [
  { id: '1', rank: 1, title: 'Building AI Apps with Claude', category: 'Tutorial', views: '524K', categoryColor: colors.teal },
  { id: '2', rank: 2, title: 'React Native in 2024', category: 'Tutorial', views: '312K', categoryColor: colors.teal },
  { id: '3', rank: 3, title: 'My Studio Setup Tour', category: 'Vlog', views: '287K', categoryColor: colors.orange },
  { id: '4', rank: 4, title: 'Supabase Deep Dive', category: 'Sponsored', views: '198K', categoryColor: colors.ferrari },
  { id: '5', rank: 5, title: 'Cursor vs Copilot', category: 'Review', views: '156K', categoryColor: colors.mclaren },
  { id: '6', rank: 6, title: 'TypeScript Tips', category: 'Tutorial', views: '134K', categoryColor: colors.teal },
  { id: '7', rank: 7, title: 'Year in Review', category: 'Vlog', views: '98K', categoryColor: colors.orange },
];

const TABS: { id: ViewType; label: string }[] = [
  { id: 'videos', label: 'Top Videos' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'growth', label: 'Growth' },
];

export default function TimelineScreen() {
  const [activeTab, setActiveTab] = useState<ViewType>('videos');

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
              <Text style={styles.headerTitle}>Video Stats</Text>
              <TouchableOpacity style={styles.dropdownButton}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2}>
                  <Path d="M6 9l6 6 6-6" />
                </Svg>
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero Section with Gradient */}
          <View style={styles.heroSection}>
            <LinearGradient
              colors={[colors.teal, colors.mercedes]}
              style={styles.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.heroContent}>
                <Text style={styles.heroLabel}>MOST SUCCESSFUL VIDEO</Text>
                <Text style={styles.heroTitle}>Building AI Apps</Text>
                <View style={styles.heroStatsRow}>
                  <Text style={styles.heroStatNumber}>524K</Text>
                  <Text style={styles.heroStatLabel}>VIEWS</Text>
                </View>
                <Text style={styles.heroSubtitle}>Tutorial • Published Aug 2024</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsRow}>
            <StatCard
              label="Most Successful Category"
              value="08"
              unit="VIDS"
              subtitle="Tutorials"
            />
            <StatCard
              label="Best Growth Month"
              value="42"
              unit="%"
              subtitle="September"
            />
          </View>

          {/* Big Stat */}
          <View style={styles.bigStatCard}>
            <Text style={styles.bigStatLabel}>Total Watch Time</Text>
            <View style={styles.bigStatRow}>
              <Text style={styles.bigStatValue}>1:47:32</Text>
            </View>
            <Text style={styles.bigStatSubtitle}>Average per video</Text>
          </View>

          {/* Invite Card */}
          <TouchableOpacity style={styles.inviteCard} activeOpacity={0.9}>
            <LinearGradient
              colors={[colors.lime, '#C8E600']}
              style={styles.inviteGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.inviteContent}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.background} strokeWidth={2}>
                  <Path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                </Svg>
                <Text style={styles.inviteTitle}>share</Text>
              </View>
              <Text style={styles.inviteDescription}>
                Share your stats with your audience. Let them see your growth journey.
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Rankings List */}
          <View style={styles.rankingsSection}>
            <Text style={styles.sectionTitle}>Video Rankings</Text>

            {/* Tab Selector */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsContainer}
            >
              {TABS.map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Rankings */}
            <View style={styles.rankingsList}>
              {VIDEO_STATS.map((video, index) => (
                <TouchableOpacity
                  key={video.id}
                  style={[styles.rankingItem, index === VIDEO_STATS.length - 1 && { borderBottomWidth: 0 }]}
                  activeOpacity={0.7}
                >
                  <Text style={styles.rankNumber}>0{video.rank}</Text>
                  <View style={styles.rankingInfo}>
                    <Text style={styles.rankingTitle}>{video.title}</Text>
                    <Text style={[styles.rankingCategory, { color: video.categoryColor }]}>
                      {video.category}
                    </Text>
                  </View>
                  <View style={styles.rankingStats}>
                    <Text style={styles.rankingViews}>{video.views}</Text>
                    <Text style={styles.rankingViewsLabel}>VIEWS</Text>
                  </View>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.textTertiary} strokeWidth={1.5}>
                    <Path d="M9 18l6-6-6-6" />
                  </Svg>
                </TouchableOpacity>
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

function StatCard({
  label,
  value,
  unit,
  subtitle,
}: {
  label: string;
  value: string;
  unit: string;
  subtitle: string;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statCardLabel}>{label}</Text>
      <View style={styles.statCardValueRow}>
        <Text style={styles.statCardValue}>{value}</Text>
        <Text style={styles.statCardUnit}>{unit}</Text>
      </View>
      <Text style={styles.statCardSubtitle}>{subtitle}</Text>
    </View>
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

  // Hero Section
  heroSection: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroGradient: {
    padding: 24,
  },
  heroContent: {},
  heroLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  heroStatsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 8,
  },
  heroStatNumber: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -2,
  },
  heroStatLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  statCardLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  statCardValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 4,
  },
  statCardValue: {
    fontSize: 36,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -1,
  },
  statCardUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statCardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Big Stat Card
  bigStatCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 20,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  bigStatLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  bigStatRow: {
    marginBottom: 4,
  },
  bigStatValue: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -2,
  },
  bigStatSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Invite Card
  inviteCard: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    marginBottom: 24,
  },
  inviteGradient: {
    padding: 20,
  },
  inviteContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  inviteTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.background,
    textTransform: 'lowercase',
  },
  inviteDescription: {
    fontSize: 14,
    color: colors.background,
    opacity: 0.85,
    lineHeight: 20,
  },

  // Rankings Section
  rankingsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  tabsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
  },
  tabActive: {
    backgroundColor: colors.surfaceElevated,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textTertiary,
  },
  tabTextActive: {
    color: colors.text,
  },

  // Rankings List
  rankingsList: {
    backgroundColor: colors.surface,
    borderRadius: radius['2xl'],
    padding: 4,
  },
  rankingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rankNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    width: 36,
  },
  rankingInfo: {
    flex: 1,
  },
  rankingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  rankingCategory: {
    fontSize: 13,
    fontWeight: '500',
  },
  rankingStats: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  rankingViews: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  rankingViewsLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },
});
