/**
 * YouTube Connect Screen
 *
 * Handles YouTube OAuth connection during onboarding.
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  useColorScheme,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCreatorStore } from '../../src/store';

export default function YouTubeConnectScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setYoutubeConnected } = useCreatorStore();

  const colors = {
    background: isDark ? '#0f0f23' : '#ffffff',
    card: isDark ? '#1a1a2e' : '#f8f9fa',
    text: isDark ? '#ffffff' : '#1a1a2e',
    textSecondary: isDark ? '#a0a0b0' : '#6b7280',
    primary: '#ff0000', // YouTube red
    border: isDark ? '#2a2a3e' : '#e5e7eb',
  };

  const handleConnectYouTube = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // TODO: Implement YouTube OAuth flow
      // This will redirect to the backend which handles OAuth
      // const authUrl = `${process.env.EXPO_PUBLIC_API_URL}/api/auth/youtube`;
      // const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      // For now, simulate connection
      await new Promise(resolve => setTimeout(resolve, 2000));

      setYoutubeConnected(true);
      router.replace('/(main)/chat');
    } catch (err) {
      setError('Failed to connect YouTube. Please try again.');
      console.error('YouTube connect error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(main)/chat');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* YouTube Logo */}
        <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
          <Ionicons name="logo-youtube" size={64} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          Connect Your YouTube Channel
        </Text>

        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Connect your YouTube channel to unlock powerful features:
        </Text>

        {/* Features List */}
        <View style={styles.featuresList}>
          {[
            'Real-time analytics and insights',
            'AI-powered content recommendations',
            'Comment analysis and audience insights',
            'Performance tracking and predictions',
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color="#10b981"
                style={styles.featureIcon}
              />
              <Text style={[styles.featureText, { color: colors.text }]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Connect Button */}
        <TouchableOpacity
          style={[styles.connectButton, { backgroundColor: colors.primary }]}
          onPress={handleConnectYouTube}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="logo-youtube" size={24} color="#ffffff" />
              <Text style={styles.connectButtonText}>Connect YouTube</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Skip Button */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipButtonText, { color: colors.textSecondary }]}>
            Skip for now
          </Text>
        </TouchableOpacity>

        <Text style={[styles.privacyNote, { color: colors.textSecondary }]}>
          We only request read-only access to your channel data.{'\n'}
          You can disconnect at any time from settings.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  featuresList: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    flex: 1,
  },
  errorContainer: {
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  errorText: {
    color: '#dc2626',
    textAlign: 'center',
    fontSize: 14,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignSelf: 'stretch',
    gap: 12,
  },
  connectButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    marginTop: 16,
    padding: 12,
  },
  skipButtonText: {
    fontSize: 16,
  },
  privacyNote: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
    lineHeight: 18,
  },
});
