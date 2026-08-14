/**
 * Onboarding Screen
 *
 * Dark racing style: Bold hero sections, gradient cards, modern flow
 */

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { startYoutubeConnect } from '../../src/services/youtube';
import { showAlert } from '../../src/utils/alert';
import { useCreatorStore } from '../../src/store';
import { colors, spacing, radius, layout } from '../../src/theme';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
  const params = useLocalSearchParams<{ success?: string; error?: string }>();
  const [step, setStep] = useState(params.success === 'true' ? 2 : 1);
  const [isConnecting, setIsConnecting] = useState(false);
  const { setYoutubeConnected, updateProfile } = useCreatorStore();

  // Returning here after a web-based OAuth redirect round trip.
  useEffect(() => {
    if (params.success === 'true') {
      setYoutubeConnected(true);
    } else if (params.error) {
      showAlert('Connection Failed', String(params.error));
    }
  }, [params.success, params.error]);

  const handleConnectYouTube = async () => {
    setIsConnecting(true);
    try {
      // Groups like (auth) don't appear in the resolved web URL.
      const result = await startYoutubeConnect('/onboarding');

      if (result === 'success') {
        setYoutubeConnected(true);
        setStep(2);
      }
      // 'web-redirect' navigates the tab away — nothing more to do here.
    } catch (error: any) {
      showAlert('Connection Failed', error.message ?? 'Please try again');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSkipYouTube = () => {
    setStep(2);
  };

  const handleComplete = async () => {
    // Local state only for now — persisting onboarding_completed to the
    // backend isn't wired up yet (no PATCH /api/auth/me endpoint exists).
    updateProfile({ onboarding_completed: true });
    router.replace('/(main)/chat');
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
            <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
            <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
          </View>

          {step === 1 ? (
            <View style={styles.stepContent}>
              {/* YouTube Hero Card */}
              <View style={styles.heroCard}>
                <LinearGradient
                  colors={['#FF0000', '#CC0000']}
                  style={styles.heroGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.youtubeIconLarge}>
                    <Svg width={48} height={48} viewBox="0 0 24 24" fill={colors.text}>
                      <Path d="M23.5 6.2a2.8 2.8 0 00-2-2C19.8 3.8 12 3.8 12 3.8s-7.8 0-9.5.4a2.8 2.8 0 00-2 2 29.4 29.4 0 00-.5 5.8 29.4 29.4 0 00.5 5.8 2.8 2.8 0 002 2c1.7.4 9.5.4 9.5.4s7.8 0 9.5-.4a2.8 2.8 0 002-2 29.4 29.4 0 00.5-5.8 29.4 29.4 0 00-.5-5.8zM9.8 15.5V8.5l6.4 3.5-6.4 3.5z" />
                    </Svg>
                  </View>
                  <Text style={styles.heroTitle}>Connect YouTube</Text>
                  <Text style={styles.heroSubtitle}>
                    Unlock powerful insights about your content, audience, and growth
                  </Text>
                </LinearGradient>
              </View>

              {/* Features */}
              <View style={styles.featuresCard}>
                <Text style={styles.featuresTitle}>What you'll get</Text>
                <FeatureItem
                  icon="chart"
                  text="Performance analytics and insights"
                  color={colors.teal}
                />
                <FeatureItem
                  icon="bulb"
                  text="AI-powered content ideas"
                  color={colors.orange}
                />
                <FeatureItem
                  icon="chat"
                  text="Audience sentiment analysis"
                  color={colors.accent}
                />
                <FeatureItem
                  icon="zap"
                  text="Highest-impact recommendations"
                  color={colors.lime}
                />
              </View>

              {/* Buttons */}
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={[styles.primaryButton, isConnecting && styles.buttonDisabled]}
                  onPress={handleConnectYouTube}
                  disabled={isConnecting}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#FF0000', '#CC0000']}
                    style={styles.buttonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Svg width={22} height={22} viewBox="0 0 24 24" fill={colors.text}>
                      <Path d="M23.5 6.2a2.8 2.8 0 00-2-2C19.8 3.8 12 3.8 12 3.8s-7.8 0-9.5.4a2.8 2.8 0 00-2 2 29.4 29.4 0 00-.5 5.8 29.4 29.4 0 00.5 5.8 2.8 2.8 0 002 2c1.7.4 9.5.4 9.5.4s7.8 0 9.5-.4a2.8 2.8 0 002-2 29.4 29.4 0 00.5-5.8 29.4 29.4 0 00-.5-5.8zM9.8 15.5V8.5l6.4 3.5-6.4 3.5z" />
                    </Svg>
                    <Text style={styles.primaryButtonText}>
                      {isConnecting ? 'Connecting...' : 'Connect YouTube'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={handleSkipYouTube}
                  activeOpacity={0.7}
                >
                  <Text style={styles.secondaryButtonText}>Skip for now</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.stepContent}>
              {/* Success Hero */}
              <View style={styles.successCard}>
                <LinearGradient
                  colors={[colors.teal, colors.mercedes]}
                  style={styles.successGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.successIcon}>
                    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke={colors.text} strokeWidth={2.5}>
                      <Path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                      <Path d="M22 4L12 14.01l-3-3" />
                    </Svg>
                  </View>
                  <Text style={styles.successTitle}>You're All Set!</Text>
                  <Text style={styles.successSubtitle}>
                    Your Creator OS is ready. Let's start building your empire.
                  </Text>
                </LinearGradient>
              </View>

              {/* What's Next */}
              <View style={styles.featuresCard}>
                <Text style={styles.featuresTitle}>What you can do</Text>
                <FeatureItem
                  icon="chat"
                  text="Ask anything about your content"
                  color={colors.lime}
                />
                <FeatureItem
                  icon="check"
                  text="Create and manage tasks"
                  color={colors.teal}
                />
                <FeatureItem
                  icon="calendar"
                  text="Plan your content calendar"
                  color={colors.orange}
                />
                <FeatureItem
                  icon="chart"
                  text="Track your channel growth"
                  color={colors.accent}
                />
              </View>

              {/* Get Started Button */}
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleComplete}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.lime, '#C8E600']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.startButtonText}>Start Using Creator OS</Text>
                  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.background} strokeWidth={2}>
                    <Path d="M5 12h14M12 5l7 7-7 7" />
                  </Svg>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
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
    check: (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <Path d="M9 11l3 3L22 4" />
        <Path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </Svg>
    ),
    calendar: (
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5}>
        <Rect x={3} y={4} width={18} height={18} rx={2} />
        <Path d="M16 2v4M8 2v4M3 10h18" />
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
    paddingTop: 24,
  },

  // Progress
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.surfaceElevated,
  },
  progressDotActive: {
    backgroundColor: colors.lime,
  },
  progressLine: {
    width: 48,
    height: 2,
    backgroundColor: colors.surfaceElevated,
    marginHorizontal: 8,
  },
  progressLineActive: {
    backgroundColor: colors.lime,
  },

  // Step Content
  stepContent: {
    flex: 1,
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
  youtubeIconLarge: {
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
    lineHeight: 22,
  },

  // Success Card
  successCard: {
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    marginBottom: 20,
  },
  successGradient: {
    padding: 32,
    alignItems: 'center',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  successSubtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
    lineHeight: 22,
  },

  // Features Card
  featuresCard: {
    backgroundColor: colors.surface,
    borderRadius: radius['2xl'],
    padding: 20,
    marginBottom: 24,
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

  // Buttons
  buttonsContainer: {
    marginTop: 'auto',
    paddingBottom: 40,
  },
  primaryButton: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    gap: 10,
  },
  primaryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  startButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
});
