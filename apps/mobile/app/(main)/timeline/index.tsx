/**
 * Deals/Transactions Screen
 *
 * Fintech-inspired: Transaction list with filters and stats
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
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, spacing, typography, radius, layout, shadows } from '../../../src/theme';

type FilterType = 'all' | 'active' | 'pending' | 'paid';

interface Deal {
  id: string;
  brand: string;
  avatar: string;
  value: string;
  status: 'active' | 'pending' | 'paid' | 'expired';
  date: string;
  description?: string;
}

const SUMMARY = {
  total: '$12,500',
  expense: '-$1,240',
  profit: '+$11,260',
};

const DEALS: Deal[] = [
  { id: '1', brand: 'Northwind Audio', avatar: 'N', value: '+$3,500', status: 'pending', date: 'Expires tomorrow', description: 'Partnership deal' },
  { id: '2', brand: 'Supabase', avatar: 'S', value: '+$3,000', status: 'active', date: 'Deliver by Sep 1', description: 'Sponsored integration' },
  { id: '3', brand: 'Figma', avatar: 'F', value: '+$2,800', status: 'active', date: 'Draft due Monday', description: 'Tutorial sponsorship' },
  { id: '4', brand: 'Notion', avatar: 'N', value: '+$2,200', status: 'paid', date: 'Completed Aug 15', description: 'Video mention' },
  { id: '5', brand: 'Raycast', avatar: 'R', value: '+$4,200', status: 'pending', date: 'Sign contract', description: 'Full integration' },
  { id: '6', brand: 'Vercel', avatar: 'V', value: '+$2,500', status: 'pending', date: 'Respond by Friday', description: 'Inbound offer' },
];

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'pending', label: 'Pending' },
  { id: 'paid', label: 'Paid' },
];

export default function TimelineScreen() {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredDeals = activeFilter === 'all'
    ? DEALS
    : DEALS.filter(d => d.status === activeFilter);

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
            <Text style={styles.headerTitle}>Deals</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.iconButton}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5}>
                  <Circle cx={11} cy={11} r={8} />
                  <Path d="M21 21l-4.35-4.35" />
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

          {/* Summary Card */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <Text style={styles.summaryLabel}>Summary</Text>
              <TouchableOpacity style={styles.periodSelector}>
                <Text style={styles.periodText}>This Month</Text>
                <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5}>
                  <Path d="M6 9l6 6 6-6" />
                </Svg>
              </TouchableOpacity>
            </View>

            {/* Circular Progress */}
            <View style={styles.progressContainer}>
              <View style={styles.progressRing}>
                <Svg width={140} height={140} viewBox="0 0 140 140">
                  <Circle
                    cx={70}
                    cy={70}
                    r={60}
                    fill="none"
                    stroke={colors.neutral200}
                    strokeWidth={12}
                  />
                  <Circle
                    cx={70}
                    cy={70}
                    r={60}
                    fill="none"
                    stroke={colors.teal}
                    strokeWidth={12}
                    strokeLinecap="round"
                    strokeDasharray={`${0.75 * 2 * Math.PI * 60} ${2 * Math.PI * 60}`}
                    transform="rotate(-90 70 70)"
                  />
                </Svg>
                <View style={styles.progressCenter}>
                  <Text style={styles.progressLabel}>Total</Text>
                  <Text style={styles.progressValue}>{SUMMARY.total}</Text>
                </View>
              </View>
            </View>

            {/* Summary Stats */}
            <View style={styles.summaryStats}>
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>Expense:</Text>
                <Text style={styles.summaryStatValueNegative}>{SUMMARY.expense}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.summaryStat}>
                <Text style={styles.summaryStatLabel}>Profits:</Text>
                <Text style={styles.summaryStatValuePositive}>{SUMMARY.profit}</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsRow}>
            <QuickActionButton icon="camera" label="Sales" />
            <QuickActionButton icon="cart" label="Sales" />
            <QuickActionButton icon="box" label="Inventory" />
            <QuickActionButton icon="building" label="Accounts" />
          </View>

          {/* Transactions Section */}
          <View style={styles.transactionsSection}>
            <View style={styles.transactionsHeader}>
              <Text style={styles.transactionsTitle}>Transactions</Text>
              <View style={styles.transactionsActions}>
                <TouchableOpacity style={styles.searchButton}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.textTertiary} strokeWidth={1.5}>
                    <Circle cx={11} cy={11} r={8} />
                    <Path d="M21 21l-4.35-4.35" />
                  </Svg>
                </TouchableOpacity>
                <TouchableOpacity style={styles.filterIconButton}>
                  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.textTertiary} strokeWidth={1.5}>
                    <Path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
                  </Svg>
                </TouchableOpacity>
              </View>
            </View>

            {/* Filter Tabs */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterTabs}
            >
              {FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[styles.filterTab, activeFilter === filter.id && styles.filterTabActive]}
                  onPress={() => setActiveFilter(filter.id)}
                >
                  <Text style={[styles.filterTabText, activeFilter === filter.id && styles.filterTabTextActive]}>
                    {filter.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Deals List */}
            <View style={styles.dealsList}>
              {filteredDeals.map((deal) => (
                <TouchableOpacity key={deal.id} style={styles.dealRow} activeOpacity={0.7}>
                  <View style={[styles.dealAvatar, deal.status === 'paid' && styles.dealAvatarPaid]}>
                    <Text style={[styles.dealAvatarText, deal.status === 'paid' && styles.dealAvatarTextPaid]}>
                      {deal.avatar}
                    </Text>
                  </View>
                  <View style={styles.dealInfo}>
                    <Text style={styles.dealBrand}>{deal.brand}</Text>
                    <Text style={styles.dealDate}>{deal.date}</Text>
                  </View>
                  <View style={styles.dealRight}>
                    <Text style={[
                      styles.dealValue,
                      deal.status === 'paid' && styles.dealValuePaid,
                      deal.status === 'pending' && styles.dealValuePending,
                    ]}>
                      {deal.value}
                    </Text>
                    {deal.status !== 'paid' && (
                      <View style={[styles.statusBadge, deal.status === 'pending' && styles.statusBadgePending]}>
                        <Text style={[styles.statusText, deal.status === 'pending' && styles.statusTextPending]}>
                          {deal.status === 'active' ? 'Active' : 'Pending'}
                        </Text>
                      </View>
                    )}
                  </View>
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

// Quick Action Button
function QuickActionButton({ icon, label }: { icon: string; label: string }) {
  return (
    <TouchableOpacity style={styles.quickActionButton}>
      <View style={styles.quickActionIcon}>
        {icon === 'camera' && (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5}>
            <Path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
            <Circle cx={12} cy={13} r={4} />
          </Svg>
        )}
        {icon === 'cart' && (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5}>
            <Path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0" />
          </Svg>
        )}
        {icon === 'box' && (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5}>
            <Path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            <Path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
          </Svg>
        )}
        {icon === 'building' && (
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5}>
            <Path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-4M9 9v.01M9 12v.01M9 15v.01M9 18v.01" />
          </Svg>
        )}
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
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
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerActions: {
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

  // Summary Card
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius['2xl'],
    padding: 20,
    marginBottom: 20,
    ...shadows.sm,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  progressRing: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 13,
    color: colors.textTertiary,
  },
  progressValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 4,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  summaryStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  summaryStatLabel: {
    fontSize: 14,
    color: colors.textTertiary,
  },
  summaryStatValueNegative: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.error,
  },
  summaryStatValuePositive: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.teal,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.neutral300,
  },

  // Quick Actions
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickActionButton: {
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  quickActionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // Transactions
  transactionsSection: {
    backgroundColor: colors.surface,
    borderRadius: radius['2xl'],
    padding: 16,
    ...shadows.sm,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  transactionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  transactionsActions: {
    flexDirection: 'row',
    gap: 8,
  },
  searchButton: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIconButton: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterTabs: {
    gap: 8,
    marginBottom: 14,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.background,
  },
  filterTabActive: {
    backgroundColor: colors.accent,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  dealsList: {
    gap: 2,
  },
  dealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  dealAvatar: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.tealMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealAvatarPaid: {
    backgroundColor: colors.neutral200,
  },
  dealAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.teal,
  },
  dealAvatarTextPaid: {
    color: colors.textSecondary,
  },
  dealInfo: {
    flex: 1,
  },
  dealBrand: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  dealDate: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 2,
  },
  dealRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  dealValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.teal,
  },
  dealValuePaid: {
    color: colors.textSecondary,
  },
  dealValuePending: {
    color: colors.warning,
  },
  statusBadge: {
    backgroundColor: colors.tealMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  statusBadgePending: {
    backgroundColor: colors.warningMuted,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.teal,
    textTransform: 'uppercase',
  },
  statusTextPending: {
    color: colors.warning,
  },
});
