// contexts/AuthContext.js
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import SplashScreen from '../screens/SplashScreen'; // Assuming SplashScreen is for general loading

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    const [loadingInitial, setLoadingInitial] = useState(true); // Loading state specifically for initial session check

    useEffect(() => {
        setLoadingInitial(true);
        // Check for existing session on initial load
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoadingInitial(false);
        }).catch(error => {
            console.error("Error getting initial session:", error);
            setLoadingInitial(false); // Ensure loading finishes even on error
        });

        // Listen for auth state changes (Sign in, Sign out, Token refresh etc.)
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log(`Supabase auth event: ${event}`);
                setSession(session);
                setUser(session?.user ?? null);
                // Ensure loading is false once we have definitive auth state
                 setLoadingInitial(false);
            }
        );

        // Cleanup function to unsubscribe from the listener
        return () => {
            authListener?.unsubscribe();
        };
    }, []);

    // Show splash/loading screen during the initial session check
    if (loadingInitial) {
        return <SplashScreen />;
    }

    const value = {
        session,
        user,
        signOut: () => supabase.auth.signOut(),
        // You could add profile fetching/updating logic here too
    };

    // Render children only after initial loading is complete
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to easily access auth context data
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};