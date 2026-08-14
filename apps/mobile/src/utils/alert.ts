/**
 * Cross-platform alert helper.
 *
 * React Native's Alert.alert has no implementation on react-native-web —
 * it silently does nothing, so any flow that waits for the user to press
 * "OK" (e.g. navigating after a success message) stalls forever on web
 * with no visible error. This falls back to window.alert there instead.
 */

import { Alert, Platform } from 'react-native';

export function showAlert(title: string, message?: string, onDismiss?: () => void): void {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    onDismiss?.();
    return;
  }

  Alert.alert(title, message, onDismiss ? [{ text: 'OK', onPress: onDismiss }] : undefined);
}
