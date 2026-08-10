/**
 * Main App Layout
 *
 * Fintech-inspired: Floating tab bar with center FAB
 */

import { Tabs, useRouter } from 'expo-router';
import { View, StyleSheet, TouchableOpacity, Modal, Text, Pressable } from 'react-native';
import { useState } from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { colors, spacing, radius, layout, typography, shadows } from '../../src/theme';

export default function MainLayout() {
  const [moreOpen, setMoreOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textTertiary,
          tabBarShowLabel: false,
          tabBarItemStyle: styles.tabBarItem,
        }}
      >
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <View style={styles.tabIcon}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill={focused ? color : 'none'} stroke={color} strokeWidth={focused ? 0 : 1.5}>
                  {focused ? (
                    <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  ) : (
                    <>
                      <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                      <Path d="M9 22V12h6v10" />
                    </>
                  )}
                </Svg>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="timeline"
          options={{
            title: 'Deals',
            tabBarIcon: ({ color }) => (
              <View style={styles.tabIcon}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
                  <Path d="M17 3v18M7 21V3" />
                  <Path d="M21 7l-4-4-4 4M3 17l4 4 4-4" />
                </Svg>
              </View>
            ),
          }}
        />
        {/* Center spacer for FAB */}
        <Tabs.Screen
          name="index"
          options={{
            tabBarButton: () => (
              <View style={styles.fabSpacer} />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color }) => (
              <View style={styles.tabIcon}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
                  <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </Svg>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'More',
            tabBarButton: () => (
              <TouchableOpacity
                onPress={() => setMoreOpen(true)}
                style={styles.tabButton}
                activeOpacity={0.7}
              >
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={colors.textTertiary} strokeWidth={1.5}>
                  <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                  <Path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
                </Svg>
              </TouchableOpacity>
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            href: null,
          }}
        />
      </Tabs>

      {/* Center FAB */}
      <View style={styles.fabContainer}>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setCreateOpen(true)}
          activeOpacity={0.9}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.5}>
            <Path d="M12 5v14M5 12h14" />
          </Svg>
        </TouchableOpacity>
      </View>

      {/* Create Modal */}
      <Modal
        visible={createOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setCreateOpen(false)}>
          <View style={styles.createSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Create New</Text>

            <View style={styles.createOptions}>
              <CreateOption
                icon={<BulbIcon />}
                label="Video Idea"
                description="Add a new content idea"
                onPress={() => setCreateOpen(false)}
              />
              <CreateOption
                icon={<TaskIcon />}
                label="Task"
                description="Create a task or reminder"
                onPress={() => setCreateOpen(false)}
              />
              <CreateOption
                icon={<DealIcon />}
                label="Deal"
                description="Track a new sponsorship"
                onPress={() => setCreateOpen(false)}
              />
              <CreateOption
                icon={<CalendarIcon />}
                label="Event"
                description="Schedule on calendar"
                onPress={() => {
                  setCreateOpen(false);
                  router.push('/(main)/calendar');
                }}
              />
            </View>
          </View>
        </Pressable>
      </Modal>

      {/* More Sheet */}
      <Modal
        visible={moreOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setMoreOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setMoreOpen(false)}>
          <View style={styles.moreSheet}>
            <View style={styles.sheetHandle} />

            <MoreOption
              icon={<CalendarIcon />}
              label="Calendar"
              onPress={() => {
                setMoreOpen(false);
                router.push('/(main)/calendar');
              }}
            />
            <MoreOption
              icon={<AnalyticsIcon />}
              label="Analytics"
              onPress={() => setMoreOpen(false)}
            />
            <MoreOption
              icon={<PipelineIcon />}
              label="Pipeline"
              onPress={() => setMoreOpen(false)}
            />
            <MoreOption
              icon={<SettingsIcon />}
              label="Settings"
              onPress={() => {
                setMoreOpen(false);
                router.push('/(main)/settings');
              }}
              noBorder
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

// ============================================
// CREATE OPTION COMPONENT
// ============================================

function CreateOption({
  icon,
  label,
  description,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.createOption} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.createOptionIcon}>{icon}</View>
      <View style={styles.createOptionInfo}>
        <Text style={styles.createOptionLabel}>{label}</Text>
        <Text style={styles.createOptionDesc}>{description}</Text>
      </View>
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.textTertiary} strokeWidth={1.5}>
        <Path d="M9 18l6-6-6-6" />
      </Svg>
    </TouchableOpacity>
  );
}

// ============================================
// MORE OPTION COMPONENT
// ============================================

function MoreOption({
  icon,
  label,
  onPress,
  noBorder,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  noBorder?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.moreOption, !noBorder && styles.moreOptionBorder]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.moreOptionIcon}>{icon}</View>
      <Text style={styles.moreOptionLabel}>{label}</Text>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={colors.textTertiary} strokeWidth={1.5}>
        <Path d="M9 18l6-6-6-6" />
      </Svg>
    </TouchableOpacity>
  );
}

// ============================================
// ICONS
// ============================================

function BulbIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.warning} strokeWidth={1.5}>
      <Path d="M9 18h6M10 22h4" />
      <Path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14" />
    </Svg>
  );
}

function TaskIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.info} strokeWidth={1.5}>
      <Path d="M9 11l3 3L22 4" />
      <Path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </Svg>
  );
}

function DealIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.teal} strokeWidth={1.5}>
      <Path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
    </Svg>
  );
}

function CalendarIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={1.5}>
      <Rect x={3} y={4} width={18} height={18} rx={2} />
      <Path d="M16 2v4M8 2v4M3 10h18" />
    </Svg>
  );
}

function AnalyticsIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={1.5}>
      <Path d="M18 20V10M12 20V4M6 20v-6" />
    </Svg>
  );
}

function PipelineIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={1.5}>
      <Path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </Svg>
  );
}

function SettingsIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={colors.accent} strokeWidth={1.5}>
      <Circle cx={12} cy={12} r={3} />
      <Path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
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
  tabBar: {
    position: 'absolute',
    bottom: layout.tabBarBottom,
    left: layout.tabBarHorizontal,
    right: layout.tabBarHorizontal,
    height: layout.tabBarHeight,
    backgroundColor: colors.surface,
    borderRadius: radius['2xl'],
    borderTopWidth: 0,
    paddingHorizontal: 4,
    paddingTop: 0,
    paddingBottom: 0,
    ...shadows.lg,
  },
  tabBarItem: {
    flex: 1,
    height: layout.tabBarHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 0,
    paddingBottom: 0,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // FAB Spacer - creates gap in middle of tab bar
  fabSpacer: {
    width: layout.fabSize,
    height: layout.tabBarHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: layout.tabBarBottom + (layout.tabBarHeight - layout.fabSize) / 2,
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'box-none',
  },
  fab: {
    width: layout.fabSize,
    height: layout.fabSize,
    borderRadius: layout.fabSize / 2,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.lg,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'flex-end',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.neutral300,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
  },

  // Create Sheet
  createSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    paddingHorizontal: spacing.xl,
    paddingTop: 16,
    paddingBottom: 40,
  },
  createOptions: {
    gap: 4,
  },
  createOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.xl,
    padding: 16,
    gap: 14,
  },
  createOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createOptionInfo: {
    flex: 1,
  },
  createOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  createOptionDesc: {
    fontSize: 13,
    color: colors.textTertiary,
    marginTop: 2,
  },

  // More Sheet
  moreSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius['2xl'],
    borderTopRightRadius: radius['2xl'],
    paddingHorizontal: spacing.xl,
    paddingTop: 16,
    paddingBottom: 40,
  },
  moreOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  moreOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  moreOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  moreOptionLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
});
