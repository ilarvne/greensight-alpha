// screens/SplashScreen.js
import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // For a nice background
import { COLORS, FONTS, SIZES } from '../utils/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const SplashScreen = () => {
  return (
    <LinearGradient
      colors={[COLORS.primaryLight, COLORS.primary]} // Green gradient
      style={styles.container}
    >
      <MaterialCommunityIcons name="seedling" size={100} color={COLORS.white} style={styles.icon} />
      <Text style={styles.title}>Greensight</Text>
      <Text style={styles.subtitle}>Your Microgreen Companion</Text>
      <ActivityIndicator size="large" color={COLORS.white} style={styles.spinner} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
      marginBottom: SIZES.padding,
       opacity: 0.9
  },
  title: {
    ...FONTS.h1,
    fontSize: 40,
    color: COLORS.white,
    fontWeight: 'bold',
    marginBottom: SIZES.base,
     textShadowColor: 'rgba(0, 0, 0, 0.2)',
     textShadowOffset: {width: 1, height: 1},
     textShadowRadius: 2
  },
  subtitle: {
    ...FONTS.h4,
    color: COLORS.white,
     opacity: 0.8,
    marginBottom: SIZES.paddingLarge * 2,
  },
   spinner: {
       marginTop: SIZES.padding,
   }
});

export default SplashScreen;