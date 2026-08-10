/**
 * YouTube Connect Screen
 *
 * Dark racing style: YouTube OAuth connection during onboarding
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useCreatorStore } from '../../src/store';
import { colors, spacing, radius, layout } from '../../src/theme';

export default function YouTubeConnectScreen() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setYoutubeConnected } = useCreatorStore();

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
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* YouTube Hero */}
          <View style={styles.heroCard}>
            <LinearGradient
              colors={['#FF0000', '#CC0000']}
              style={styles.heroGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.youtubeIcon}>
                <Svg width={48} height={48} viewBox="0 0 24 24" fill={colors.text}>
                  <Path d="M23.5 6.2a2.8 2.8 0 00-2-2C19.8 3.8 12 3.8 12 3.8s-7.8 0-9.5.4a2.8 2.8 0 00-2 2 29.4 29.4 0 00-.5 5.8 29.4 29.4 0 00.5 5.8 2.8 2.8 0 002 2c1.7.4 9.5.4 9.5.4s7.8 0 9.5-.4a2.8 2.8 0 002-2 29.4 29.4 0 00.5-5.8 29.4 29.4 0 00-.5-5.8zM9.8 15.5V8.5l6.4 3.5-6.4 3.5z" />
                </Svg>
              </View>
              <Text style={styles.heroTitle}>Connect YouTube</Text>
              <Text style={styles.heroSubtitle}>
                Link your channel to unlock powerful AI insights
              </Text>
            </LinearGradient>
          </View>

          {/* Features */}
          <View style={styles.featuresCard}>
            <Text style={styles.featuresTitle}>What you'll unlock</Text>
            <FeatureItem
              icon="chart"
              text="Real-time analytics and insights"
              color={colors.teal}
            />
            <FeatureItem
              icon="bulb"
              text="AI-powered content recommendations"
              color={colors.orange}
            />
            <FeatureItem
              icon="chat"
              text="Comment analysis and audience insights"
              color={colors.accent}
            />
            <FeatureItem
              icon="zap"
              text="Performance tracking and predictions"
              color={colors.lime}
            />
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorCard}>
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.red} strokeWidth={2}>
                <Circle cx={12} cy={12} r={10} />
                <Path d="M12 8v4M12 16h.01" />
              </Svg>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.connectButton, isConnecting && styles.buttonDisabled]}
              onPress={handleConnectYouTube}
              disabled={isConnecting}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#FF0000', '#CC0000']}
                style={styles.connectGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isConnecting ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <>
                    <Svg width={22} height={22} viewBox="0 0 24 24" fill={colors.text}>
                      <Path d="M23.5 6.2a2.8 2.8 0 00-2-2C19.8 3.8 12 3.8 12 3.8s-7.8 0-9.5.4a2.8 2.8 0 00-2 2 29.4 29.4 0 00-.5 5.8 29.4 29.4 0 00.5 5.8 2.8 2.8 0 002 2c1.7.4 9.5.4 9.5.4s7.8 0 9.5-.4a2.8 2.8 0 002-2 29.4 29.4 0 00.5-5.8 29.4 29.4 0 00-.5-5.8zM9.8 15.5V8.5l6.4 3.5-6.4 3.5z" />
                    </Svg>
                    <Text style={styles.connectText}>Connect YouTube</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>

          {/* Privacy Note */}
          <View style={styles.privacyNote}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={colors.textTertiary} strokeWidth={1.5}>
              <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </Svg>
            <Text style={styles.privacyText}>
              We only request read-only access. You can disconnect anytime from settings.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function FeatureItem({ icon, text, color }: { icon: string; text: string; color: string }) {
  const icons: Record<string, React.ReactNode> = {
    chart: (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <Path d="M18 20V10M12 20V4M6 20v-6" />
      </Svg>
    ),
    bulb: (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <Path d="M9 18h6M10 22h4M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14" />
      </Svg>
    ),
    chat: (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </Svg>
    ),
    zap: (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <Path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </Svg>
    ),
  };

  return (
    <View style={styles.featureItem}>
      <View style={[styles.featureIcon, { backgroundColor: `${color}15` }]}>
        {icons[icon]}
      </View>
      <Text style={styles.featureText}>{text}</Text>
    </View>
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
  content: {
    flex: 1,
    paddingHorizontal: layout.screenPadding,
    paddingTop: 40,
    justifyContent: 'center',
  },

  // Hero Card
  heroCard: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    marginBottom: 20,
  },
  heroGradient: {
    padding: 32,
    alignItems: 'center',
  },
  youtubeIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },

  // Features Card
  featuresCard: {
    backgroundColor: colors.surface,
    borderRadius: radius['2xl'],
    padding: 20,
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },

  // Error
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.redMuted,
    borderRadius: radius.xl,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: colors.red,
  },

  // Buttons
  buttonsContainer: {
    marginBottom: 20,
  },
  connectButton: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  connectGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    gap: 10,
  },
  connectText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  skipButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },

  // Privacy Note
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: colors.textTertiary,
    lineHeight: 18,
    textAlign: 'center',
  },
});
