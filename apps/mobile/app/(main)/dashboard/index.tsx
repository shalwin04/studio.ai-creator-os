/**
 * Dashboard - Home Screen
 *
 * Fintech-inspired: Balance cards, stats, transactions
 */

import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, spacing, typography, radius, layout, shadows } from '../../../src/theme';

// Mock data
const CHANNEL_BALANCE = {
  totalRevenue: '$12,450',
  monthlyChange: '+$2,340',
  changePercent: '+18.8%',
};

const QUICK_STATS = [
  { id: '1', label: 'Subscribers', value: '124.5K', change: '+847', positive: true },
  { id: '2', label: 'Views (7d)', value: '89.2K', change: '+12%', positive: true },
  { id: '3', label: 'Watch Time', value: '4.2K hrs', change: '+8%', positive: true },
];

const TRANSACTIONS = [
  { id: '1', name: 'Northwind Audio', type: 'deal', amount: '+$3,500', date: 'Expires tomorrow', avatar: 'N', pending: true },
  { id: '2', name: 'Supabase Sponsorship', type: 'deal', amount: '+$3,000', date: 'Active deal', avatar: 'S', positive: true },
  { id: '3', name: 'YouTube Revenue', type: 'revenue', amount: '+$1,240', date: 'This month', avatar: 'Y', positive: true },
  { id: '4', name: 'Equipment Purchase', type: 'expense', amount: '-$450', date: 'Last week', avatar: 'E', negative: true },
];

export default function DashboardScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

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
            <View style={styles.headerLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>J</Text>
              </View>
              <View>
                <Text style={styles.welcomeText}>Welcome</Text>
                <Text style={styles.userName}>James Chen</Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.iconButton}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5}>
                  <Rect x={3} y={3} width={7} height={7} rx={1} />
                  <Rect x={14} y={3} width={7} height={7} rx={1} />
                  <Rect x={3} y={14} width={7} height={7} rx={1} />
                  <Rect x={14} y={14} width={7} height={7} rx={1} />
                </Svg>
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5}>
                  <Path d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <Path d="M13.73 21a2 2 0 01-3.46 0" />
                </Svg>
                <View style={styles.notifDot} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Total Revenue</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmount}>{CHANNEL_BALANCE.totalRevenue}</Text>
              <TouchableOpacity style={styles.eyeButton}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.textTertiary} strokeWidth={1.5}>
                  <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <Circle cx={12} cy={12} r={3} />
                </Svg>
              </TouchableOpacity>
            </View>
            <View style={styles.changeRow}>
              <View style={styles.changeBadge}>
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke={colors.teal} strokeWidth={2}>
                  <Path d="M18 15l-6-6-6 6" />
                </Svg>
                <Text style={styles.changeText}>{CHANNEL_BALANCE.changePercent}</Text>
              </View>
              <Text style={styles.changeSubtext}>vs last month</Text>
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.statsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Quick Stats</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.statsScroll}
            >
              {QUICK_STATS.map((stat) => (
                <View key={stat.id} style={styles.statCard}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <View style={styles.statChangeRow}>
                    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke={colors.teal} strokeWidth={2}>
                      <Path d="M18 15l-6-6-6 6" />
                    </Svg>
                    <Text style={styles.statChange}>{stat.change}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* AI Assistant Card */}
          <TouchableOpacity
            style={styles.aiCard}
            activeOpacity={0.9}
            onPress={() => router.push('/(main)/chat')}
          >
            <View style={styles.aiIconWrap}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={colors.teal} strokeWidth={1.5}>
                <Path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" />
                <Circle cx={9} cy={13} r={1} fill={colors.teal} />
                <Circle cx={15} cy={13} r={1} fill={colors.teal} />
              </Svg>
            </View>
            <View style={styles.aiContent}>
              <Text style={styles.aiTitle}>Ask AI Assistant</Text>
              <Text style={styles.aiSubtitle}>What should I focus on today?</Text>
            </View>
            <View style={styles.aiArrow}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.textTertiary} strokeWidth={1.5}>
                <Path d="M9 18l6-6-6-6" />
              </Svg>
            </View>
          </TouchableOpacity>

          {/* Transactions */}
          <View style={styles.transactionsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <View style={styles.filterButtons}>
                <TouchableOpacity style={styles.filterActive}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.surface} strokeWidth={1.5}>
                    <Rect x={3} y={4} width={18} height={18} rx={2} />
                    <Path d="M16 2v4M8 2v4M3 10h18" />
                  </Svg>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterButton}>
                  <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textTertiary} strokeWidth={1.5}>
                    <Path d="M3 6h18M3 12h18M3 18h18" />
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.transactionsList}>
              {TRANSACTIONS.map((item) => (
                <TouchableOpacity key={item.id} style={styles.transactionRow} activeOpacity={0.7}>
                  <View style={[
                    styles.transactionAvatar,
                    item.pending && styles.transactionAvatarPending,
                    item.negative && styles.transactionAvatarNegative,
                  ]}>
                    <Text style={[
                      styles.transactionAvatarText,
                      item.pending && styles.transactionAvatarTextPending,
                      item.negative && styles.transactionAvatarTextNegative,
                    ]}>{item.avatar}</Text>
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionName}>{item.name}</Text>
                    <Text style={styles.transactionDate}>{item.date}</Text>
                  </View>
                  <Text style={[
                    styles.transactionAmount,
                    item.positive && styles.transactionAmountPositive,
                    item.negative && styles.transactionAmountNegative,
                    item.pending && styles.transactionAmountPending,
                  ]}>
                    {item.amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Bottom padding for tab bar */}
          <View style={{ height: layout.tabBarHeight + layout.tabBarBottom + 40 }} />
        </ScrollView>
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
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.teal,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  welcomeText: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  notifDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.teal,
    borderWidth: 2,
    borderColor: colors.surface,
  },

  // Balance Card
  balanceCard: {
    backgroundColor: colors.surface,
    borderRadius: radius['2xl'],
    padding: 24,
    marginBottom: 24,
    ...shadows.md,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textTertiary,
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -1,
  },
  eyeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.tealMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  changeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.teal,
  },
  changeSubtext: {
    fontSize: 13,
    color: colors.textTertiary,
  },

  // Stats Section
  statsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  viewAllText: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  statsScroll: {
    gap: 12,
  },
  statCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 16,
    minWidth: 120,
    ...shadows.sm,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 8,
  },
  statChangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statChange: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.teal,
  },

  // AI Card
  aiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 16,
    marginBottom: 24,
    gap: 14,
    ...shadows.sm,
  },
  aiIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.tealMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiContent: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  aiSubtitle: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 2,
  },
  aiArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Transactions
  transactionsSection: {
    marginBottom: 24,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  filterActive: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButton: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionsList: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.sm,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  transactionAvatar: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.tealMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionAvatarPending: {
    backgroundColor: colors.warningMuted,
  },
  transactionAvatarNegative: {
    backgroundColor: colors.errorMuted,
  },
  transactionAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.teal,
  },
  transactionAvatarTextPending: {
    color: colors.warning,
  },
  transactionAvatarTextNegative: {
    color: colors.error,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  transactionDate: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  transactionAmountPositive: {
    color: colors.teal,
  },
  transactionAmountNegative: {
    color: colors.error,
  },
  transactionAmountPending: {
    color: colors.warning,
  },
});
