/**
 * Design System Theme
 *
 * Fintech/Wallet-inspired: Warm beige, dark navy, teal accents
 * Clean cards, soft shadows, rounded corners
 */

// ============================================
// COLORS - Fintech Warm Palette
// ============================================

export const colors = {
  // Base - Warm Beige/Cream
  background: '#F5F2ED',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  elevated: '#FFFFFF',

  // Text - Dark Navy/Charcoal
  text: '#1A1A1A',
  textSecondary: '#5C5C5C',
  textTertiary: '#8E8E8E',
  textDisabled: '#B8B8B8',

  // Primary Accent - Dark Navy
  accent: '#1C1C1E',
  accentDark: '#000000',
  accentLight: '#3A3A3C',
  accentMuted: 'rgba(28, 28, 30, 0.08)',
  accentSubtle: 'rgba(28, 28, 30, 0.04)',

  // Secondary - Teal/Green (for positive values)
  teal: '#2E9E8F',
  tealLight: '#4ECDC4',
  tealMuted: 'rgba(46, 158, 143, 0.12)',

  // Neutral Ramp
  neutral100: '#FAFAF8',
  neutral200: '#F5F3F0',
  neutral300: '#E8E6E3',
  neutral400: '#D4D2CF',
  neutral500: '#A8A6A3',
  neutral600: '#787674',
  neutral700: '#545250',
  neutral800: '#363432',
  neutral900: '#1A1A1A',

  // Accent Ramp (Navy)
  accent100: '#F0F0F2',
  accent200: '#E0E0E4',
  accent300: '#C0C0C6',
  accent400: '#8E8E96',
  accent500: '#5C5C64',
  accent600: '#3A3A42',
  accent700: '#2A2A32',
  accent800: '#1C1C1E',
  accent900: '#0A0A0C',

  // Borders
  border: 'rgba(0, 0, 0, 0.06)',
  borderLight: 'rgba(0, 0, 0, 0.04)',
  borderAccent: 'rgba(28, 28, 30, 0.15)',

  // Semantic
  success: '#2E9E8F',
  warning: '#E5A54B',
  error: '#E25C5C',
  info: '#5B8DEF',

  // Semantic muted
  successMuted: 'rgba(46, 158, 143, 0.12)',
  warningMuted: 'rgba(229, 165, 75, 0.12)',
  errorMuted: 'rgba(226, 92, 92, 0.12)',
  infoMuted: 'rgba(91, 141, 239, 0.12)',

  // Divider
  divider: 'rgba(0, 0, 0, 0.06)',
};

// ============================================
// SPACING
// ============================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
};

// ============================================
// TYPOGRAPHY
// ============================================

export const typography = {
  // Large display for numbers/values
  display: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '700' as const,
    letterSpacing: -1,
  },
  // Hero text
  hero: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  // Section titles
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  // Body text
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  // Captions
  caption: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  // Small labels
  small: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '500' as const,
  },

  // Weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// ============================================
// BORDER RADIUS - Soft and rounded
// ============================================

export const radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
};

// ============================================
// SHADOWS - Soft and subtle
// ============================================

export const shadows = {
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
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
    ...shadows.sm,
  },

  // Buttons
  buttonPrimary: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    height: 52,
    paddingHorizontal: spacing.xl,
  },
  buttonSecondary: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    height: 52,
    paddingHorizontal: spacing.xl,
    ...shadows.sm,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderRadius: radius.lg,
    height: 52,
    paddingHorizontal: spacing.lg,
  },

  // Inputs
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 0,
    height: 52,
    paddingHorizontal: spacing.lg,
    ...shadows.sm,
  },

  // Tags/Badges
  tag: {
    backgroundColor: colors.tealMuted,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
};

// ============================================
// LAYOUT CONSTANTS
// ============================================

export const layout = {
  screenPadding: 20,
  tabBarHeight: 56,
  tabBarBottom: 28,
  tabBarHorizontal: 40,
  inputBarHeight: 56,
  headerHeight: 56,
  fabSize: 52,
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
