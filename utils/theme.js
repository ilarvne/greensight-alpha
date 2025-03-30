// utils/theme.js
import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// SIZES definition (remains the same)
export const SIZES = {
  // base
  base: 8,
  font: 14,
  radius: 16, // Slightly larger default radius
  padding: 18, // Standard padding
  paddingLarge: 24, // Larger padding

  // font sizes
  h1: 28,
  h2: 22,
  h3: 18,
  h4: 16,
  body1: 16,
  body2: 14,
  body3: 12,

  // app dimensions
  width,
  height,
};

// FONTS definition (remains the same, ensure baseFont is appropriate)
const baseFont = Platform.OS === 'ios' ? 'System' : 'Roboto'; // Or use a custom font name if loaded
export const FONTS = {
  h1: { fontFamily: baseFont, fontSize: SIZES.h1, lineHeight: 36, fontWeight: 'bold' },
  h2: { fontFamily: baseFont, fontSize: SIZES.h2, lineHeight: 30, fontWeight: '700' }, // Bold H2
  h3: { fontFamily: baseFont, fontSize: SIZES.h3, lineHeight: 24, fontWeight: '600' }, // Semi-bold H3
  h4: { fontFamily: baseFont, fontSize: SIZES.h4, lineHeight: 22, fontWeight: '600' }, // Semi-bold H4
  body1: { fontFamily: baseFont, fontSize: SIZES.body1, lineHeight: 24 }, // Slightly more line height
  body2: { fontFamily: baseFont, fontSize: SIZES.body2, lineHeight: 20 },
  body3: { fontFamily: baseFont, fontSize: SIZES.body3, lineHeight: 18 },
  button: { fontFamily: baseFont, fontSize: SIZES.h4, fontWeight: 'bold' }, // Button text style
  input: { fontFamily: baseFont, fontSize: SIZES.body1 } // Input text style
};

// Note: COLORS object is removed from here and defined in constants/Colors.js