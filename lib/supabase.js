// lib/supabase.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants'; // Import expo-constants

// Fetch Supabase keys from Expo's constants/extra config in app.json
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

// Basic check for keys during initialization
if (!supabaseUrl || !supabaseAnonKey) {
    const message = "Supabase URL or Anon Key is missing. Check app.json `extra` config.";
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    console.error(message);
    console.error("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
    // Consider throwing an error or handling this state appropriately in a real app
    // For development, provide placeholder values to avoid immediate crashes.
}

// Create and export the Supabase client instance
export const supabase = createClient(
    // Provide fallbacks in case the keys aren't found during development/build setup
    supabaseUrl ?? 'YOUR_SUPABASE_URL_FALLBACK', // Replace with a placeholder or handle error
    supabaseAnonKey ?? 'YOUR_SUPABASE_ANON_KEY_FALLBACK', // Replace with a placeholder or handle error
    {
        auth: {
            // Use AsyncStorage for session persistence in React Native
            storage: AsyncStorage,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false, // Required for React Native, prevents URL session detection
        },
    }
);

// Optional: Add a listener for debugging auth events
/*
supabase.auth.onAuthStateChange((event, session) => {
  console.log(`Supabase Auth Event: ${event}`, session);
});
*/