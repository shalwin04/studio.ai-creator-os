/**
 * Auth Layout
 *
 * Handles authentication flow including login, register, and onboarding.
 */

import { Redirect, Stack, useSegments } from 'expo-router';
import { useAuthStore, useCreatorStore } from '../../src/store';
import { ActivityIndicator, View } from 'react-native';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const { isOnboarded } = useCreatorStore();
  // This layout wraps every screen in the (auth) group, including
  // onboarding itself — redirects below must not target the screen
  // that's already active, or the layout redirects to itself forever.
  const segments = useSegments();
  const isOnOnboarding = (segments as string[]).includes('onboarding');

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // Redirect to main app if authenticated and onboarded
  if (isAuthenticated && isOnboarded) {
    return <Redirect href="/(main)/chat" />;
  }

  // Redirect to onboarding if authenticated but not onboarded
  if (isAuthenticated && !isOnboarded && !isOnOnboarding) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="youtube-connect" />
    </Stack>
  );
}
