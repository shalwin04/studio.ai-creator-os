/**
 * Video Performance Detail Modal
 *
 * Dark racing style: Analytics, insights, and performance data
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import {
  apiGetYoutubeVideo,
  apiGetYoutubeVideoAnalytics,
  BackendYoutubeVideo,
  BackendVideoAnalyticsPoint,
} from '../../src/services/api';
import { getCategoryName } from '../../src/utils/youtubeCategories';
import { colors, spacing, radius, layout } from '../../src/theme';

const { width } = Dimensions.get('window');

function formatIsoDuration(iso: string | null): string {
  if (!iso) return '';
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return '';
  const h = parseInt(match[1] || '0', 10);
  const m = parseInt(match[2] || '0', 10);
  const s = parseInt(match[3] || '0', 10);
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

function formatSecondsToMinSec(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.round(totalSeconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatPublishDate(dateString: string | null): string {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCompactNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function VideoDetailModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'audience' | 'insights'>('overview');
  const [loading, setLoading] = useState(true);
  const [video, setVideo] = useState<BackendYoutubeVideo | null>(null);
  const [analytics, setAnalytics] = useState<BackendVideoAnalyticsPoint[]>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([apiGetYoutubeVideo(id), apiGetYoutubeVideoAnalytics(id)])
      .then(([videoData, analyticsData]) => {
        setVideo(videoData);
        setAnalytics(analyticsData);
      })
      .catch((error) => console.error('Failed to load video detail:', error))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!video) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyText}>Video not found.</Text>
      </View>
    );
  }

  const categoryName = getCategoryName(video.categoryId);
  const totalWatchMinutes = analytics.reduce((s, a) => s + (a.watchTimeMinutes ?? 0), 0);
  const totalSubsGained = analytics.reduce((s, a) => s + (a.subscribersGained ?? 0), 0);
  const totalShares = analytics.reduce((s, a) => s + (a.shares ?? 0), 0);
  const avgViewPercentage = analytics.length
    ? Math.round(analytics.reduce((s, a) => s + (a.avgViewPercentage ?? 0), 0) / analytics.length)
    : null;
  const avgViewDurationSeconds = analytics.length
    ? Math.round(analytics.reduce((s, a) => s + (a.avgViewDuration ?? 0), 0) / analytics.length)
    : null;

  const handleOpenYoutube = () => {
    Linking.openURL(`https://www.youtube.com/watch?v=${video.videoId}`);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Video Hero */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['#1E3A5F', '#0D1B2A']}
            style={styles.heroGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {video.thumbnailUrl ? (
              <Image source={{ uri: video.thumbnailUrl }} style={styles.thumbnailImage} />
            ) : (
              <View style={styles.thumbnailPlaceholder}>
                <Svg width={40} height={40} viewBox="0 0 24 24" fill={colors.accent}>
                  <Path d="M23 7l-7 5 7 5V7z" />
                  <Rect x={1} y={5} width={15} height={14} rx={2} fill={colors.accent} />
                </Svg>
              </View>
            )}
            <View style={styles.videoMeta}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{categoryName}</Text>
              </View>
              <Text style={styles.videoTitle} numberOfLines={2}>{video.title}</Text>
              <Text style={styles.videoInfo}>
                {formatPublishDate(video.publishedAt)} • {formatIsoDuration(video.duration)}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard value={formatCompactNumber(video.viewCount ?? 0)} label="Views" color={colors.accent} icon="eye" />
          <StatCard value={`${formatCompactNumber(totalWatchMinutes)} min`} label="Watch Time (30d)" color={colors.teal} icon="clock" />
          <StatCard value={formatCompactNumber(video.likeCount ?? 0)} label="Likes" color={colors.orange} icon="heart" />
          <StatCard value={`+${formatCompactNumber(totalSubsGained)}`} label="Subs Gained (30d)" color={colors.lime} icon="users" />
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'audience' && styles.tabActive]}
            onPress={() => setActiveTab('audience')}
          >
            <Text style={[styles.tabText, activeTab === 'audience' && styles.tabTextActive]}>
              Audience
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'insights' && styles.tabActive]}
            onPress={() => setActiveTab('insights')}
          >
            <Text style={[styles.tabText, activeTab === 'insights' && styles.tabTextActive]}>
              AI Insights
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'overview' && (
          <>
            {/* Retention */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Retention (Last 30 Days)</Text>
              <View style={styles.retentionCard}>
                <View style={styles.retentionHeader}>
                  <Text style={styles.retentionValue}>
                    {avgViewPercentage !== null ? `${avgViewPercentage}%` : '—'}
                  </Text>
                  <Text style={styles.retentionLabel}>Average % of video viewed</Text>
                </View>
                <Text style={styles.retentionSubtext}>
                  Average watch duration:{' '}
                  {avgViewDurationSeconds !== null ? formatSecondsToMinSec(avgViewDurationSeconds) : '—'}
                </Text>
              </View>
            </View>

            {/* Performance Metrics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Performance (Last 30 Days)</Text>
              <View style={styles.metricsCard}>
                <MetricRow label="Comments" value={formatCompactNumber(video.commentCount ?? 0)} />
                <MetricRow label="Shares" value={formatCompactNumber(totalShares)} noBorder />
              </View>
            </View>
          </>
        )}

        {activeTab === 'audience' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Audience</Text>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                Audience breakdown by country and demographics isn't synced yet.
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'insights' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI-Generated Insights</Text>
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                AI insights aren't generated yet — this is Suba's Intelligence scope, not built.
              </Text>
            </View>
          </View>
        )}

        {/* Bottom Padding */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.youtubeButton} activeOpacity={0.8} onPress={handleOpenYoutube}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill={colors.text}>
            <Path d="M23.5 6.2a2.8 2.8 0 00-2-2C19.8 3.8 12 3.8 12 3.8s-7.8 0-9.5.4a2.8 2.8 0 00-2 2 29.4 29.4 0 00-.5 5.8 29.4 29.4 0 00.5 5.8 2.8 2.8 0 002 2c1.7.4 9.5.4 9.5.4s7.8 0 9.5-.4a2.8 2.8 0 002-2 29.4 29.4 0 00.5-5.8 29.4 29.4 0 00-.5-5.8zM9.8 15.5V8.5l6.4 3.5-6.4 3.5z" />
          </Svg>
          <Text style={styles.youtubeText}>Open in YouTube</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function StatCard({
  value,
  label,
  color,
  icon,
}: {
  value: string;
  label: string;
  color: string;
  icon: string;
}) {
  const icons: Record<string, React.ReactNode> = {
    eye: (
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <Circle cx={12} cy={12} r={3} />
      </Svg>
    ),
    clock: (
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <Circle cx={12} cy={12} r={10} />
        <Path d="M12 6v6l4 2" />
      </Svg>
    ),
    heart: (
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </Svg>
    ),
    users: (
      <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <Path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <Circle cx={9} cy={7} r={4} />
        <Path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </Svg>
    ),
  };

  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        {icons[icon]}
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MetricRow({
  label,
  value,
  noBorder,
}: {
  label: string;
  value: string;
  noBorder?: boolean;
}) {
  return (
    <View style={[styles.metricRow, !noBorder && styles.metricRowBorder]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: layout.screenPadding,
    paddingTop: 20,
  },

  // Hero
  heroCard: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    marginBottom: 16,
  },
  heroGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailPlaceholder: {
    width: 100,
    height: 70,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  thumbnailImage: {
    width: 100,
    height: 70,
    borderRadius: radius.lg,
    marginRight: 16,
  },
  videoMeta: {
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  videoInfo: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: (width - 50) / 2,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 14,
    alignItems: 'center',
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: radius.lg,
  },
  tabActive: {
    backgroundColor: colors.surfaceElevated,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
  },
  tabTextActive: {
    color: colors.text,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    marginBottom: 10,
    marginLeft: 4,
  },

  // Retention
  retentionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 16,
  },
  retentionHeader: {
    marginBottom: 8,
  },
  retentionValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  retentionLabel: {
    fontSize: 12,
    color: colors.textTertiary,
  },
  retentionSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
  },

  // Metrics
  metricsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  metricRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  metricLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },

  // Empty states
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textTertiary,
    lineHeight: 20,
    textAlign: 'center',
  },

  // Action Bar
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: layout.screenPadding,
    paddingBottom: 34,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  youtubeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: radius.xl,
    backgroundColor: '#FF0000',
    gap: 8,
  },
  youtubeText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
