/**
 * Stats/Leaderboard Screen
 *
 * Dark racing style: Rankings, stats, bold numbers
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import {
  apiGetYoutubeChannel,
  apiGetYoutubeVideos,
  apiGetYoutubeAnalytics,
  BackendYoutubeChannel,
  BackendYoutubeVideo,
  BackendChannelAnalyticsPoint,
} from '../../../src/services/api';
import { startYoutubeConnect } from '../../../src/services/youtube';
import { showAlert } from '../../../src/utils/alert';
import { getCategoryName, getCategoryColor } from '../../../src/utils/youtubeCategories';
import { colors, spacing, typography, radius, layout, shadows } from '../../../src/theme';

type ViewType = 'videos' | 'revenue' | 'growth';

const TABS: { id: ViewType; label: string }[] = [
  { id: 'videos', label: 'Top Videos' },
  { id: 'revenue', label: 'Revenue' },
  { id: 'growth', label: 'Recent' },
];

function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatPublishDate(dateString: string | null): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function TimelineScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ViewType>('videos');
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [channel, setChannel] = useState<BackendYoutubeChannel | null>(null);
  const [videos, setVideos] = useState<BackendYoutubeVideo[]>([]);
  const [analytics, setAnalytics] = useState<BackendChannelAnalyticsPoint[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [channelData, videosData, analyticsData] = await Promise.all([
        apiGetYoutubeChannel(),
        apiGetYoutubeVideos(),
        apiGetYoutubeAnalytics(),
      ]);
      setChannel(channelData);
      setVideos(videosData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load stats data:', error);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const handleConnectYoutube = async () => {
    setConnecting(true);
    try {
      const result = await startYoutubeConnect('/timeline');
      if (result === 'success') {
        await loadData();
      }
    } catch (error: any) {
      showAlert('Connection Failed', error.message ?? 'Please try again');
    } finally {
      setConnecting(false);
    }
  };

  const byViewsDesc = useMemo(
    () => [...videos].sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0)),
    [videos]
  );
  const byRecent = useMemo(
    () =>
      [...videos].sort(
        (a, b) => new Date(b.publishedAt ?? 0).getTime() - new Date(a.publishedAt ?? 0).getTime()
      ),
    [videos]
  );
  const topVideo = byViewsDesc[0];

  const topCategory = useMemo(() => {
    const totals = new Map<string, { views: number; count: number }>();
    for (const v of videos) {
      const name = getCategoryName(v.categoryId);
      const entry = totals.get(name) ?? { views: 0, count: 0 };
      entry.views += v.viewCount ?? 0;
      entry.count += 1;
      totals.set(name, entry);
    }
    let best: { name: string; count: number } | null = null;
    for (const [name, { views, count }] of totals) {
      if (!best || views > (totals.get(best.name)?.views ?? 0)) {
        best = { name, count };
      }
    }
    return best;
  }, [videos]);

  const totalWatchMinutes = useMemo(
    () => analytics.reduce((sum, a) => sum + a.watchTimeMinutes, 0),
    [analytics]
  );
  const totalSubsGained = useMemo(
    () => analytics.reduce((sum, a) => sum + a.subscribersGained, 0),
    [analytics]
  );

  const activeList = activeTab === 'growth' ? byRecent : byViewsDesc;

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
            </View>
          </View>

          {!loading && !channel ? (
            /* Not connected yet */
            <TouchableOpacity
              style={styles.heroSection}
              activeOpacity={0.9}
              onPress={handleConnectYoutube}
              disabled={connecting}
            >
              <LinearGradient
                colors={['#FF0000', '#CC0000']}
                style={styles.heroGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.heroLabel}>
                  {connecting ? 'CONNECTING…' : 'NOT CONNECTED'}
                </Text>
                <Text style={styles.heroTitle}>Connect YouTube</Text>
                <Text style={styles.heroSubtitle}>
                  Link your channel to see video rankings and real stats here.
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <>
              {/* Hero Section with Gradient */}
              {topVideo && (
                <View style={styles.heroSection}>
                  <LinearGradient
                    colors={[colors.teal, colors.mercedes]}
                    style={styles.heroGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <View style={styles.heroContent}>
                      <Text style={styles.heroLabel}>MOST SUCCESSFUL VIDEO</Text>
                      <Text style={styles.heroTitle} numberOfLines={2}>{topVideo.title}</Text>
                      <View style={styles.heroStatsRow}>
                        <Text style={styles.heroStatNumber}>
                          {formatCompactNumber(topVideo.viewCount ?? 0)}
                        </Text>
                        <Text style={styles.heroStatLabel}>VIEWS</Text>
                      </View>
                      <Text style={styles.heroSubtitle}>
                        {getCategoryName(topVideo.categoryId)} • Published {formatPublishDate(topVideo.publishedAt)}
                      </Text>
                    </View>
                  </LinearGradient>
                </View>
              )}

              {/* Stats Cards */}
              <View style={styles.statsRow}>
                <StatCard
                  label="Most Successful Category"
                  value={String(topCategory?.count ?? 0).padStart(2, '0')}
                  unit="VIDS"
                  subtitle={topCategory?.name ?? '—'}
                />
                <StatCard
                  label="New Subscribers"
                  value={formatCompactNumber(totalSubsGained)}
                  unit=""
                  subtitle="Last 30 days"
                />
              </View>

              {/* Big Stat */}
              <View style={styles.bigStatCard}>
                <Text style={styles.bigStatLabel}>Total Watch Time</Text>
                <View style={styles.bigStatRow}>
                  <Text style={styles.bigStatValue}>{formatCompactNumber(totalWatchMinutes)}</Text>
                </View>
                <Text style={styles.bigStatSubtitle}>Minutes, last 30 days</Text>
              </View>

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

                {activeTab === 'revenue' ? (
                  <View style={styles.rankingsList}>
                    <Text style={styles.emptyStateText}>
                      Revenue tracking isn't set up yet.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.rankingsList}>
                    {activeList.length === 0 && (
                      <Text style={styles.emptyStateText}>No videos synced yet.</Text>
                    )}
                    {activeList.map((video, index) => {
                      const categoryName = getCategoryName(video.categoryId);
                      return (
                        <TouchableOpacity
                          key={video.id}
                          style={[
                            styles.rankingItem,
                            index === activeList.length - 1 && { borderBottomWidth: 0 },
                          ]}
                          activeOpacity={0.7}
                          onPress={() =>
                            router.push({ pathname: '/(modals)/video-detail', params: { id: video.id } })
                          }
                        >
                          <Text style={styles.rankNumber}>{String(index + 1).padStart(2, '0')}</Text>
                          <View style={styles.rankingInfo}>
                            <Text style={styles.rankingTitle} numberOfLines={1}>{video.title}</Text>
                            <Text style={[styles.rankingCategory, { color: getCategoryColor(categoryName) }]}>
                              {categoryName}
                            </Text>
                          </View>
                          <View style={styles.rankingStats}>
                            <Text style={styles.rankingViews}>
                              {formatCompactNumber(video.viewCount ?? 0)}
                            </Text>
                            <Text style={styles.rankingViewsLabel}>VIEWS</Text>
                          </View>
                          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.textTertiary} strokeWidth={1.5}>
                            <Path d="M9 18l6-6-6-6" />
                          </Svg>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            </>
          )}

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
  emptyStateText: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center',
    padding: 24,
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
