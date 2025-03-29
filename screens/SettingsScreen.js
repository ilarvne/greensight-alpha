// screens/SettingsScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import AppButton from '../components/AppButton';
// Use AuthContext to get signOut function and user info
import { useAuth } from '../contexts/AuthContext';
import { COLORS, FONTS, SIZES } from '../utils/theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// Notification functions might be moved to a separate utility or kept here temporarily
import * as Notifications from 'expo-notifications';

// Helper function for notification permissions (can be moved to utils)
const requestNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    let finalStatus = status;
    if (finalStatus !== 'granted') {
        const { status: requestedStatus } = await Notifications.requestPermissionsAsync();
        finalStatus = requestedStatus;
    }
    if (finalStatus !== 'granted') {
        Alert.alert('Permission Denied', 'Notification permissions are needed to set daily reminders.');
        return false;
    }
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', { name: 'Default', importance: Notifications.AndroidImportance.MAX });
    }
    return true;
};

// Helper function for scheduling (can be moved to utils)
const scheduleDailyReminder = async (hour = 10, minute = 0) => {
    await Notifications.cancelAllScheduledNotificationsAsync();
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title: "🌱 Greensight Check-in!", body: "Time to check your microgreens!", sound: true },
        trigger: { hour: hour, minute: minute, repeats: true },
      });
      Alert.alert('Reminder Set', `Daily check-in reminder scheduled for ${hour}:${String(minute).padStart(2, '0')}.`);
    } catch (error) {
       console.error("Error scheduling notification:", error);
       Alert.alert('Scheduling Error', 'Could not schedule the reminder.');
    }
};


const SettingsScreen = () => {
    // Get signOut function and user object from AuthContext
    const { signOut, user } = useAuth();

    const handleSetReminder = async () => {
        const granted = await requestNotificationPermissions();
         if (granted) {
             scheduleDailyReminder(10, 0); // Example: 10:00 AM
         }
     }

     const handleSignOut = async () => {
         Alert.alert(
             "Sign Out",
             "Are you sure you want to sign out?",
             [
                 { text: "Cancel", style: "cancel" },
                 {
                     text: "Sign Out",
                     style: "destructive",
                     onPress: async () => {
                         try {
                             await signOut();
                             // Auth state listener in AuthContext/App.js will handle navigation
                             console.log("User signed out successfully.");
                         } catch (error) {
                             console.error("Sign out error:", error);
                             Alert.alert("Error", "Failed to sign out. Please try again.");
                         }
                     },
                 },
             ]
         );
     };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Settings</Text>

      {/* User Info Section */}
        <View style={styles.section}>
             <Text style={styles.sectionTitle}>Account</Text>
             <View style={styles.settingItem}>
                 <MaterialCommunityIcons name="email-outline" size={24} color={COLORS.primary} style={styles.icon}/>
                 <View style={styles.textContainer}>
                     <Text style={styles.settingLabel}>Email</Text>
                     <Text style={styles.settingValue}>{user?.email ?? 'Not logged in'}</Text>
                 </View>
             </View>
             <AppButton
                title="Sign Out"
                onPress={handleSignOut}
                style={styles.button}
                color="danger" // Use danger color for sign out
                icon={<MaterialCommunityIcons name="logout-variant" size={20} color={COLORS.white}/>}
             />
        </View>


       {/* Notifications Section */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View style={styles.settingItem}>
                <MaterialCommunityIcons name="bell-ring-outline" size={24} color={COLORS.primary} style={styles.icon}/>
                <View style={styles.textContainer}>
                    <Text style={styles.settingLabel}>Daily Reminder</Text>
                    <Text style={styles.settingDescription}>Get notified daily to check your microgreens.</Text>
                </View>
            </View>
            <AppButton
                    title="Set Reminder (10:00 AM)" // Update time if dynamic setting is added
                    onPress={handleSetReminder}
                    style={styles.button}
                    color="accent" // Use accent color
                    icon={<MaterialCommunityIcons name="clock-outline" size={20} color={COLORS.white}/>}
            />
        </View>

        {/* About Section */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
             <View style={styles.settingItem}>
                <MaterialCommunityIcons name="information-outline" size={24} color={COLORS.primary} style={styles.icon}/>
                <View style={styles.textContainer}>
                    <Text style={styles.settingLabel}>Greensight App</Text>
                    <Text style={styles.settingDescription}>Version 1.1.0 (Supabase Integration)</Text>
                </View>
            </View>
        </View>


    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
   scrollContent: {
        padding: SIZES.paddingLarge,
        paddingBottom: SIZES.paddingLarge * 2, // Extra space at bottom
   },
  title: {
    ...FONTS.h1,
    color: COLORS.primaryDark,
    marginBottom: SIZES.paddingLarge,
  },
   section: {
       marginBottom: SIZES.paddingLarge * 1.5, // Space between sections
   },
   sectionTitle: {
       ...FONTS.h3,
       color: COLORS.textSecondary,
       marginBottom: SIZES.padding,
       fontWeight: '600',
       borderBottomWidth: 1,
       borderBottomColor: COLORS.lightGray,
       paddingBottom: SIZES.base,
   },
  settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: COLORS.cardBackground, // Use card background
      padding: SIZES.padding,
      borderRadius: SIZES.radius,
      marginBottom: SIZES.padding,
       shadowColor: COLORS.black,
       shadowOffset: { width: 0, height: 1 },
       shadowOpacity: 0.05,
       shadowRadius: 2,
       elevation: 1,
       borderWidth: 1, // Subtle border
       borderColor: COLORS.lightGray,
  },
  icon: {
      marginRight: SIZES.padding,
      color: COLORS.primary, // Use primary color for icons
  },
  textContainer: {
      flex: 1,
  },
  settingLabel: { // Changed from settingTitle for clarity
      ...FONTS.h4,
      color: COLORS.text,
      marginBottom: SIZES.base / 2,
      fontWeight: '600',
  },
   settingValue: { // Style for displaying user email etc.
       ...FONTS.body1,
       color: COLORS.textSecondary,
   },
  settingDescription: {
      ...FONTS.body2,
      color: COLORS.textSecondary,
      lineHeight: 18,
  },
   button: {
       marginTop: SIZES.base, // Less margin for buttons within sections
       width: '100%', // Make buttons full width within padding
   }
});

export default SettingsScreen;