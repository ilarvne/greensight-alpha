// utils/theme.js
import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Modern Palette - Softer Greens, Beige background, Vibrant Accents
export const COLORS = {
  primary: '#388E3C', // Slightly less intense Green
  primaryDark: '#1B5E20', // Dark Green for contrast
  primaryLight: '#C8E6C9', // Soft Green highlight/background element
  secondary: '#FFA000', // Vibrant Amber/Orange accent
  accent: '#03A9F4', // Light Blue accent
  white: '#FFFFFF',
  black: '#121212', // Off-black for text
  gray: '#888888', // Medium Gray
  lightGray: '#EAEAEA', // Lighter Gray for borders/dividers
  darkGray: '#555555',
  danger: '#D32F2F', // Softer Red
  background: '#F7FDF6', // Very light beige-green background
  cardBackground: '#FFFFFF',
  text: '#1B1B1B',
  textSecondary: '#606060', // Softer secondary text
  streakActive: '#FF6F00', // Deep orange/amber for streak
  tipBackground: '#E1F5FE', // Light blue background for tip card
  tipAccent: '#0277BD',    // Darker blue for tip icon/text
  kbCardBackground: '#E8F5E9', // Light green tint for KB cards
  kbIconColor: '#2E7D32', // Mid-green for KB icons
};

export const SIZES = {
  base: 8,
  font: 14,
  radius: 16, // More pronounced rounding
  padding: 18, // Increase base padding
  paddingLarge: 24,
  h1: 28,
  h2: 22,
  h3: 18,
  h4: 16,
  body1: 16,
  body2: 14,
  body3: 12,
  width,
  height,
};

const baseFont = Platform.OS === 'ios' ? 'System' : 'Roboto';

export const FONTS = {
  h1: { fontFamily: baseFont, fontSize: SIZES.h1, lineHeight: 36, fontWeight: 'bold', color: COLORS.text },
  h2: { fontFamily: baseFont, fontSize: SIZES.h2, lineHeight: 30, fontWeight: '700', color: COLORS.text },
  h3: { fontFamily: baseFont, fontSize: SIZES.h3, lineHeight: 24, fontWeight: '600', color: COLORS.text },
  h4: { fontFamily: baseFont, fontSize: SIZES.h4, lineHeight: 22, fontWeight: '600', color: COLORS.text },
  body1: { fontFamily: baseFont, fontSize: SIZES.body1, lineHeight: 24, color: COLORS.text },
  body2: { fontFamily: baseFont, fontSize: SIZES.body2, lineHeight: 20, color: COLORS.textSecondary },
  body3: { fontFamily: baseFont, fontSize: SIZES.body3, lineHeight: 18, color: COLORS.textSecondary },
  button: { fontFamily: baseFont, fontSize: SIZES.h4, fontWeight: 'bold', color: COLORS.white },
};

const appTheme = { COLORS, SIZES, FONTS };
export default appTheme;