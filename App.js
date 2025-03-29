// App.js
import 'react-native-url-polyfill/auto'; // POLYFILL MUST BE AT THE VERY TOP
import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar, LogBox, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// Removed direct Supabase import - handled by AuthContext/lib
import { MaterialCommunityIcons } from '@expo/vector-icons';

// --- Context Providers ---
import { AuthProvider, useAuth } from './contexts/AuthContext'; // Import Auth Context
import { AppProvider } from './contexts/AppContext'; // Import App Data Context

// --- Theme ---
import { COLORS, SIZES, FONTS } from './utils/theme';

// --- Screens ---
// Auth Screen
import AuthScreen from './screens/AuthScreen';
// Core App Screens (Tabs, Details, Modals)
import HomeScreen from './screens/HomeScreen';
import AddBatchScreen from './screens/AddBatchScreen';
import BatchDetailScreen from './screens/BatchDetailScreen';
import AddObservationScreen from './screens/AddObservationScreen';
import SettingsScreen from './screens/SettingsScreen';
import KnowledgeBaseScreen from './screens/KnowledgeBaseScreen';
import MicrogreenDetailScreen from './screens/MicrogreenDetailScreen';
// No need for separate SplashScreen import if AuthProvider handles it

LogBox.ignoreLogs(['Require cycle:', 'No native splash screen']); // Ignore common warnings

// Stack and Tab Navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// --- Bottom Tab Navigator Component (No changes needed from before) ---
function GardenTabs() {
  return (
    <Tab.Navigator screenOptions={/* ... Same options as before ... */ {
         tabBarIcon: ({ focused, color, size }) => { /* ... icon logic ... */
            let iconName;
              if (route.name === 'MyGarden') iconName = focused ? 'sprout' : 'sprout-outline';
              else if (route.name === 'KnowledgeBase') iconName = focused ? 'book-open-page-variant' : 'book-open-page-variant-outline';
              else if (route.name === 'Settings') iconName = focused ? 'cog' : 'cog-outline';
              return <MaterialCommunityIcons name={iconName ?? 'help-circle'} size={size} color={color} />;
         },
         tabBarActiveTintColor: COLORS.primary, tabBarInactiveTintColor: COLORS.gray,
         tabBarStyle: { backgroundColor: COLORS.white, borderTopColor: COLORS.lightGray, borderTopWidth: 1, },
         tabBarLabelStyle: { ...FONTS.body3, fontWeight: '600', paddingBottom: Platform.OS === 'ios' ? SIZES.base * 0.5 : SIZES.base * 0.8, },
         headerShown: false,
      }}
    >
      <Tab.Screen name="MyGarden" component={HomeScreen} options={{ title: 'My Garden' }}/>
      <Tab.Screen name="KnowledgeBase" component={KnowledgeBaseScreen} options={{ title: 'Library' }}/>
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }}/>
    </Tab.Navigator>
  );
}

// --- Main Authenticated App Stack ---
// This navigator contains all screens accessible AFTER login
function AuthenticatedAppStack() {
     return (
         <Stack.Navigator
             screenOptions={{ /* ... Default header styles from before ... */
                 headerStyle: { backgroundColor: COLORS.white, elevation: 1, shadowOpacity: 0.08, shadowOffset: { width: 0, height: 1 }, shadowRadius: 2, borderBottomWidth: Platform.OS === 'android' ? 1 : 0, borderBottomColor: COLORS.lightGray, },
                 headerTintColor: COLORS.primaryDark, headerTitleStyle: { ...FONTS.h3, color: COLORS.primaryDark },
                 headerBackTitleVisible: false, cardStyle: { backgroundColor: COLORS.background },
             }}
         >
            {/* Screen containing the Bottom Tabs */}
            <Stack.Screen name="GardenRoot" component={GardenTabs} options={{ headerShown: false }} />
             {/* Detail Screens */}
             <Stack.Screen name="BatchDetail" component={BatchDetailScreen} options={({ route }) => ({ title: route.params?.batchName || 'Batch Details' })}/>
             <Stack.Screen name="MicrogreenDetail" component={MicrogreenDetailScreen} options={({ route }) => ({ title: route.params?.microgreenData?.name || 'Details' })}/>
             {/* Modal Screens */}
             <Stack.Group screenOptions={{ presentation: 'modal' }}>
                 <Stack.Screen name="AddBatchModal" component={AddBatchScreen} options={{ title: 'Add New Batch' }}/>
                 <Stack.Screen name="AddObservationModal" component={AddObservationScreen} options={{ title: 'Add Observation' }}/>
             </Stack.Group>
        </Stack.Navigator>
    );
}


// --- Root Navigation Logic ---
// Determines whether to show Auth flow or the main Authenticated App
function RootNavigator() {
    // Use the AuthContext to get the session state
    const { session } = useAuth(); // AuthProvider handles initial loading state

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {session && session.user ? (
                // User is logged in: Show the main app stack, wrapped in AppProvider for data
                <Stack.Screen name="AuthenticatedApp">
                    {() => (
                        <AppProvider>
                            <AuthenticatedAppStack />
                        </AppProvider>
                    )}
                </Stack.Screen>
            ) : (
                // User is not logged in: Show the Auth screen
                <Stack.Screen name="Auth" component={AuthScreen} />
            )}
        </Stack.Navigator>
    );
}

// --- App Entry Point ---
export default function App() {
  return (
    // AuthProvider wraps everything to manage session state globally
    <AuthProvider>
        <NavigationContainer>
            {/* Configure the device status bar */}
            <StatusBar
                barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
                backgroundColor={COLORS.primaryDark} // Match Android status bar to theme
            />
            {/* RootNavigator decides which flow (Auth or App) to display */}
            <RootNavigator />
        </NavigationContainer>
    </AuthProvider>
  );
}