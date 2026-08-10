/**
 * Modals Layout
 *
 * Modal presentation for detail views and forms.
 */

import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack
      screenOptions={{
        presentation: 'modal',
        headerShown: true,
        headerStyle: {
          backgroundColor: '#1f2937',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '600',
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
