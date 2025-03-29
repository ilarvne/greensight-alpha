// components/LoadingOverlay.js
import React from 'react';
import { View, ActivityIndicator, StyleSheet, Modal, Text } from 'react-native';
import { COLORS, FONTS, SIZES } from '../utils/theme'; // Ensure SIZES is imported

const LoadingOverlay = ({ visible, text = "Loading..." }) => {
  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={() => {}} // Prevent closing by back button on Android
    >
      <View style={styles.overlay}>
        {/* Optional: Add a semi-transparent background card for better visibility */}
        <View style={styles.container}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          {text && <Text style={styles.text}>{text}</Text>}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Slightly darker overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: COLORS.cardBackground, // Use theme card background
    padding: SIZES.paddingLarge, // Generous padding
    borderRadius: SIZES.radius, // Use theme radius
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    minWidth: 150, // Give it some minimum width
  },
  text: {
    ...FONTS.body1, // Use theme font
    marginTop: SIZES.padding, // Space between spinner and text
    color: COLORS.textSecondary, // Use theme text color
    textAlign: 'center',
  },
});

export default LoadingOverlay;