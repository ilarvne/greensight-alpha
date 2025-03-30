// components/AppButton.js
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { FONTS, SIZES } from '../utils/theme';
import { useTheme } from '../contexts/ThemeContext'; // Already using ThemeContext correctly

const AppButton = ({ title, onPress, style, textStyle, disabled, loading, icon, color = 'primary', variant = 'filled', }) => {
  const { colors } = useTheme(); // Get themed colors

  const isOutline = variant === 'outline';
  const themeColorName = color; // e.g., 'primary', 'secondary', 'danger'
  const themeColorValue = colors[themeColorName] || colors.primary; // Get the actual color value

  // Determine background color
  const backgroundColor = isOutline
    ? 'transparent' // Outline buttons have transparent background
    : (disabled ? colors.lightGray + 'AA' : themeColorValue); // Filled buttons use theme color or faded gray if disabled

  // Determine text color based on variant and button color for contrast
  let textColor;
  if (isOutline) {
    // Outline buttons use the theme color for text, or gray if disabled
    textColor = disabled ? colors.gray : themeColorValue;
    // Specific override for danger outline text color if needed (using theme value directly here)
    // if (!disabled && themeColorName === 'danger') textColor = colors.danger;
  } else {
    // Filled buttons need contrast text (defined in theme or default to white/black)
    switch (themeColorName) {
      case 'primary': textColor = colors.buttonPrimaryText || colors.white; break;
      case 'secondary': textColor = colors.buttonSecondaryText || colors.black; break;
      case 'accent': textColor = colors.buttonAccentText || colors.white; break; // Assuming accent needs light text
      case 'danger': textColor = colors.buttonDangerText || colors.white; break;
      default: textColor = colors.white; // Default to white text
    }
    if (disabled) textColor = colors.textSecondary + 'AA'; // Faded text color when disabled
  }

  // Determine border color
  const borderColor = isOutline
    ? (disabled ? colors.lightGray : themeColorValue) // Outline uses theme color or gray for border
    : 'transparent'; // Filled buttons have no border by default
  const borderWidth = isOutline ? 1.5 : 0;

  // Clone icon if provided, applying text color
  const ClonedIcon = icon ? React.cloneElement(icon, {
      // Apply icon styles, using determined textColor
      style: [styles.icon, icon.props.style, { color: textColor }],
      size: icon.props.size || 20 // Default icon size if not provided
    }) : null;

  return (
    <TouchableOpacity
        style={[
            styles.button,
            { backgroundColor, borderColor, borderWidth }, // Apply dynamic styles
            style // Apply any additional custom styles passed via props
        ]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" /> // Show loader if loading
      ) : (
        <>
          {ClonedIcon}
          <Text style={[styles.text, { color: textColor }, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

// Stylesheet using FONTS and SIZES
const styles = StyleSheet.create({
    button: {
        paddingVertical: SIZES.padding * 0.8,
        paddingHorizontal: SIZES.padding * 1.5,
        borderRadius: SIZES.radius, // Use theme radius
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        minHeight: 48, // Good touch target size
        marginVertical: SIZES.base, // Default vertical margin
        // Shadow/Elevation for filled buttons (subtle)
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: Platform.OS === 'ios' ? 0.10 : 0, // Adjust opacity as needed
        shadowRadius: 3,
        elevation: 2, // Android shadow
    },
    text: {
        ...FONTS.button, // Use button font style from theme
        textAlign: 'center',
        marginLeft: 5, // Space between icon and text
    },
    icon: {
        marginRight: SIZES.base * 0.8, // Default space before icon
    }
});

export default AppButton;