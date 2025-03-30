// App.js
// --- THIS IS THE FULL AND COMPLETE CODE FOR THIS FILE ---
import 'react-native-url-polyfill/auto'; // POLYFILL MUST BE AT THE VERY TOP
import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar, LogBox, Platform, TouchableOpacity } from 'react-native';
import {
    NavigationContainer,
    DefaultTheme as NavigationDefaultTheme,
    DarkTheme as NavigationDarkTheme
} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// --- Context Providers & Hooks ---
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppProvider } from './contexts/AppContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext'; // Use Theme context

// --- Theme Constants ---
import { FONTS, SIZES } from './utils/theme';

// --- Screen Imports ---
import AuthScreen from './screens/AuthScreen';
import CreateProfileScreen from './screens/CreateProfileScreen';
import HomeScreen from './screens/HomeScreen';
import AddBatchScreen from './screens/AddBatchScreen';
import BatchDetailScreen from './screens/BatchDetailScreen';
import AddObservationScreen from './screens/AddObservationScreen';
import SettingsScreen from './screens/SettingsScreen';
import KnowledgeBaseScreen from './screens/KnowledgeBaseScreen';
import MicrogreenDetailScreen from './screens/MicrogreenDetailScreen';
import ProfileScreen from './screens/ProfileScreen';
import SplashScreen from './screens/SplashScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import AddKnowledgeBaseEntryScreen from './screens/AddKnowledgeBaseEntryScreen'; // *** IMPORT THE NEW SCREEN ***

// --- Ignore specific warnings ---
LogBox.ignoreLogs(['Require cycle:', 'No native splash screen']);

// --- Initialize Navigators ---
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// --- Bottom Tab Navigator Component ---
function GardenTabs() {
  const { colors } = useTheme(); // Use themed colors

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarShowLabel: false,
        tabBarStyle: {
             backgroundColor: colors.cardBackground,
             borderTopColor: colors.lightGray,
             borderTopWidth: 1,
             height: Platform.OS === 'ios' ? 80 : 60,
             paddingBottom: Platform.OS === 'ios' ? 20 : 5,
             paddingTop: 5,
        },
         tabBarIconStyle: {
             flex: 1, justifyContent: 'center', alignItems: 'center',
         },
        headerShown: false,
      }}
    >
      {/* Screens */}
      <Tab.Screen name="MyGarden" component={HomeScreen} options={{ title: 'My Garden', tabBarIcon: ({ focused, color, size }) => ( <MaterialCommunityIcons name={focused ? 'sprout' : 'sprout-outline'} size={size+4} color={color}/> ), }} />
      <Tab.Screen name="KnowledgeBase" component={KnowledgeBaseScreen} options={{ title: 'Library', tabBarIcon: ({ focused, color, size }) => ( <MaterialCommunityIcons name={focused ? 'book-open-page-variant' : 'book-open-page-variant-outline'} size={size+2} color={color} /> ), }} />
      <Tab.Screen name="Analytics" component={AnalyticsScreen} options={{ title: 'Analytics', tabBarIcon: ({ focused, color, size }) => ( <MaterialCommunityIcons name={focused ? 'chart-line' : 'chart-line-variant'} size={size+2} color={color}/> ), }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile', tabBarIcon: ({ focused, color, size }) => ( <MaterialCommunityIcons name={focused ? 'account-circle' : 'account-circle-outline'} size={size+4} color={color} /> ), }} />
    </Tab.Navigator>
  );
}

// --- Main Authenticated App Stack Navigator ---
function AuthenticatedAppStack() {
     const { colors } = useTheme(); // Use themed colors
     return (
         <Stack.Navigator
             screenOptions={{ // Default screen options for the stack
                 headerStyle: { backgroundColor: colors.cardBackground, elevation: 1, shadowOpacity: 0.08, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2, borderBottomWidth: Platform.OS === 'android' ? 1 : 0, borderBottomColor: colors.lightGray, },
                 headerTintColor: colors.primaryDark, // Back arrow color
                 headerTitleStyle: { ...FONTS.h3, fontWeight: '600', color: colors.text }, // Title text style
                 headerBackTitleVisible: false, // Hide text next to back arrow (iOS)
                 cardStyle: { backgroundColor: colors.background }, // Background for screen transitions
             }}
         >
            {/* The main screen containing the bottom tabs */}
            <Stack.Screen
                 name="GardenRoot" component={GardenTabs}
                 options={({ navigation }) => ({ // Options specific to this screen
                     headerShown: true, title: 'Greensight', headerTitleAlign: 'center',
                     headerTitleStyle: { ...FONTS.h2, color: colors.text, fontWeight: 'bold' }, // Main title style
                     headerStyle: { backgroundColor: colors.background, borderBottomWidth: 0, elevation: 0, shadowOpacity: 0 }, // Flat header
                     headerLeft: () => null, // No back button on main tab screen
                     headerRight: () => ( // Settings button
                         <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={{ marginRight: SIZES.padding, padding: SIZES.base / 2 }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                             <MaterialCommunityIcons name="cog-outline" size={28} color={colors.textSecondary} />
                         </TouchableOpacity>
                     ),
                 })}
             />
             {/* Screens pushed onto the stack */}
             <Stack.Screen name="BatchDetail" component={BatchDetailScreen} options={({ route }) => ({ title: route.params?.batchName || 'Batch Details' })}/>
             <Stack.Screen name="MicrogreenDetail" component={MicrogreenDetailScreen} options={({ route }) => ({ title: route.params?.microgreenData?.name || route.params?.kbEntryId || 'Details' })}/>
             <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings', headerStyle: { backgroundColor: colors.cardBackground, borderBottomColor: colors.lightGray }, }}/>

             {/* Modal Screens presented from the bottom */}
             <Stack.Group screenOptions={{ presentation: 'modal', headerShown: true }}>
                 <Stack.Screen name="AddBatchModal" component={AddBatchScreen} options={{ title: 'Add New Batch' }}/>
                 <Stack.Screen name="AddObservationModal" component={AddObservationScreen} options={{ title: 'Add Observation' }}/>
                 {/* *** ADD THE NEW MODAL SCREEN HERE *** */}
                 <Stack.Screen
                     name="AddKnowledgeBaseEntryModal"
                     component={AddKnowledgeBaseEntryScreen}
                     options={{ title: 'Add Knowledge Base Entry' }}
                 />
             </Stack.Group>
        </Stack.Navigator>
    );
}


// --- Root Navigation Logic ---
function RootNavigator() {
    // Get auth state and theme state
    const { session, user, isProfileSetupComplete, isLoading } = useAuth();
    const { colors, isDark } = useTheme();

    // Determine react-navigation theme based on app theme
    const navigationTheme = isDark ? NavigationDarkTheme : NavigationDefaultTheme;
    const customizedNavTheme = {
        ...navigationTheme,
        colors: { ...navigationTheme.colors, background: colors.background, card: colors.cardBackground, text: colors.text, primary: colors.primary, border: colors.lightGray, },
    };

    // Show splash screen only while checking initial auth state
    if (isLoading) {
      return <SplashScreen />;
    }

    // Main navigation container
    return (
        <NavigationContainer theme={customizedNavTheme}>
             {/* StatusBar style is managed by ThemeContext useEffect */}
             <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!session || !user ? (
                    // User not logged in -> Auth flow
                    <Stack.Screen name="Auth" component={AuthScreen} />
                ) : !isProfileSetupComplete ? (
                    // Logged in but profile incomplete -> Profile setup flow
                     <Stack.Screen name="CreateProfile" component={CreateProfileScreen} />
                ) : (
                    // Logged in and profile complete -> Main app flow
                    <Stack.Screen name="AuthenticatedApp">
                        {() => (
                            // Wrap main app stack with AppProvider
                            <AppProvider>
                                <AuthenticatedAppStack />
                            </AppProvider>
                        )}
                    </Stack.Screen>
                )}
            </Stack.Navigator>
         </NavigationContainer>
    );
}

// --- App Entry Point Component ---
export default function App() {
  // Wrap entire app in context providers
  return (
    <AuthProvider>
        <ThemeProvider>
           <RootNavigator />
        </ThemeProvider>
    </AuthProvider>
  );
}