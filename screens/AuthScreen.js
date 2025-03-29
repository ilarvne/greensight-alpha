// screens/AuthScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import AppButton from '../components/AppButton';
import { COLORS, FONTS, SIZES } from '../utils/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // For icons

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // Start with Sign In view

  const handleAuth = async () => {
    if (!email.trim() || !password.trim()) {
        Alert.alert('Input Required', 'Please enter both email and password.');
        return;
    }
    setLoading(true);
    const credentials = { email: email.trim(), password: password.trim() };

    try {
        let response;
        if (isSignUp) {
            console.log("Attempting Sign Up...");
            response = await supabase.auth.signUp(credentials);
            // Check specifically for user data even if session is null (due to email confirmation)
             if (response.error) throw response.error;
             if (response.data.user && !response.data.session) {
                  Alert.alert('Check your email!', 'Please click the confirmation link sent to your email to complete sign up.');
             } else if (response.data.user && response.data.session) {
                  // User signed up and is logged in (email confirmation likely disabled)
                  console.log("Sign up successful and logged in.");
                  // Auth state change listener will handle navigation
             } else if (!response.data.user) {
                 // Should not happen if no error, but good to check
                 throw new Error("Sign up failed, please try again.");
             }
        } else {
            console.log("Attempting Sign In...");
            response = await supabase.auth.signInWithPassword(credentials);
            if (response.error) throw response.error;
             // Successful sign-in automatically triggers auth state change -> navigation
             console.log("Sign in successful.");
        }
        // console.log("Auth Response:", response); // For debugging

    } catch (error) {
        console.error("Authentication Error:", error);
        // Provide more specific feedback if possible
        let errorMessage = error.message || 'An unknown error occurred.';
        if (error.message.includes("already registered") && !isSignUp) {
            errorMessage = "An account with this email already exists. Try signing in or use 'Forgot Password'.";
        } else if (error.message.includes("Invalid login credentials")) {
            errorMessage = "Incorrect email or password. Please try again.";
        }
        Alert.alert('Authentication Failed', errorMessage);
    } finally {
        setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
    >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.container}>
                <MaterialCommunityIcons name="seedling" size={80} color={COLORS.primary} style={styles.logo} />
                <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Welcome Back!'}</Text>
                <Text style={styles.subtitle}>{isSignUp ? 'Join Greensight to track your microgreens.' : 'Sign in to your Greensight account.'}</Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Email Address"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete='email'
                        placeholderTextColor={COLORS.gray}
                        editable={!loading} // Disable input while loading
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        autoCapitalize="none"
                        autoComplete='password'
                        placeholderTextColor={COLORS.gray}
                        editable={!loading} // Disable input while loading
                    />
                </View>

                <AppButton
                    title={isSignUp ? 'Sign Up' : 'Sign In'}
                    onPress={handleAuth}
                    loading={loading}
                    disabled={loading}
                    style={styles.mainButton}
                    color="primary"
                />
                <AppButton
                    title={isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                    onPress={() => {if (!loading) setIsSignUp(!isSignUp)}} // Prevent toggle while loading
                    variant="outline" // Use outline style
                    color="primaryDark" // Use darker color for outline button
                    disabled={loading}
                    style={styles.toggleButton}
                />
                 {/* Optional: Add Forgot Password button later */}
            </View>
        </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
    keyboardAvoidingView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1, // Ensure content can scroll if needed but also centers
        justifyContent: 'center', // Center content vertically
        backgroundColor: COLORS.background,
    },
    container: {
        flex: 1, // Take available space
        justifyContent: 'center', // Center content vertically
        alignItems: 'center', // Center content horizontally
        padding: SIZES.paddingLarge,
    },
    logo: {
        marginBottom: SIZES.paddingLarge,
        opacity: 0.9,
    },
    title: {
        ...FONTS.h1,
        color: COLORS.primaryDark,
        textAlign: 'center',
        marginBottom: SIZES.base,
    },
    subtitle: {
        ...FONTS.body1,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SIZES.paddingLarge * 1.5, // More space before form
    },
    inputContainer: {
        width: '100%', // Ensure inputs take full width of padding
        marginBottom: SIZES.base, // Space before main button
    },
    input: {
        backgroundColor: COLORS.inputBackground,
        borderWidth: 1.5, // Slightly thicker border
        borderColor: COLORS.inputBorder,
        borderRadius: SIZES.radius * 0.8,
        paddingHorizontal: SIZES.padding,
        paddingVertical: Platform.OS === 'ios' ? SIZES.padding * 0.9 : SIZES.padding * 0.7, // Platform specific padding
        ...FONTS.input,
        marginBottom: SIZES.padding * 0.9, // Space between inputs
        width: '100%', // Explicit width
    },
    mainButton: {
        width: '100%', // Make button full width
        marginTop: SIZES.padding * 0.5, // Space above main button
        marginBottom: SIZES.padding * 0.5, // Space below main button
    },
    toggleButton: {
         width: '100%', // Make button full width
         marginTop: SIZES.base,
    }
});

export default AuthScreen;