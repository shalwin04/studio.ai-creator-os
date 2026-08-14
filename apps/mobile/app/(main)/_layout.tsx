/**
 * Main App Layout
 *
 * Dark racing app style: Compact floating tab bar
 */

import { useEffect } from 'react';
import { Redirect, Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Rect, Circle } from 'react-native-svg';
import { apiGetMe, mapCreator } from '../../src/services/api';
import { useAuthStore, useCreatorStore } from '../../src/store';
import { colors, radius, layout } from '../../src/theme';

export default function MainLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const profile = useCreatorStore((state) => state.profile);

  // `isAuthenticated` persists across a full page reload, but `profile`
  // deliberately doesn't (see store/index.ts) — so any reload that lands
  // back in (main) (e.g. the web YouTube-connect round trip) leaves us
  // authenticated with no profile loaded. Re-fetch it once when that happens.
  useEffect(() => {
    if (!isAuthenticated || profile) return;

    apiGetMe()
      .then((creator) => useCreatorStore.getState().setProfile(mapCreator(creator)))
      .catch(() => {
        // Stored token is invalid/expired — drop the stale auth flag so the
        // guard below sends the user to login instead of a broken screen.
        useAuthStore.getState().signOut();
        useCreatorStore.getState().setProfile(null);
      });
  }, [isAuthenticated, profile]);

  // Nothing else guards this group — without this, an unauthenticated user
  // (e.g. session cleared, direct deep link) can sit on any (main) screen
  // with no access token, silently failing every API call instead of being
  // sent to login.
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: colors.text,
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
              <View style={[styles.iconWrap, focused && styles.iconActive]}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill={focused ? color : 'none'} stroke={color} strokeWidth={1.5}>
                  <Path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </Svg>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: 'Schedule',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrap, focused && styles.iconActive]}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
                  <Rect x={3} y={4} width={18} height={18} rx={2} />
                  <Path d="M16 2v4M8 2v4M3 10h18" />
                </Svg>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="timeline"
          options={{
            title: 'Stats',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrap, focused && styles.iconActive]}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
                  <Path d="M18 20V10M12 20V4M6 20v-6" />
                </Svg>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrap, focused && styles.iconActive]}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
                  <Circle cx={12} cy={12} r={3} />
                  <Path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </Svg>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'AI',
            tabBarIcon: ({ color, focused }) => (
              <View style={[styles.iconWrap, focused && styles.iconActive]}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
                  <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </Svg>
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </View>
  );
}

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
    borderRadius: radius.xl,
    borderTopWidth: 0,
    paddingHorizontal: 0,
    paddingBottom: 0,
    paddingTop: 0,
  },
  tabBarItem: {
    height: layout.tabBarHeight,
    paddingTop: 0,
    paddingBottom: 0,
  },
  iconWrap: {
    width: 40,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  iconActive: {
    backgroundColor: colors.surfaceElevated,
  },
});
