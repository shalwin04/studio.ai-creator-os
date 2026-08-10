/**
 * Video Performance Detail Modal
 *
 * Dark racing style: Analytics, insights, and performance data
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { colors, spacing, radius, layout } from '../../src/theme';

const { width } = Dimensions.get('window');

// Mock video data
const VIDEO = {
  id: '1',
  title: 'Building AI Apps with Claude',
  thumbnail: null,
  publishedAt: 'Aug 5, 2024',
  duration: '18:24',
  category: 'Tutorial',
  views: '524,892',
  watchTime: '4.2M min',
  likes: '18.4K',
  comments: '892',
  shares: '2.1K',
  subscribers: '+2,847',
  ctr: '8.4%',
  avgViewDuration: '9:32',
  avgViewPercentage: '52%',
  impressions: '6.2M',
  revenue: '$1,847',
  retentionData: [100, 95, 88, 82, 75, 68, 62, 58, 52, 48, 45, 42, 40, 38, 35, 33, 30, 28],
  trafficSources: [
    { source: 'Browse', percentage: 42, color: colors.accent },
    { source: 'Search', percentage: 28, color: colors.teal },
    { source: 'Suggested', percentage: 18, color: colors.orange },
    { source: 'External', percentage: 12, color: colors.lime },
  ],
  topCountries: [
    { country: 'United States', percentage: 38 },
    { country: 'India', percentage: 22 },
    { country: 'United Kingdom', percentage: 12 },
    { country: 'Germany', percentage: 8 },
  ],
  aiInsights: [
    {
      type: 'positive',
      title: 'Strong opening retention',
      description: 'First 30 seconds kept 95% of viewers - your hook is working well.',
    },
    {
      type: 'warning',
      title: 'Drop at 8:00 mark',
      description: 'Consider adding a visual change or recap at this point.',
    },
    {
      type: 'tip',
      title: 'Opportunity',
      description: 'Tutorial keywords trending +24% this week. Consider a follow-up video.',
    },
  ],
};

export default function VideoDetailModal() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'audience' | 'insights'>('overview');

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
            <View style={styles.thumbnailPlaceholder}>
              <Svg width={40} height={40} viewBox="0 0 24 24" fill={colors.accent}>
                <Path d="M23 7l-7 5 7 5V7z" />
                <Rect x={1} y={5} width={15} height={14} rx={2} fill={colors.accent} />
              </Svg>
            </View>
            <View style={styles.videoMeta}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{VIDEO.category}</Text>
              </View>
              <Text style={styles.videoTitle}>{VIDEO.title}</Text>
              <Text style={styles.videoInfo}>
                {VIDEO.publishedAt} • {VIDEO.duration}
              </Text>
            </View>
          </LinearGradient>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard value={VIDEO.views} label="Views" color={colors.accent} icon="eye" />
          <StatCard value={VIDEO.watchTime} label="Watch Time" color={colors.teal} icon="clock" />
          <StatCard value={VIDEO.likes} label="Likes" color={colors.orange} icon="heart" />
          <StatCard value={VIDEO.subscribers} label="Subs Gained" color={colors.lime} icon="users" />
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
            {/* Retention Graph */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Audience Retention</Text>
              <View style={styles.retentionCard}>
                <View style={styles.retentionHeader}>
                  <Text style={styles.retentionValue}>{VIDEO.avgViewPercentage}</Text>
                  <Text style={styles.retentionLabel}>Average viewed</Text>
                </View>
                <View style={styles.retentionGraph}>
                  {VIDEO.retentionData.map((value, index) => (
                    <View
                      key={index}
                      style={[
                        styles.retentionBar,
                        { height: `${value}%` },
                        index < VIDEO.retentionData.length / 2 && { backgroundColor: colors.teal },
                      ]}
                    />
                  ))}
                </View>
                <View style={styles.retentionLabels}>
                  <Text style={styles.retentionTimeLabel}>0:00</Text>
                  <Text style={styles.retentionTimeLabel}>{VIDEO.avgViewDuration}</Text>
                  <Text style={styles.retentionTimeLabel}>{VIDEO.duration}</Text>
                </View>
              </View>
            </View>

            {/* Performance Metrics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Performance</Text>
              <View style={styles.metricsCard}>
                <MetricRow label="Click-through rate" value={VIDEO.ctr} trend="+1.2%" positive />
                <MetricRow label="Impressions" value={VIDEO.impressions} />
                <MetricRow label="Average view duration" value={VIDEO.avgViewDuration} />
                <MetricRow label="Comments" value={VIDEO.comments} />
                <MetricRow label="Shares" value={VIDEO.shares} />
                <MetricRow label="Estimated revenue" value={VIDEO.revenue} highlight noBorder />
              </View>
            </View>

            {/* Traffic Sources */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Traffic Sources</Text>
              <View style={styles.trafficCard}>
                {VIDEO.trafficSources.map((source, index) => (
                  <View key={source.source} style={styles.trafficItem}>
                    <View style={styles.trafficInfo}>
                      <View style={[styles.trafficDot, { backgroundColor: source.color }]} />
                      <Text style={styles.trafficSource}>{source.source}</Text>
                    </View>
                    <View style={styles.trafficBarContainer}>
                      <View
                        style={[
                          styles.trafficBar,
                          { width: `${source.percentage}%`, backgroundColor: source.color },
                        ]}
                      />
                    </View>
                    <Text style={styles.trafficPercentage}>{source.percentage}%</Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {activeTab === 'audience' && (
          <>
            {/* Top Countries */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Countries</Text>
              <View style={styles.countriesCard}>
                {VIDEO.topCountries.map((item, index) => (
                  <View
                    key={item.country}
                    style={[styles.countryItem, index === VIDEO.topCountries.length - 1 && { borderBottomWidth: 0 }]}
                  >
                    <Text style={styles.countryRank}>{String(index + 1).padStart(2, '0')}</Text>
                    <Text style={styles.countryName}>{item.country}</Text>
                    <Text style={styles.countryPercentage}>{item.percentage}%</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Demographics Card */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Demographics</Text>
              <View style={styles.demoCard}>
                <View style={styles.demoRow}>
                  <View style={styles.demoItem}>
                    <Text style={styles.demoValue}>78%</Text>
                    <Text style={styles.demoLabel}>Male</Text>
                  </View>
                  <View style={styles.demoItem}>
                    <Text style={styles.demoValue}>22%</Text>
                    <Text style={styles.demoLabel}>Female</Text>
                  </View>
                </View>
                <View style={styles.demoDivider} />
                <View style={styles.demoRow}>
                  <View style={styles.demoItem}>
                    <Text style={styles.demoValue}>25-34</Text>
                    <Text style={styles.demoLabel}>Top Age Group</Text>
                  </View>
                  <View style={styles.demoItem}>
                    <Text style={styles.demoValue}>42%</Text>
                    <Text style={styles.demoLabel}>Returning</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        {activeTab === 'insights' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>AI-Generated Insights</Text>
            {VIDEO.aiInsights.map((insight, index) => (
              <View
                key={index}
                style={[
                  styles.insightCard,
                  insight.type === 'positive' && { borderLeftColor: colors.teal },
                  insight.type === 'warning' && { borderLeftColor: colors.orange },
                  insight.type === 'tip' && { borderLeftColor: colors.lime },
                ]}
              >
                <View style={styles.insightHeader}>
                  {insight.type === 'positive' && (
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.teal} strokeWidth={2}>
                      <Path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                      <Path d="M22 4L12 14.01l-3-3" />
                    </Svg>
                  )}
                  {insight.type === 'warning' && (
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.orange} strokeWidth={2}>
                      <Path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      <Path d="M12 9v4M12 17h.01" />
                    </Svg>
                  )}
                  {insight.type === 'tip' && (
                    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.lime} strokeWidth={2}>
                      <Path d="M9 18h6M10 22h4M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14" />
                    </Svg>
                  )}
                  <Text style={styles.insightTitle}>{insight.title}</Text>
                </View>
                <Text style={styles.insightDescription}>{insight.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Bottom Padding */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.shareButton} activeOpacity={0.7}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5}>
            <Path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
          </Svg>
          <Text style={styles.shareText}>Share Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.youtubeButton} activeOpacity={0.8}>
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
  trend,
  positive,
  highlight,
  noBorder,
}: {
  label: string;
  value: string;
  trend?: string;
  positive?: boolean;
  highlight?: boolean;
  noBorder?: boolean;
}) {
  return (
    <View style={[styles.metricRow, !noBorder && styles.metricRowBorder]}>
      <Text style={styles.metricLabel}>{label}</Text>
      <View style={styles.metricValueRow}>
        <Text style={[styles.metricValue, highlight && { color: colors.lime }]}>{value}</Text>
        {trend && (
          <Text style={[styles.metricTrend, positive && { color: colors.teal }]}>{trend}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    marginBottom: 16,
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
  retentionGraph: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
    gap: 2,
  },
  retentionBar: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: 2,
    minHeight: 2,
  },
  retentionLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  retentionTimeLabel: {
    fontSize: 10,
    color: colors.textTertiary,
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
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  metricTrend: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textTertiary,
  },

  // Traffic
  trafficCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 16,
    gap: 14,
  },
  trafficItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trafficInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
    gap: 8,
  },
  trafficDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  trafficSource: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  trafficBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 3,
    marginHorizontal: 12,
  },
  trafficBar: {
    height: '100%',
    borderRadius: 3,
  },
  trafficPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    width: 36,
    textAlign: 'right',
  },

  // Countries
  countriesCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  countryRank: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.teal,
    width: 30,
  },
  countryName: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  countryPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },

  // Demographics
  demoCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 20,
  },
  demoRow: {
    flexDirection: 'row',
  },
  demoItem: {
    flex: 1,
    alignItems: 'center',
  },
  demoValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  demoLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  demoDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: 16,
  },

  // Insights
  insightCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.teal,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  insightDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
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
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    gap: 8,
  },
  shareText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
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
