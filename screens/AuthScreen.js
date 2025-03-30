// screens/AuthScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../lib/supabase'; // Import Supabase client
import AppButton from '../components/AppButton';
import { FONTS, SIZES } from '../utils/theme'; // Use FONTS/SIZES
import { useTheme } from '../contexts/ThemeContext'; // Use useTheme
import { MaterialCommunityIcons } from '@expo/vector-icons';

const AuthScreen = () => {
  const { colors } = useTheme(); // Get theme colors
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Start with Sign In view

  // --- Authentication Handler ---
  const handleAuth = async () => {
    // --- DEBUG LOG 1: Check if function is called ---
    console.log(`--- handleAuth FUNCTION CALLED! --- Mode: ${isSignUp ? 'Sign Up' : 'Sign In'}`);

    // --- DEBUG LOG 2: Check Supabase client ---
    console.log("AuthScreen: Checking supabase client before auth call:", !!supabase, !!supabase?.auth);
    if (!supabase || !supabase.auth) {
        Alert.alert("Client Error", "Supabase client not available. Check initialization.");
        return; // Stop if client isn't ready
    }

    // Input validation
    if (!email.trim() || !password.trim()) {
        Alert.alert('Input Required', 'Please enter both email and password.');
        return;
    }

    console.log("AuthScreen: Setting loading TRUE");
    setLoading(true);
    const credentials = { email: email.trim(), password: password.trim() };

    try {
        let response;
        if (isSignUp) {
            console.log("AuthScreen: Attempting Sign Up...");
            response = await supabase.auth.signUp(credentials);
            console.log("AuthScreen: Sign Up Response:", response); // Log response
            if (response.error) throw response.error;
            if (response.data.user && !response.data.session) {
                Alert.alert('Check your email!', 'Please click the confirmation link sent to your email to complete sign up.');
            } else if (response.data.user && response.data.session) {
                console.log("AuthScreen: Sign up successful and logged in.");
                // Auth state change handles navigation
            } else {
                throw new Error("Sign up completed, but no user data returned unexpectedly.");
            }
        } else {
            console.log("AuthScreen: Attempting Sign In...");
            response = await supabase.auth.signInWithPassword(credentials);
            console.log("AuthScreen: Sign In Response:", response); // Log response
            if (response.error) throw response.error;
            console.log("AuthScreen: Sign in successful.");
            // Auth state change handles navigation
        }

    } catch (error) {
        console.error("AuthScreen: Caught error in handleAuth:", error); // Log error object
        let errorMessage = error.message || 'An unknown error occurred.';
        // Customize messages based on common errors
        if (error?.message?.includes("already registered") && !isSignUp) {
            errorMessage = "An account with this email already exists. Try signing in or use 'Forgot Password'.";
        } else if (error?.message?.includes("Invalid login credentials")) {
            errorMessage = "Incorrect email or password. Please try again.";
        } else if (error?.message?.includes("Email not confirmed")) {
            errorMessage = "Please check your inbox and click the confirmation link before signing in.";
        }
        Alert.alert('Authentication Failed', errorMessage);
    } finally {
        console.log("AuthScreen: handleAuth finally block, setting loading FALSE");
        setLoading(false); // Ensure loading is always reset
    }
  };

  // --- Component Render ---
  // --- DEBUG LOG 3: Check loading state before render ---
  console.log("AuthScreen rendering, loading state:", loading);

  return (
    <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
    >
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.innerContainer}>
                <MaterialCommunityIcons name="sprout-outline" size={80} color={colors.primary} style={styles.logo} />
                <Text style={[styles.title, { color: colors.primaryDark }]}>{isSignUp ? 'Create Account' : 'Welcome Back!'}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{isSignUp ? 'Join Greensight today.' : 'Sign in to continue.'}</Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                        placeholder="Email Address" value={email} onChangeText={setEmail}
                        keyboardType="email-address" autoCapitalize="none" autoComplete='email'
                        placeholderTextColor={colors.gray} editable={!loading}
                    />
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                        placeholder="Password" value={password} onChangeText={setPassword}
                        secureTextEntry autoCapitalize="none" autoComplete='password'
                        placeholderTextColor={colors.gray} editable={!loading}
                    />
                </View>

                {/* --- Main Action Button --- */}
                <AppButton
                    title={isSignUp ? 'Sign Up' : 'Sign In'}
                    onPress={handleAuth} // Calls the handler
                    loading={loading}
                    disabled={loading} // Disabled based on loading state
                    style={styles.mainButton}
                    color="primary"
                />
                {/* --- Toggle Button --- */}
                <AppButton
                    title={isSignUp ? 'Have an account? Sign In' : 'Need an account? Sign Up'}
                    onPress={() => {if (!loading) setIsSignUp(!isSignUp)}} // Toggles state if not loading
                    variant="outline"
                    color="primaryDark"
                    disabled={loading}
                    style={styles.toggleButton}
                />
            </View>
        </ScrollView>
    </KeyboardAvoidingView>
  );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
    keyboardAvoidingView: { flex: 1 },
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: 'center' },
    innerContainer: { justifyContent: 'center', alignItems: 'center', padding: SIZES.paddingLarge },
    logo: { marginBottom: SIZES.paddingLarge, opacity: 0.9 },
    title: { ...FONTS.h1, textAlign: 'center', marginBottom: SIZES.base },
    subtitle: { ...FONTS.body1, textAlign: 'center', marginBottom: SIZES.paddingLarge * 1.5 },
    inputContainer: { width: '100%', marginBottom: SIZES.base },
    input: {
        borderWidth: 1.5, borderRadius: SIZES.radius * 0.8, paddingHorizontal: SIZES.padding,
        paddingVertical: Platform.OS === 'ios' ? SIZES.padding * 0.9 : SIZES.padding * 0.7,
        ...FONTS.input, marginBottom: SIZES.padding * 0.9, width: '100%',
    },
    mainButton: { width: '100%', marginTop: SIZES.padding * 0.5, marginBottom: SIZES.padding * 0.5 },
    toggleButton: { width: '100%', marginTop: SIZES.base }
});

export default AuthScreen;