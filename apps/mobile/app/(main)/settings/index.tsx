/**
 * Settings / Profile Screen
 *
 * Fintech-inspired: Clean profile with account cards
 */

import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { colors, spacing, typography, radius, layout, shadows } from '../../../src/theme';

const PROFILE = {
  name: 'James Chen',
  email: 'james@creator.com',
  channel: 'TechWithJames',
  subs: '124.5K',
};

export default function SettingsScreen() {
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
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2}>
                <Path d="M15 18l-6-6 6-6" />
              </Svg>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Settings</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>J</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{PROFILE.name}</Text>
              <Text style={styles.profileEmail}>{PROFILE.email}</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={1.5}>
                <Path d="M17 3a2.83 2.83 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
              </Svg>
            </TouchableOpacity>
          </View>

          {/* YouTube Connection */}
          <TouchableOpacity style={styles.connectionCard} activeOpacity={0.7}>
            <View style={styles.connectionIcon}>
              <Svg width={24} height={24} viewBox="0 0 24 24" fill="#FF0000">
                <Path d="M23.5 6.2a2.8 2.8 0 00-2-2C19.8 3.8 12 3.8 12 3.8s-7.8 0-9.5.4a2.8 2.8 0 00-2 2 29.4 29.4 0 00-.5 5.8 29.4 29.4 0 00.5 5.8 2.8 2.8 0 002 2c1.7.4 9.5.4 9.5.4s7.8 0 9.5-.4a2.8 2.8 0 002-2 29.4 29.4 0 00.5-5.8 29.4 29.4 0 00-.5-5.8zM9.8 15.5V8.5l6.4 3.5-6.4 3.5z" />
              </Svg>
            </View>
            <View style={styles.connectionInfo}>
              <Text style={styles.connectionName}>{PROFILE.channel}</Text>
              <Text style={styles.connectionSubs}>{PROFILE.subs} subscribers</Text>
            </View>
            <View style={styles.connectedBadge}>
              <View style={styles.connectedDot} />
              <Text style={styles.connectedText}>Connected</Text>
            </View>
          </TouchableOpacity>

          {/* Notifications Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View style={styles.settingsCard}>
              <SettingRow
                icon={<SunIcon />}
                label="Daily briefing"
                description="Morning summary at 8 AM"
                hasSwitch
                defaultValue={true}
              />
              <View style={styles.settingDivider} />
              <SettingRow
                icon={<BellIcon />}
                label="Push notifications"
                description="Deadlines and updates"
                hasSwitch
                defaultValue={true}
              />
              <View style={styles.settingDivider} />
              <SettingRow
                icon={<MailIcon />}
                label="Email digest"
                description="Weekly performance report"
                hasSwitch
                defaultValue={false}
              />
            </View>
          </View>

          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.settingsCard}>
              <SettingRow
                icon={<PaletteIcon />}
                label="Appearance"
                value="Light"
                hasArrow
              />
              <View style={styles.settingDivider} />
              <SettingRow
                icon={<GlobeIcon />}
                label="Language"
                value="English"
                hasArrow
              />
              <View style={styles.settingDivider} />
              <SettingRow
                icon={<CurrencyIcon />}
                label="Currency"
                value="USD"
                hasArrow
              />
            </View>
          </View>

          {/* Support Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Support</Text>
            <View style={styles.settingsCard}>
              <SettingRow
                icon={<HelpIcon />}
                label="Help center"
                hasArrow
              />
              <View style={styles.settingDivider} />
              <SettingRow
                icon={<ChatIcon />}
                label="Contact support"
                hasArrow
              />
              <View style={styles.settingDivider} />
              <SettingRow
                icon={<ShieldIcon />}
                label="Privacy policy"
                hasArrow
              />
            </View>
          </View>

          {/* Sign Out */}
          <TouchableOpacity style={styles.signOutButton} activeOpacity={0.7}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.error} strokeWidth={1.5}>
              <Path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
              <Path d="M16 17l5-5-5-5M21 12H9" />
            </Svg>
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>

          <Text style={styles.version}>Creator OS v1.0.0</Text>

          <View style={{ height: layout.tabBarHeight + layout.tabBarBottom + 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// Setting Row Component
function SettingRow({
  icon,
  label,
  description,
  value,
  hasSwitch,
  hasArrow,
  defaultValue,
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  value?: string;
  hasSwitch?: boolean;
  hasArrow?: boolean;
  defaultValue?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.settingRow} activeOpacity={hasSwitch ? 1 : 0.7}>
      <View style={styles.settingIconWrap}>{icon}</View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDesc}>{description}</Text>}
      </View>
      {value && <Text style={styles.settingValue}>{value}</Text>}
      {hasSwitch && (
        <Switch
          value={defaultValue}
          trackColor={{ false: colors.neutral300, true: colors.teal }}
          thumbColor="#FFFFFF"
          ios_backgroundColor={colors.neutral300}
        />
      )}
      {hasArrow && (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.textTertiary} strokeWidth={1.5}>
          <Path d="M9 18l6-6-6-6" />
        </Svg>
      )}
    </TouchableOpacity>
  );
}

// Icons
function SunIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.warning} strokeWidth={1.5}>
      <Circle cx={12} cy={12} r={5} />
      <Path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </Svg>
  );
}

function BellIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.info} strokeWidth={1.5}>
      <Path d="M18 8A6 6 0 106 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 01-3.46 0" />
    </Svg>
  );
}

function MailIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.teal} strokeWidth={1.5}>
      <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <Path d="M22 6l-10 7L2 6" />
    </Svg>
  );
}

function PaletteIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={1.5}>
      <Circle cx={12} cy={12} r={10} />
      <Circle cx={12} cy={8} r={1.5} fill={colors.accent} />
      <Circle cx={8} cy={12} r={1.5} fill={colors.accent} />
      <Circle cx={16} cy={12} r={1.5} fill={colors.accent} />
      <Circle cx={12} cy={16} r={1.5} fill={colors.accent} />
    </Svg>
  );
}

function GlobeIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.teal} strokeWidth={1.5}>
      <Circle cx={12} cy={12} r={10} />
      <Path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </Svg>
  );
}

function CurrencyIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.warning} strokeWidth={1.5}>
      <Path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </Svg>
  );
}

function HelpIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth={1.5}>
      <Circle cx={12} cy={12} r={10} />
      <Path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <Circle cx={12} cy={17} r={0.5} fill={colors.textSecondary} />
    </Svg>
  );
}

function ChatIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth={1.5}>
      <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </Svg>
  );
}

function ShieldIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.textSecondary} strokeWidth={1.5}>
      <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </Svg>
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
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginRight: 40,
  },
  headerSpacer: {
    width: 40,
  },

  // Profile Card
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius['2xl'],
    padding: 16,
    marginBottom: 12,
    gap: 14,
    ...shadows.sm,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.tealMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.teal,
  },
  profileAvatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.teal,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  profileEmail: {
    fontSize: 14,
    color: colors.textTertiary,
    marginTop: 2,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Connection Card
  connectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius['2xl'],
    padding: 16,
    marginBottom: 24,
    gap: 14,
    ...shadows.sm,
  },
  connectionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.errorMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionInfo: {
    flex: 1,
  },
  connectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  connectionSubs: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 2,
  },
  connectedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    fontSize: 12,
    fontWeight: '600',
    color: colors.teal,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },

  // Settings Card
  settingsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    ...shadows.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  settingDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginLeft: 66,
  },
  settingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
  },
  settingDesc: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 2,
  },
  settingValue: {
    fontSize: 14,
    color: colors.textTertiary,
  },

  // Sign Out
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.errorMuted,
    borderRadius: radius['2xl'],
    paddingVertical: 16,
    marginBottom: 16,
  },
  signOutText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.error,
  },

  // Version
  version: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
  },
});
