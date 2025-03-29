// components/AppButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Assuming icons might be passed
import { COLORS, FONTS, SIZES } from '../utils/theme';

const AppButton = ({
    title,
    onPress,
    style,
    textStyle,
    disabled,
    loading,
    icon, // Expecting an icon component like <MaterialCommunityIcons name="icon-name" size={20} />
    color = 'primary', // 'primary', 'secondary', 'accent', 'danger', etc.
    variant = 'filled', // Add 'filled' or 'outline' variants
}) => {
  const isOutline = variant === 'outline';

  // Determine colors based on variant and state
  const backgroundColor = isOutline ? 'transparent' : (disabled ? COLORS.lightGray : COLORS[color] || COLORS.primary);
  const textColor = isOutline
    ? (disabled ? COLORS.gray : COLORS[color] || COLORS.primary)
    : (disabled ? COLORS.textSecondary : COLORS.white);
  const borderColor = isOutline ? (disabled ? COLORS.lightGray : COLORS[color] || COLORS.primary) : 'transparent';
  const borderWidth = isOutline ? 1.5 : 0; // Slightly thicker border for outline

  // Clone icon to apply color if needed
   const ClonedIcon = icon ? React.cloneElement(icon, {
       style: [styles.icon, { color: textColor }], // Pass text color to icon
       size: icon.props.size || 20 // Default icon size if not provided
   }) : null;

  return (
    <TouchableOpacity
      style={[
          styles.button,
          { backgroundColor, borderColor, borderWidth },
          style // Allow custom style overrides
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7} // Standard touch feedback
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <>
          {ClonedIcon}
          <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: SIZES.padding * 0.7, // Slightly reduced vertical padding for neatness
    paddingHorizontal: SIZES.padding * 1.5,
    borderRadius: SIZES.radius * 1.8, // Quite rounded corners
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minWidth: 100,
    marginVertical: SIZES.base,
    // Subtle shadow for filled buttons
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.15 : 0, // iOS specific shadow styling
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },
  text: {
    ...FONTS.button, // Use dedicated button font style from theme
    textAlign: 'center',
    marginLeft: 5, // Add space if there's an icon
  },
  icon: {
      marginRight: SIZES.base * 0.8, // Space between icon and text
      // Color is applied dynamically
  }
});

export default AppButton;