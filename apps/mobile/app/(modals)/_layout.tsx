/**
 * Modals Layout
 *
 * Dark racing style: Modal presentation for detail views and forms.
 */

import { Stack } from 'expo-router';
import { colors } from '../../src/theme';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: 'modal',
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '600',
          fontSize: 16,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="task-detail"
        options={{
          title: 'Task Details',
        }}
      />
      <Stack.Screen
        name="idea-detail"
        options={{
          title: 'Content Idea',
        }}
      />
      <Stack.Screen
        name="video-detail"
        options={{
          title: 'Video Performance',
        }}
      />
    </Stack>
  );
}
