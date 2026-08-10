/**
 * Settings Screen
 *
 * Dark racing style: Matches dashboard design
 */

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, spacing, radius, layout } from '../../../src/theme';

const USER = {
  name: 'James',
  fullName: 'James Chen',
  email: 'james@creator.com',
  channel: 'TechWithJames',
  subs: '124.5K',
};

export default function SettingsScreen() {
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
            <View>
              <Text style={styles.headerLabel}>Settings</Text>
              <Text style={styles.headerTitle}>{USER.fullName}</Text>
            </View>
            <TouchableOpacity style={styles.profileButton}>
              <Text style={styles.profileInitial}>J</Text>
            </TouchableOpacity>
          </View>

          {/* Pro Card */}
          <TouchableOpacity style={styles.proCard} activeOpacity={0.9}>
            <LinearGradient
              colors={[colors.accent, colors.accentLight]}
              style={styles.proGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.proIcon}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill={colors.lime} stroke="none">
                  <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </Svg>
              </View>
              <View style={styles.proContent}>
                <Text style={styles.proTitle}>Upgrade to Pro</Text>
                <Text style={styles.proSubtitle}>Unlock all features</Text>
              </View>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2}>
                <Path d="M9 18l6-6-6-6" />
              </Svg>
            </LinearGradient>
          </TouchableOpacity>

          {/* YouTube Card */}
          <View style={styles.youtubeCard}>
            <View style={styles.youtubeIcon}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="#FF0000">
                <Path d="M23.5 6.2a2.8 2.8 0 00-2-2C19.8 3.8 12 3.8 12 3.8s-7.8 0-9.5.4a2.8 2.8 0 00-2 2 29.4 29.4 0 00-.5 5.8 29.4 29.4 0 00.5 5.8 2.8 2.8 0 002 2c1.7.4 9.5.4 9.5.4s7.8 0 9.5-.4a2.8 2.8 0 002-2 29.4 29.4 0 00.5-5.8 29.4 29.4 0 00-.5-5.8zM9.8 15.5V8.5l6.4 3.5-6.4 3.5z" />
              </Svg>
            </View>
            <View style={styles.youtubeContent}>
              <Text style={styles.youtubeChannel}>{USER.channel}</Text>
              <Text style={styles.youtubeSubs}>{USER.subs} subscribers</Text>
            </View>
            <View style={styles.connectedBadge}>
              <View style={styles.connectedDot} />
              <Text style={styles.connectedText}>Connected</Text>
            </View>
          </View>

          {/* Account Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            <View style={styles.settingsCard}>
              <SettingRow
                icon={<UserIcon />}
                label="Profile"
                value={USER.email}
                hasArrow
              />
              <SettingRow
                icon={<KeyIcon />}
                label="Password"
                value="••••••••"
                hasArrow
              />
              <SettingRow
                icon={<BellIcon />}
                label="Notifications"
                hasArrow
                noBorder
              />
            </View>
          </View>

          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.settingsCard}>
              <SettingRow
                icon={<MoonIcon />}
                label="Dark Mode"
                hasSwitch
                defaultValue={true}
              />
              <SettingRow
                icon={<SunIcon />}
                label="Daily Briefing"
                description="8:00 AM"
                hasSwitch
                defaultValue={true}
              />
              <SettingRow
                icon={<GlobeIcon />}
                label="Language"
                value="English"
                hasArrow
                noBorder
              />
            </View>
          </View>

          {/* Quick Stats */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>This Month</Text>
            <View style={styles.statsRow}>
              <StatCard value="2.4M" label="Views" color={colors.teal} />
              <StatCard value="847" label="New Subs" color={colors.lime} />
              <StatCard value="$8.2K" label="Revenue" color={colors.orange} />
            </View>
          </View>

          {/* Support Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <View style={styles.settingsCard}>
              <SettingRow
                icon={<HelpIcon />}
                label="Help Center"
                hasArrow
              />
              <SettingRow
                icon={<ChatIcon />}
                label="Contact Us"
                hasArrow
              />
              <SettingRow
                icon={<ShieldIcon />}
                label="Privacy Policy"
                hasArrow
                noBorder
              />
            </View>
          </View>

          {/* Sign Out */}
          <TouchableOpacity style={styles.signOutButton} activeOpacity={0.7}>
            <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.red} strokeWidth={1.5}>
              <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <Path d="M16 17l5-5-5-5M21 12H9" />
            </Svg>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>

          <Text style={styles.version}>Creator OS v1.0.0</Text>

          <View style={{ height: layout.tabBarHeight + layout.tabBarBottom + 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ============================================
// COMPONENTS
// ============================================

function SettingRow({
  icon,
  label,
  description,
  value,
  hasSwitch,
  hasArrow,
  defaultValue,
  noBorder,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  value?: string;
  hasSwitch?: boolean;
  hasArrow?: boolean;
  defaultValue?: boolean;
  noBorder?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.settingRow, !noBorder && styles.settingRowBorder]}
      activeOpacity={hasSwitch ? 1 : 0.7}
    >
      <View style={styles.settingIcon}>{icon}</View>
      <View style={styles.settingContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDesc}>{description}</Text>}
      </View>
      {value && <Text style={styles.settingValue}>{value}</Text>}
      {hasSwitch && (
        <Switch
          value={defaultValue}
          trackColor={{ false: colors.neutral700, true: colors.teal }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={colors.neutral700}
        />
      )}
      {hasArrow && (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.textTertiary} strokeWidth={1.5}>
          <Path d="M9 18l6-6-6-6" />
        </Svg>
      )}
    </TouchableOpacity>
  );
}

function StatCard({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ============================================
// ICONS
// ============================================

function UserIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5}>
      <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <Circle cx={12} cy={7} r={4} />
    </Svg>
  );
}

function KeyIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5}>
      <Path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </Svg>
  );
}

function BellIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5}>
      <Path d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 01-3.46 0" />
    </Svg>
  );
}

function MoonIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5}>
      <Path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
    </Svg>
  );
}

function SunIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5}>
      <Circle cx={12} cy={12} r={5} />
      <Path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </Svg>
  );
}

function GlobeIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5}>
      <Circle cx={12} cy={12} r={10} />
      <Path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </Svg>
  );
}

function HelpIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5}>
      <Circle cx={12} cy={12} r={10} />
      <Path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <Path d="M12 17h.01" />
    </Svg>
  );
}

function ChatIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5}>
      <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </Svg>
  );
}

function ShieldIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5}>
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
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
  headerLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  headerTitle: {
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

  // Pro Card
  proCard: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    marginBottom: 12,
  },
  proGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  proIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  proContent: {
    flex: 1,
  },
  proTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  proSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // YouTube Card
  youtubeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius['2xl'],
    padding: 16,
    marginBottom: 20,
  },
  youtubeIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.redMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  youtubeContent: {
    flex: 1,
  },
  youtubeChannel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  youtubeSubs: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.tealMuted,
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  connectedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.teal,
  },
  connectedText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.teal,
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    marginBottom: 10,
    marginLeft: 4,
  },

  // Settings Card
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    backgroundColor: colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  settingDesc: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 2,
  },
  settingValue: {
    fontSize: 13,
    color: colors.textTertiary,
  },

  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: 14,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 4,
  },

  // Sign Out
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.redMuted,
    borderRadius: radius['2xl'],
    paddingVertical: 14,
    marginBottom: 16,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.red,
  },

  // Version
  version: {
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
