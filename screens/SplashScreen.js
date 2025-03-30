// screens/SplashScreen.js
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONTS, SIZES } from '../utils/theme'; // Only FONTS/SIZES needed
import { MaterialCommunityIcons } from '@expo/vector-icons';

// --- Define Pastel Colors Locally ---
const splashColors = {
  gradientStart: '#D4F0E9', // pastelGreenLight
  gradientEnd: '#A8E6CF',   // pastelGreen
  iconAndText: '#34495E',     // Use soft dark text color for contrast on light pastels
  spinner: '#34495E',
};

const SplashScreen = () => {
  return (
    <LinearGradient
      colors={[splashColors.gradientStart, splashColors.gradientEnd]} // Use pastel gradient
      style={styles.container}
    >
      <MaterialCommunityIcons
          name="sprout-outline"
          size={100}
          color={splashColors.iconAndText} // Use defined color
          style={styles.icon}
      />
      <Text style={[styles.title, { color: splashColors.iconAndText }]}>Greensight</Text>
      <Text style={[styles.subtitle, { color: splashColors.iconAndText, opacity: 0.85 }]}>
          Your Microgreen Companion
      </Text>
      <ActivityIndicator
          size="large"
          color={splashColors.spinner} // Use defined color
          style={styles.spinner}
      />
    </LinearGradient>
  );
};

// Styles use SIZES/FONTS, colors are from local splashColors or applied inline
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: splashColors.gradientEnd, }, // Fallback BG
  icon: { marginBottom: SIZES.padding, opacity: 0.9, textShadowColor: 'rgba(255, 255, 255, 0.3)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 2 },
  title: { ...FONTS.h1, fontSize: Platform.OS === 'web' ? 44 : 40, fontWeight: 'bold', marginBottom: SIZES.base, textShadowColor: 'rgba(255, 255, 255, 0.4)', textShadowOffset: {width: 1, height: 1}, textShadowRadius: 3 },
  subtitle: { ...FONTS.h4, marginBottom: SIZES.paddingLarge * 2 },
  spinner: { marginTop: SIZES.padding, transform: [{ scale: 1.2 }] }
});

export default SplashScreen;