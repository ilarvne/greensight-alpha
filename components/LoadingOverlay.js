// components/LoadingOverlay.js
import React from 'react';
import { View, ActivityIndicator, StyleSheet, Modal, Text, Platform } from 'react-native';
import { FONTS, SIZES } from '../utils/theme'; // Use FONTS/SIZES
import { useTheme } from '../contexts/ThemeContext'; // Use theme colors

const LoadingOverlay = ({ visible, text = "Loading..." }) => {
  const { colors } = useTheme(); // Get theme colors

  return (
    <Modal
      transparent={true}
      animationType="fade" // Subtle fade animation
      visible={visible}
      onRequestClose={() => {}} // Prevent closing via back button/swipe
    >
      {/* Semi-transparent background overlay */}
      <View style={styles.overlay}>
        {/* Container for the spinner and text, using themed background */}
        <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          {/* Conditionally render text if provided */}
          {text && <Text style={[styles.text, { color: colors.textSecondary }]}>{text}</Text>}
        </View>
      </View>
    </Modal>
  );
};

// Stylesheet using SIZES and FONTS
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent dark overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: SIZES.paddingLarge, // Use large padding
    borderRadius: SIZES.radius, // Consistent rounding
    alignItems: 'center',
    // Add subtle shadow/elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    minWidth: 150, // Ensure container isn't too small
    // Background color applied inline using theme
  },
  text: {
    ...FONTS.body1, // Use body1 font style
    marginTop: SIZES.padding, // Space between spinner and text
    textAlign: 'center',
    // Color applied inline using theme
  },
});

export default LoadingOverlay;