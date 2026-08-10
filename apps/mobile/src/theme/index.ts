/**
 * Design System Theme
 *
 * Dark racing app style: Pure black, neon accents, bold typography
 * Inspired by F1/motorsport apps
 */

// ============================================
// COLORS - Dark Racing Palette
// ============================================

export const colors = {
  // Base - Pure Black
  background: '#000000',
  surface: '#1C1C1E',
  surfaceElevated: '#2C2C2E',
  card: '#1C1C1E',

  // Text - White/Gray hierarchy
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#636366',
  textDisabled: '#48484A',

  // Primary Accent - Electric Blue
  accent: '#5B6EF7',
  accentLight: '#7B8BFF',
  accentDark: '#4A5AE6',
  accentMuted: 'rgba(91, 110, 247, 0.15)',

  // Secondary Accents
  lime: '#D4FF00',
  limeMuted: 'rgba(212, 255, 0, 0.15)',

  orange: '#FF6B35',
  orangeLight: '#FF8F5C',
  orangeMuted: 'rgba(255, 107, 53, 0.15)',

  red: '#E53935',
  redLight: '#FF5252',
  redMuted: 'rgba(229, 57, 53, 0.15)',

  teal: '#00BFA5',
  tealLight: '#1DE9B6',
  tealMuted: 'rgba(0, 191, 165, 0.15)',

  green: '#4CAF50',
  greenMuted: 'rgba(76, 175, 80, 0.15)',

  // Team Colors (for variety)
  ferrari: '#DC0000',
  mercedes: '#00D2BE',
  redbull: '#1E41FF',
  mclaren: '#FF8700',

  // Neutral Ramp
  neutral100: '#F5F5F5',
  neutral200: '#E5E5EA',
  neutral300: '#D1D1D6',
  neutral400: '#C7C7CC',
  neutral500: '#8E8E93',
  neutral600: '#636366',
  neutral700: '#48484A',
  neutral800: '#3A3A3C',
  neutral900: '#2C2C2E',

  // Borders
  border: 'rgba(255, 255, 255, 0.1)',
  borderLight: 'rgba(255, 255, 255, 0.06)',
  borderAccent: 'rgba(91, 110, 247, 0.3)',

  // Semantic
  success: '#4CAF50',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#5B6EF7',

  // Semantic muted
  successMuted: 'rgba(76, 175, 80, 0.15)',
  warningMuted: 'rgba(255, 149, 0, 0.15)',
  errorMuted: 'rgba(255, 59, 48, 0.15)',
  infoMuted: 'rgba(91, 110, 247, 0.15)',

  // Divider
  divider: 'rgba(255, 255, 255, 0.08)',

  // Gradients (as arrays for LinearGradient)
  gradientOrange: ['#FF8C00', '#FF5722'],
  gradientTeal: ['#00BFA5', '#00897B'],
  gradientGreen: ['#4CAF50', '#2E7D32'],
  gradientBlue: ['#5B6EF7', '#3949AB'],
};

// ============================================
// SPACING
// ============================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 48,
};

// ============================================
// TYPOGRAPHY - Bold, Racing Style
// ============================================

export const typography = {
  // Massive display for hero numbers
  display: {
    fontSize: 56,
    lineHeight: 64,
    fontWeight: '800' as const,
    letterSpacing: -2,
  },
  // Large numbers
  hero: {
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '700' as const,
    letterSpacing: -1.5,
  },
  // Section headers
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  // Subtitles
  subtitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  // Body text
  body: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  // Captions
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
  // Small labels/badges
  small: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  // Uppercase labels
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
  },

  // Weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

// ============================================
// BORDER RADIUS - Smooth and Modern
// ============================================

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

// ============================================
// SHADOWS - Subtle on dark
// ============================================

export const shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#5B6EF7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
};

// ============================================
// COMPONENT TOKENS
// ============================================

export const components = {
  // Cards
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },

  // Buttons
  buttonPrimary: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    height: 48,
    paddingHorizontal: spacing['2xl'],
  },
  buttonSecondary: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.full,
    height: 48,
    paddingHorizontal: spacing['2xl'],
  },
  buttonLime: {
    backgroundColor: colors.lime,
    borderRadius: radius.xl,
    height: 48,
    paddingHorizontal: spacing['2xl'],
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    height: 48,
    paddingHorizontal: spacing['2xl'],
  },

  // Inputs
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 0,
    height: 52,
    paddingHorizontal: spacing.lg,
  },

  // Tags/Badges
  tag: {
    backgroundColor: colors.accentMuted,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },

  // Pill button (like "Get Ultra")
  pill: {
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
};

// ============================================
// LAYOUT CONSTANTS
// ============================================

export const layout = {
  screenPadding: 20,
  tabBarHeight: 52,
  tabBarBottom: 28,
  tabBarHorizontal: 48,
  inputBarHeight: 56,
  headerHeight: 56,
};

export default {
  colors,
  spacing,
  typography,
  radius,
  shadows,
  components,
  layout,
};
