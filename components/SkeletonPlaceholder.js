// components/SkeletonPlaceholder.js
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // Or use a simpler animation if preferred
import { useTheme } from '../contexts/ThemeContext';
import { SIZES } from '../utils/theme';

// Basic Animation Component (can be replaced with libraries like react-native-skeleton-placeholder)
const AnimatedGradient = () => {
  const { colors } = useTheme();
  // Define subtle gradient colors based on theme for the shimmer effect
  const gradientColors = [
    colors.lightGray + '60', // More transparent
    colors.lightGray + '90', // Less transparent
    colors.lightGray + '60', // More transparent
  ];

  // Note: expo-linear-gradient doesn't have built-in animation loop.
  // For a true shimmer, you'd need react-native-reanimated or a dedicated skeleton library.
  // This provides a static placeholder look.
  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.gradient}
      start={{ x: 0, y: 0.5 }}
      end={{ x: 1, y: 0.5 }}
    />
  );
};

const SkeletonPlaceholder = ({ height = 10, width = '100%', marginBottom = SIZES.base, style }) => {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.placeholder,
        {
            height,
            width,
            marginBottom,
            backgroundColor: colors.lightGray + '50', // Use a themed background color
        },
        style,
      ]}
    >
      {/* <AnimatedGradient /> */}
      {/* Removed gradient for simplicity, just showing solid blocks */}
    </View>
  );
};

// --- Skeleton Layout for ObservationCard ---
export const ObservationSkeleton = () => {
  const { colors } = useTheme();
  return (
    <View style={[styles.cardSkeleton, { backgroundColor: colors.cardBackground, borderColor: colors.lightGray }]}>
        {/* Header Placeholder */}
        <View style={styles.headerSkeleton}>
            <SkeletonPlaceholder height={18} width={18} style={{ borderRadius: 9 }} />
            <SkeletonPlaceholder height={14} width={'60%'} style={{ marginLeft: SIZES.base }} />
        </View>
        {/* Image Placeholder */}
        <SkeletonPlaceholder height={180} width={'100%'} marginBottom={SIZES.padding * 0.8} style={{ borderRadius: SIZES.radius * 0.6 }}/>
         {/* Detail Chip Placeholder */}
        <SkeletonPlaceholder height={30} width={'40%'} style={{ borderRadius: SIZES.radius * 2, alignSelf: 'flex-start' }} marginBottom={SIZES.base} />
        {/* Notes Placeholder */}
        <SkeletonPlaceholder height={18} width={'90%'} marginBottom={SIZES.base * 0.5} />
        <SkeletonPlaceholder height={18} width={'75%'} marginBottom={SIZES.base * 0.5} />
         {/* Height Chip Placeholder */}
        <SkeletonPlaceholder height={30} width={'35%'} style={{ borderRadius: SIZES.radius * 2, alignSelf: 'flex-start' }} marginBottom={0} />
    </View>
  );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
  placeholder: {
    borderRadius: SIZES.radius * 0.5, // Default rounding
    overflow: 'hidden', // Keep gradient contained if used
  },
  gradient: {
    flex: 1,
  },
  // Observation Card Skeleton Specific Styles
  cardSkeleton: {
    borderRadius: SIZES.radius * 0.9,
    padding: SIZES.padding * 0.9,
    marginBottom: SIZES.padding,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  headerSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding * 0.7,
    opacity: 0.8, // Make header slightly faded
  },
});

export default SkeletonPlaceholder; // Export the basic block placeholder too if needed elsewhere