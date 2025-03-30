// contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import SplashScreen from '../screens/SplashScreen'; // Used for initial auth check loading
import { AppState, Alert } from 'react-native';

// Create the context object
const AuthContext = createContext(null);

// Create the provider component
export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null); // Store basic profile info (username, avatar_url)
    const [loadingInitial, setLoadingInitial] = useState(true); // Initial auth check status
    const [loadingProfile, setLoadingProfile] = useState(false); // Separate loading for profile check after login

    // --- Profile Check Function ---
    // Checks if a profile exists and has a username, updates profile state.
    const checkUserProfileComplete = useCallback(async (userId) => {
        if (!userId) {
            setProfile(null);
            return false; // No user ID, profile is not complete
        }
        console.log("AuthContext: Checking profile completeness for user:", userId);
        setLoadingProfile(true); // Indicate profile check is starting
        let isComplete = false;
        try {
            // Select only necessary fields for the check
            const { data, error, status } = await supabase
                .from('profiles')
                .select('username, avatar_url') // Fetch username and avatar
                .eq('id', userId)
                .maybeSingle(); // Use maybeSingle() as profile might not exist yet fully

            if (error && status !== 406) { // 406 = No rows found (not necessarily an error here)
                 console.error("AuthContext: DB Error fetching profile:", error);
                 throw error; // Throw actual DB errors
            }

            // Profile is considered "complete" for navigation purposes if it exists and has a username.
            isComplete = !!(data && data.username);
            setProfile(data); // Store the fetched profile data (or null if no row found)
            console.log("AuthContext: Profile check result - Complete:", isComplete, "Data:", data);

        } catch (error) {
            console.error("AuthContext: Error during user profile check:", error);
            setProfile(null); // Reset profile on error
            isComplete = false;
        } finally {
            setLoadingProfile(false); // Indicate profile check finished
        }
        return isComplete;
    }, []); // No dependencies needed for this callback itself

    // --- Session Check Function ---
    // Checks Supabase for a valid session and then checks the user profile.
    const checkUserSessionAndProfile = useCallback(async (isInitialCheck = false) => {
        console.log("AuthContext: checkUserSessionAndProfile called");
        if (isInitialCheck) setLoadingInitial(true); // Set initial loading only on app start

        try {
             // 1. Check for existing session locally and verify with server
             const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
             if (sessionError) throw sessionError; // Handle session fetch errors

             // 2. If a session exists, verify the user associated with it
             if (currentSession?.user) {
                 console.log("AuthContext: Local session found, verifying user with server...");
                 // Double-check the user state with the server
                 const { data: { user: serverUser }, error: userError } = await supabase.auth.getUser();

                 if (userError || !serverUser) {
                     // If server verification fails (e.g., token revoked), clear local state
                     console.warn("AuthContext: Server user verification failed or user not found. Clearing session.", userError);
                     // Don't sign out here, let the auth listener handle it if necessary or rely on next check
                     setSession(null); setUser(null); setProfile(null);
                 } else {
                     // Server confirmed user, update local state
                     console.log("AuthContext: Server user verified. Setting session and user.");
                     setSession(currentSession);
                     setUser(serverUser);
                     // 3. Check if the verified user's profile is complete
                     await checkUserProfileComplete(serverUser.id);
                 }
             } else {
                 // No local session found
                 console.log("AuthContext: No local session found.");
                 setSession(null); setUser(null); setProfile(null);
             }
        } catch (error) {
            console.error("AuthContext: Error in checkUserSessionAndProfile:", error);
            // Clear state on error during check
            setSession(null); setUser(null); setProfile(null);
        } finally {
            // Only turn off initial splash screen loading on the very first check
            if (isInitialCheck) {
                 setLoadingInitial(false);
                 console.log("AuthContext: Initial session/profile check complete.");
            }
        }
    }, [checkUserProfileComplete]); // Depends on the profile check function

    // --- Effects ---
    // Effect to run the initial check and set up listeners
    useEffect(() => {
        let authSubscription = null;
        let appStateSubscription = null;

        // Perform the initial check when the provider mounts
        checkUserSessionAndProfile(true);

        try {
            // Subscribe to Supabase auth state changes
            const { data } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
                console.log(`AuthContext: Supabase auth event received: ${_event}`);
                const currentUser = newSession?.user ?? null;
                setSession(newSession); // Update session state
                setUser(currentUser); // Update user state

                // If user signs in or is already signed in, check their profile status
                if ((_event === 'SIGNED_IN' || _event === 'INITIAL_SESSION') && currentUser) {
                    console.log("AuthContext: SIGNED_IN or INITIAL_SESSION event, checking profile for:", currentUser.id);
                    await checkUserProfileComplete(currentUser.id);
                }
                // If user signs out, clear the profile state
                else if (_event === 'SIGNED_OUT') {
                    console.log("AuthContext: SIGNED_OUT event, clearing profile.");
                    setProfile(null);
                }
                // If user data is updated (e.g., email change), re-check profile
                else if (_event === 'USER_UPDATED' && currentUser) {
                     console.log("AuthContext: USER_UPDATED event, re-checking profile for:", currentUser.id);
                     await checkUserProfileComplete(currentUser.id);
                }
            });
            authSubscription = data?.subscription;
            if (!authSubscription) {
                console.warn("AuthContext: Failed to get Supabase auth subscription object.");
            }

            // Add AppState listener to re-check session when app becomes active
            appStateSubscription = AppState.addEventListener('change', (nextAppState) => {
                if (nextAppState === 'active') {
                    console.log("AuthContext: App became active, re-checking session.");
                    // Don't treat this as initial check, avoid splash screen flicker
                    checkUserSessionAndProfile(false);
                }
            });

        } catch (error) {
            console.error("AuthContext: Error setting up listeners:", error);
            setLoadingInitial(false); // Ensure loading stops if listeners fail setup
        }

        // Cleanup function for listeners
        return () => {
            console.log("AuthContext: Cleaning up listeners.");
            authSubscription?.unsubscribe();
            appStateSubscription?.remove();
        };
    }, [checkUserSessionAndProfile]); // Re-run if the check function identity changes (shouldn't often)

    // Show splash screen only during the very initial app open & auth check
    if (loadingInitial) {
      return <SplashScreen />; // Ensure SplashScreen handles its own styling
    }

    // --- Context Value ---
    const value = {
        session,
        user,
        profile, // Expose the fetched profile data
        // Combine loading states: true if initial check OR profile check is running
        isLoading: loadingInitial || loadingProfile,
        // Determine profile completeness based on profile state having a username
        isProfileSetupComplete: !!(profile && profile.username),
        signOut: async () => {
             console.log("AuthContext: Signing out...");
             try {
                 const { error } = await supabase.auth.signOut();
                 if (error) throw error;
                 // State updates are handled by onAuthStateChange listener
             }
             catch (error) {
                 console.error("AuthContext: Sign out error:", error);
                 Alert.alert("Sign Out Error", `Failed to sign out: ${error.message}`);
             }
        },
        // Function to manually trigger a profile re-check if needed
        refreshUserProfileCheck: () => checkUserProfileComplete(user?.id),
    };

    return (<AuthContext.Provider value={value}>{children}</AuthContext.Provider>);
};

// --- Custom Hook ---
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};