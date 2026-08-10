/**
 * Root Layout
 *
 * Sets up the navigation structure, auth state listener,
 * and global providers for the application.
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';

// DEV MODE: Skip auth imports to avoid Supabase errors
const DEV_SKIP_AUTH = true;

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (DEV_SKIP_AUTH) {
      console.log('🚧 DEV MODE: Auth disabled for UI development');
      return;
    }

    // Auth setup would go here in production
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              backgroundColor: colorScheme === 'dark' ? '#0f0f23' : '#ffffff',
            },
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(main)" options={{ headerShown: false }} />
          <Stack.Screen
            name="(modals)"
            options={{
              presentation: 'modal',
              headerShown: false,
            }}
          />
        </Stack>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
