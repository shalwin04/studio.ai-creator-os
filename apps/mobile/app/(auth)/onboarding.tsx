/**
 * Onboarding Screen
 *
 * Guides new users through connecting their YouTube channel
 * and setting up their creator profile.
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { initiateYouTubeAuth, syncVideos } from '../../src/services/youtube';
import { supabase, updateCreatorProfile } from '../../src/services/supabase';
import { useCreatorStore, useAuthStore } from '../../src/store';

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [isConnecting, setIsConnecting] = useState(false);
  const { setYoutubeConnected, updateProfile } = useCreatorStore();
  const { user } = useAuthStore();

  const handleConnectYouTube = async () => {
    if (!user) return;

    setIsConnecting(true);
    try {
      const result = await initiateYouTubeAuth();

      // Save channel to database
      await supabase.from('youtube_channels').insert({
        creator_id: user.id,
        channel_id: result.channelId,
        title: result.channelTitle,
        access_token: result.accessToken,
        refresh_token: result.refreshToken,
        token_expires_at: result.expiresAt.toISOString(),
        sync_status: 'syncing',
      });

      setYoutubeConnected(true);
      setStep(2);

      // Start initial sync in background
      syncVideos(user.id, true).catch(console.error);
    } catch (error: any) {
      Alert.alert('Connection Failed', error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSkipYouTube = () => {
    setStep(2);
  };

  const handleComplete = async () => {
    if (!user) return;

    try {
      await updateCreatorProfile(user.id, { onboarding_completed: true });
      updateProfile({ onboarding_completed: true });
      router.replace('/(main)/chat');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
          <View style={styles.progressLine} />
          <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
        </View>

        {step === 1 ? (
          <View style={styles.stepContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="logo-youtube" size={64} color="#ef4444" />
            </View>

            <Text style={styles.title}>Connect Your Channel</Text>
            <Text style={styles.description}>
              Connect your YouTube channel to unlock powerful insights about your
              content performance, audience, and growth opportunities.
            </Text>

            <View style={styles.features}>
              <FeatureItem
                icon="analytics-outline"
                text="Performance analytics and insights"
              />
              <FeatureItem
                icon="bulb-outline"
                text="AI-powered content ideas"
              />
              <FeatureItem
                icon="chatbubbles-outline"
                text="Audience sentiment analysis"
              />
              <FeatureItem
                icon="flash-outline"
                text="Highest-impact recommendations"
              />
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, isConnecting && styles.buttonDisabled]}
              onPress={handleConnectYouTube}
              disabled={isConnecting}
            >
              <Ionicons name="logo-youtube" size={22} color="#ffffff" />
              <Text style={styles.primaryButtonText}>
                {isConnecting ? 'Connecting...' : 'Connect YouTube'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleSkipYouTube}
            >
              <Text style={styles.secondaryButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.stepContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle" size={64} color="#10b981" />
            </View>

            <Text style={styles.title}>You're All Set!</Text>
            <Text style={styles.description}>
              Your Creator OS is ready. Start chatting with your AI assistant to
              manage tasks, analyze content, and discover what to focus on next.
            </Text>

            <View style={styles.features}>
              <FeatureItem
                icon="chatbubbles"
                text="Ask anything about your content"
              />
              <FeatureItem
                icon="checkbox"
                text="Create and manage tasks"
              />
              <FeatureItem
                icon="calendar"
                text="Plan your content calendar"
              />
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleComplete}
            >
              <Text style={styles.primaryButtonText}>Start Using Creator OS</Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Ionicons name={icon as any} size={20} color="#6366f1" />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 48,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#374151',
  },
  progressDotActive: {
    backgroundColor: '#6366f1',
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: '#374151',
    marginHorizontal: 8,
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  features: {
    width: '100%',
    marginBottom: 32,
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#e5e7eb',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#9ca3af',
    fontSize: 16,
  },
});
