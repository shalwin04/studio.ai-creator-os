/**
 * Dashboard - Home Screen
 *
 * Dark racing style: Hero stats, progress rings, bold typography
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import Svg, { Path, Rect } from 'react-native-svg';
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
import { useCreatorStore } from '../../../src/store';
import { colors, spacing, radius, layout, shadows } from '../../../src/theme';

function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function timeAgo(dateString: string): string {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return 'just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [channel, setChannel] = useState<BackendYoutubeChannel | null>(null);
  const [videos, setVideos] = useState<BackendYoutubeVideo[]>([]);
  const [analytics, setAnalytics] = useState<BackendChannelAnalyticsPoint[]>([]);
  const router = useRouter();
  const profile = useCreatorStore((state) => state.profile);

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
      console.error('Failed to load dashboard data:', error);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleConnectYoutube = async () => {
    setConnecting(true);
    try {
      const result = await startYoutubeConnect('/dashboard');
      if (result === 'success') {
        await loadData();
      }
      // 'web-redirect' navigates the tab away — nothing more to do here.
    } catch (error: any) {
      showAlert('Connection Failed', error.message ?? 'Please try again');
    } finally {
      setConnecting(false);
    }
  };

  const totalViews = useMemo(() => analytics.reduce((sum, a) => sum + a.views, 0), [analytics]);
  const totalWatchHours = useMemo(
    () => Math.round(analytics.reduce((sum, a) => sum + a.watchTimeMinutes, 0) / 60),
    [analytics]
  );
  const trendPct = useMemo(() => {
    if (analytics.length < 14) return null;
    const mid = Math.floor(analytics.length / 2);
    const firstHalf = analytics.slice(0, mid).reduce((s, a) => s + a.views, 0);
    const secondHalf = analytics.slice(mid).reduce((s, a) => s + a.views, 0);
    if (firstHalf === 0) return null;
    return Math.round(((secondHalf - firstHalf) / firstHalf) * 100);
  }, [analytics]);

  const displayName = profile?.display_name || 'Creator';
  const recentVideos = videos.slice(0, 4);

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
              <Text style={styles.userName}>{displayName}</Text>
            </View>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => router.push('/(main)/settings')}
            >
              <Text style={styles.profileInitial}>{displayName.charAt(0).toUpperCase()}</Text>
            </TouchableOpacity>
          </View>

          {!loading && !channel ? (
            /* Not connected yet */
            <TouchableOpacity
              style={styles.connectCard}
              activeOpacity={0.9}
              onPress={handleConnectYoutube}
              disabled={connecting}
            >
              <LinearGradient
                colors={['#FF0000', '#CC0000']}
                style={styles.connectGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.connectTitle}>
                  {connecting ? 'Connecting…' : 'Connect YouTube'}
                </Text>
                <Text style={styles.connectSubtitle}>
                  Link your channel to see real views, watch time, and video performance here.
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <>
              {/* Hero Stats Card */}
              <View style={styles.heroCard}>
                <LinearGradient
                  colors={['#1E3A5F', '#0D1B2A']}
                  style={styles.heroGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.heroLabel}>TOTAL VIEWS (LAST 30 DAYS)</Text>
                  <View style={styles.heroValueRow}>
                    <Text style={styles.heroValue}>{formatCompactNumber(totalViews)}</Text>
                    {trendPct !== null && (
                      <View style={styles.heroTrend}>
                        <Svg
                          width={14}
                          height={14}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={trendPct >= 0 ? colors.teal : colors.red}
                          strokeWidth={2.5}
                        >
                          <Path d={trendPct >= 0 ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} />
                        </Svg>
                        <Text
                          style={[
                            styles.heroTrendText,
                            trendPct < 0 && { color: colors.red },
                          ]}
                        >
                          {trendPct >= 0 ? '+' : ''}
                          {trendPct}%
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.heroStats}>
                    <View style={styles.heroStat}>
                      <Text style={styles.heroStatValue}>{channel?.videoCount ?? videos.length}</Text>
                      <Text style={styles.heroStatLabel}>Videos</Text>
                    </View>
                    <View style={styles.heroStat}>
                      <Text style={styles.heroStatValue}>{totalWatchHours}</Text>
                      <Text style={styles.heroStatLabel}>Hours</Text>
                    </View>
                    <View style={styles.heroStat}>
                      <Text style={styles.heroStatValue}>
                        {formatCompactNumber(channel?.subscriberCount ?? 0)}
                      </Text>
                      <Text style={styles.heroStatLabel}>Subscribers</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            </>
          )}

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

          {/* Recent Videos */}
          {recentVideos.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Videos</Text>
              </View>

              <View style={styles.activityList}>
                {recentVideos.map((video, index) => (
                  <View
                    key={video.id}
                    style={[styles.activityItem, index === recentVideos.length - 1 && { borderBottomWidth: 0 }]}
                  >
                    <View style={[styles.activityIcon, { backgroundColor: `${colors.teal}20` }]}>
                      <View style={[styles.activityDot, { backgroundColor: colors.teal }]} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle} numberOfLines={1}>{video.title}</Text>
                      <Text style={styles.activitySubtitle}>
                        {formatCompactNumber(video.viewCount ?? 0)} views
                      </Text>
                    </View>
                    <Text style={styles.activityTime}>
                      {video.publishedAt ? timeAgo(video.publishedAt) : ''}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
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

  // Connect Card (not-yet-connected empty state)
  connectCard: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    marginBottom: 16,
  },
  connectGradient: {
    padding: 20,
  },
  connectTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  connectSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 19,
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
