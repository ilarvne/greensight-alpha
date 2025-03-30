// contexts/ThemeContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Appearance, useColorScheme as useDeviceColorScheme, StatusBar, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LightTheme, DarkTheme } from '../constants/Colors'; // Import color palettes

// Key for storing preference in AsyncStorage
const THEME_PREF_KEY = '@Greensight:colorSchemePreference';

// Default context value structure
const ThemeContext = createContext({
  isDark: false,
  colors: LightTheme, // Default to light theme colors
  colorSchemePref: 'system', // Default preference is 'system'
  setScheme: (scheme) => {}, // Placeholder function
  // isLoading: true, // Optionally expose loading state if needed elsewhere
});

export const ThemeProvider = ({ children }) => {
  const deviceScheme = useDeviceColorScheme(); // 'light' or 'dark' from OS
  const [colorSchemePref, setColorSchemePref] = useState('system'); // User preference state
  const [isThemeLoading, setIsThemeLoading] = useState(true); // Loading state

  // --- Load Preference on Mount ---
  useEffect(() => {
    const loadThemePreference = async () => {
      setIsThemeLoading(true); // Start loading
      try {
        const storedPref = await AsyncStorage.getItem(THEME_PREF_KEY);
        if (storedPref && ['light', 'dark', 'system'].includes(storedPref)) {
          setColorSchemePref(storedPref);
          console.log("ThemeContext: Loaded preference:", storedPref);
        } else {
          setColorSchemePref('system'); // Default if nothing stored or invalid
          console.log("ThemeContext: No stored preference, using 'system'.");
        }
      } catch (error) {
        console.error("ThemeContext: Failed to load theme preference:", error);
        setColorSchemePref('system'); // Fallback to system on error
      } finally {
        setIsThemeLoading(false); // Loading finished
      }
    };
    loadThemePreference();
  }, []); // Run only once on mount

  // Determine active theme based on preference and device setting
  const isDark = colorSchemePref === 'dark' || (colorSchemePref === 'system' && deviceScheme === 'dark');
  const activeColors = isDark ? DarkTheme : LightTheme;

  // Function to change and save preference
  const setScheme = useCallback(async (scheme) => { // scheme: 'light', 'dark', or 'system'
    if (!['light', 'dark', 'system'].includes(scheme)) {
        console.warn("ThemeContext: Invalid scheme provided to setScheme:", scheme);
        return;
    }
    try {
      setColorSchemePref(scheme); // Update state immediately
      await AsyncStorage.setItem(THEME_PREF_KEY, scheme); // Save preference
      console.log("ThemeContext: Saved preference:", scheme);
    } catch (error) {
      console.error("ThemeContext: Failed to save theme preference:", error);
      // Optionally revert state or show an error?
    }
  }, []); // No dependencies needed here

  // Effect to update StatusBar appearance when theme changes
   useEffect(() => {
     StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content', true); // Animated transition
     // Set background color for Android status bar based on theme background
     if (Platform.OS === 'android') {
       StatusBar.setBackgroundColor(activeColors.background, true); // Use themed background, animated
     }
   }, [isDark, activeColors.background]); // Dependencies: isDark, background color


  // Define the value provided by the context
  const themeValue = {
    isDark,
    colors: activeColors,
    setScheme,
    colorSchemePref, // Expose the preference ('light', 'dark', 'system')
    // isLoading: isThemeLoading // Optionally expose loading state
  };

  // Optional: Prevent rendering children until theme is loaded to avoid brief flash
  // if (isThemeLoading) return null; // Or return a non-themed minimal loader

  return (
    <ThemeContext.Provider value={themeValue}>
        {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to easily consume the theme context
export const useTheme = () => useContext(ThemeContext);
// Removed the extra closing brace '}' that was present in the fetched content