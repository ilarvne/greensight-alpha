// constants/Colors.js

// --- Accessible Pastel Light Theme ---
const pastelGreenLight = '#D1FAE5'; // Very soft mint/green background element
const pastelGreen = '#A7F3D0'; // Soft mint/green primary base
const pastelGreenDark = '#34D399'; // Brighter, cleaner green for primary accents/text
const pastelGreenText = '#065F46'; // Dark green text for high contrast on light primary

const pastelBlueLight = '#E0F2FE'; // Very soft blue background element
const pastelBlue = '#BAE6FD'; // Soft sky blue accent base
const pastelBlueDark = '#3B82F6'; // Brighter blue for accent interaction/text
const pastelBlueText = '#1E40AF'; // Dark blue text

const pastelPinkLight = '#FFE4E6'; // Very soft pink/peach background element
const pastelPink = '#FECDD3'; // Soft pink/peach secondary base
const pastelPinkDark = '#F472B6'; // Brighter pink for secondary accents/text
const pastelPinkText = '#831843'; // Darker pink/magenta text

// Base Colors
const lightBase = '#F9FAFB'; // Very Light Gray (Almost White)
const lightCard = '#FFFFFF'; // White cards
const lightText = '#1F2937'; // Dark Slate Gray (Main Text)
const lightTextSecondary = '#6B7280'; // Medium Gray (Secondary Text)
const lightBorder = '#E5E7EB'; // Soft Light Gray Border
const lightInputBg = '#FFFFFF';
const lightInputBorder = '#D1D5DB';

// Functional Colors
const lightDanger = '#EF4444'; // Standard Red
const lightDangerDarkText = '#7F1D1D'; // Dark Red for text on light danger bg
const lightWarning = '#F59E0B'; // Amber
const lightWarningDarkText = '#78350F'; // Dark Amber

export const LightTheme = {
  text: lightText,
  textSecondary: lightTextSecondary,
  background: lightBase,
  cardBackground: lightCard,
  inputBackground: lightInputBg,
  inputBorder: lightInputBorder,
  tint: pastelGreenDark, // Active tint color
  icon: lightTextSecondary, // Default icon color
  tabIconDefault: '#9CA3AF', // Inactive tab icon
  tabIconSelected: pastelGreenDark, // Active tab icon

  // Semantic Colors
  primary: pastelGreen,
  primaryDark: pastelGreenDark,
  primaryLight: pastelGreenLight,
  secondary: pastelPink,
  secondaryDark: pastelPinkDark,
  secondaryLight: pastelPinkLight,
  accent: pastelBlue,
  accentDark: pastelBlueDark,
  accentLight: pastelBlueLight,
  danger: lightDanger,
  dangerDark: lightDangerDarkText,
  warning: lightWarning,
  warningDark: lightWarningDarkText,

  // Common static colors (can be useful)
  white: '#FFFFFF',
  black: '#111827', // Use dark slate instead of pure black
  gray: lightTextSecondary,
  lightGray: lightBorder,
  darkGray: lightText,

  // Component Specific Theming (Examples)
  tipBackground: pastelBlueLight, // Light blue bg for tips
  tipAccent: pastelBlueText,     // Dark blue text/icon for tips
  kbCardBackground: pastelGreenLight, // Light green bg for KB cards
  kbIconColor: pastelGreenDark,   // Brighter green icon for KB cards
  streakActive: pastelPinkDark,   // Brighter pink for active streak text/icon
  streakBackground: pastelPinkLight, // Light pink bg for streak display

  // Button Specific Theming (Ensure contrast)
  buttonPrimaryText: '#FFFFFF', // White text on primary buttons
  buttonSecondaryText: pastelPinkText, // Dark pink text on secondary buttons
  buttonDangerText: '#FFFFFF', // White text on danger buttons
  // Outline colors usually match the semantic color directly
  // buttonOutlineText: pastelGreenDark, (Defaults to primaryDark/secondaryDark etc.)
  // buttonOutlineBorder: pastelGreenDark,
};


// --- Accessible Pastel Dark Theme ---
const darkBase = '#111827'; // Very Dark Blue/Gray Background
const darkCard = '#1F2937'; // Dark Slate Card Background
const darkInputBg = '#374151'; // Medium Dark Gray Input BG
const darkInputBorder = '#4B5563'; // Slightly Lighter Gray Border
const darkText = '#F3F4F6'; // Very Light Gray (Off-white) Main Text
const darkTextSecondary = '#9CA3AF'; // Lighter Medium Gray Secondary Text

// Theme Colors (Adjusted for Dark Mode Contrast)
const darkPrimary = '#6EE7B7'; // Brighter Pastel Green (Good on dark)
const darkPrimaryLight = '#A7F3D0'; // Lighter version for subtle backgrounds
const darkPrimaryDark = '#34D399'; // Darker version for high contrast text/icons on primary bg
const darkPrimaryText = '#047857'; // Dark Green Text

const darkSecondary = '#FBCFE8'; // Light Pastel Pink
const darkSecondaryDark = '#F472B6'; // Brighter Pink for accents/text
const darkSecondaryLight = '#FECDD3'; // Even lighter pink
const darkSecondaryText = '#9D174D'; // Dark Pink Text

const darkAccent = '#BFDBFE'; // Light Pastel Blue
const darkAccentDark = '#60A5FA'; // Brighter Blue for accents/text
const darkAccentLight = '#E0F2FE'; // Lighter version
const darkAccentText = '#1E40AF'; // Dark Blue Text

const darkDanger = '#FCA5A5'; // Lighter Pastel Red
const darkDangerDark = '#7F1D1D'; // Very Dark Red Text
const darkWarning = '#FCD34D'; // Lighter Amber
const darkWarningDark = '#78350F'; // Dark Amber Text

const darkStreak = '#FDE68A'; // Soft Yellow
const darkStreakDark = '#78350F'; // Dark Amber/Brown Text

export const DarkTheme = {
  text: darkText,
  textSecondary: darkTextSecondary,
  background: darkBase,
  cardBackground: darkCard,
  inputBackground: darkInputBg,
  inputBorder: darkInputBorder,
  tint: darkPrimary, // Active tint color
  icon: darkTextSecondary, // Default icon color
  tabIconDefault: darkTextSecondary,
  tabIconSelected: darkPrimary, // Active tab icon

  // Semantic Colors
  primary: darkPrimary,
  primaryDark: darkPrimaryDark,
  primaryLight: darkPrimaryLight,
  secondary: darkSecondary,
  secondaryDark: darkSecondaryDark,
  secondaryLight: darkSecondaryLight,
  accent: darkAccent,
  accentDark: darkAccentDark,
  accentLight: darkAccentLight,
  danger: darkDanger,
  dangerDark: darkDangerDark,
  warning: darkWarning,
  warningDark: darkWarningDark,

  // Common static colors
  white: '#FFFFFF',
  black: '#000000',
  gray: darkTextSecondary,
  lightGray: darkInputBorder,
  darkGray: darkText,

  // Component Specific Theming
  tipBackground: darkAccentLight + '1A', // Very transparent light blue
  tipAccent: darkAccent, // Light blue text/icon
  kbCardBackground: darkPrimaryLight + '1A', // Very transparent light green
  kbIconColor: darkPrimary, // Bright green icon
  streakActive: darkStreak, // Use yellow for streak
  streakBackground: darkWarningDark + '40', // Transparent dark amber bg

  // Button Specific Theming
  buttonPrimaryText: darkPrimaryText, // Dark green text on light green buttons
  buttonSecondaryText: darkSecondaryText, // Dark pink text on light pink buttons
  buttonDangerText: darkDangerDark, // Dark red text on light red buttons
  // Outline colors usually match the semantic color directly
  // buttonOutlineText: darkPrimary,
  // buttonOutlineBorder: darkPrimary,
};