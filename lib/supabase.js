// lib/supabase.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants'; // Import expo-constants

// Fetch Supabase keys from Expo's constants/extra config
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

// Basic check for keys
if (!supabaseUrl || !supabaseAnonKey) {
    const message = "Supabase URL or Anon Key is missing. Check app.json/app.config.js extra config.";
    console.error(message);
    // In a real app, you might throw an error or show a different UI state
    // alert(message); // Alerting might be disruptive, console error is better
}

// Create and export the Supabase client instance
export const supabase = createClient(
    supabaseUrl ?? 'http://localhost:54321', // Provide default/fallback if necessary
    supabaseAnonKey ?? 'anon_key_placeholder', // Provide default/fallback
    {
        auth: {
            // Use AsyncStorage for session persistence in React Native
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false, // Required for React Native
        },
    }
);