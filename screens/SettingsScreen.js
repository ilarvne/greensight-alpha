// screens/SettingsScreen.js
import React, { useState, useCallback, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, Alert, Platform,
  TouchableOpacity, ActivityIndicator, Switch, SafeAreaView
} from "react-native";
import { useAuth } from "../contexts/AuthContext"; // Import useAuth for signOut
import { useTheme } from "../contexts/ThemeContext";
import { FONTS, SIZES } from "../utils/theme";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import DateTimePickerModal from "react-native-modal-datetime-picker"; // Ensure installed
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatDate } from "../utils/helpers";
import AppButton from "../components/AppButton"; // Import AppButton for Sign Out

// --- Notification Helper Functions (Keep as previously defined) ---
const NOTIFICATION_PREFS_KEY = "@Greensight:notificationPrefs";

const requestNotificationPermissions = async () => { /* ... (Keep existing function) ... */ };
const scheduleDailyReminder = async (hour, minute) => { /* ... (Keep existing function) ... */ };
const cancelAllReminders = async () => { /* ... (Keep existing function) ... */ };

// --- Reusable Section Component ---
const SettingsSection = ({ title, children, colors }) => (
    <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text, borderBottomColor: colors.lightGray + '80' }]}>
            {title}
        </Text>
        <View style={styles.sectionContent}>
            {children}
        </View>
    </View>
);

// --- Reusable Setting Row Component ---
const SettingRow = ({ label, description, children, colors }) => (
    <View style={styles.settingRow}>
        <View style={styles.settingTextContainer}>
            <Text style={[styles.settingLabel, { color: colors.text }]}>{label || ''}</Text>
            {description && <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>{description || ''}</Text>}
        </View>
        <View style={styles.settingControlContainer}>
            {children}
        </View>
    </View>
);

// --- Theme Option Button ---
const ThemeOptionButton = ({ schemeValue, schemeLabel, iconName, currentPref, onPress, colors }) => {
    const isActive = currentPref === schemeValue;
    const activeBg = colors.primaryLight;
    const activeBorder = colors.primaryDark;
    const activeText = colors.primaryDark;
    const inactiveBg = colors.inputBackground;
    const inactiveBorder = colors.inputBorder;
    const inactiveText = colors.textSecondary;

    return (
      <TouchableOpacity
        style={[ styles.themeOptionButton, { borderColor: isActive ? activeBorder : inactiveBorder, backgroundColor: isActive ? activeBg : inactiveBg } ]}
        onPress={() => onPress(schemeValue)}
        key={schemeValue}
        activeOpacity={0.7} >
        <MaterialCommunityIcons name={iconName} size={22} color={isActive ? activeText : inactiveText} style={styles.themeIcon} />
        <Text style={[ styles.themeOptionText, { color: isActive ? activeText : inactiveText } ]}>
          {schemeLabel}
        </Text>
      </TouchableOpacity>
    );
};


// --- Settings Screen Component ---
const SettingsScreen = ({ navigation }) => {
  const { colors, setScheme, colorSchemePref } = useTheme();
  const { signOut } = useAuth(); // Get signOut function
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState(() => { // Default time
    const initialTime = new Date(); initialTime.setHours(10, 0, 0, 0); return initialTime;
  });
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false); // Loading state for notification changes

  // Load stored notification preferences on mount
  useEffect(() => {
    let isMounted = true;
    const loadPrefs = async () => {
      setLoadingSettings(true);
      try {
        const jsonValue = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
        const storedPrefs = jsonValue != null ? JSON.parse(jsonValue) : null;
        if (isMounted && storedPrefs) {
          setNotificationsEnabled(storedPrefs.enabled ?? false);
          const time = new Date();
          time.setHours(storedPrefs.hour ?? 10); time.setMinutes(storedPrefs.minute ?? 0); time.setSeconds(0, 0);
          setReminderTime(time);
          console.log("SettingsScreen: Loaded Prefs", { enabled: storedPrefs.enabled, time: formatDate(time, "HH:mm") });
        } else if (isMounted) { // Set defaults if nothing stored
          const defaultTime = new Date(); defaultTime.setHours(10, 0, 0, 0);
          setReminderTime(defaultTime); setNotificationsEnabled(false);
          console.log("SettingsScreen: No stored prefs, using defaults.");
        }
      } catch (e) { console.error("SettingsScreen: Failed load notification prefs.", e); }
      finally { if (isMounted) setLoadingSettings(false); }
    };
    loadPrefs();
    return () => { isMounted = false; };
  }, []);

  // Handle Notification Toggle
  const handleNotificationToggle = async (isEnabled) => {
    if (isScheduling) return;
    setIsScheduling(true);
    setNotificationsEnabled(isEnabled);
    const currentHour = reminderTime.getHours();
    const currentMinute = reminderTime.getMinutes();
    const prefsToSave = { enabled: isEnabled, hour: currentHour, minute: currentMinute };

    try {
        await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefsToSave));
        if (isEnabled) {
            const granted = await requestNotificationPermissions();
            if (granted) {
                const scheduled = await scheduleDailyReminder(currentHour, currentMinute);
                if (!scheduled) { // If scheduling failed, revert state and storage
                    setNotificationsEnabled(false); await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify({ ...prefsToSave, enabled: false }));
                } else { Alert.alert("Reminders Enabled", `Daily reminder set for ${formatDate(reminderTime, "HH:mm")}.`); }
            } else { // If permission denied, revert state and storage
                 setNotificationsEnabled(false); await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify({ ...prefsToSave, enabled: false }));
            }
        } else { // If toggling off
            await cancelAllReminders(); Alert.alert("Reminders Disabled", "Daily reminders turned off.");
        }
    } catch (e) {
        console.error("SettingsScreen: Failed save/update notification prefs.", e); Alert.alert("Error", "Could not save notification settings.");
        setNotificationsEnabled(!isEnabled); // Revert UI on error
    } finally { setIsScheduling(false); }
  };

  // Handle Time Picker
  const showTimePicker = () => !isScheduling && setTimePickerVisibility(true);
  const hideTimePicker = () => setTimePickerVisibility(false);
  const handleConfirmTime = async (time) => {
    hideTimePicker();
    if (!time || isScheduling) return; // Exit if no time selected or already processing

    setIsScheduling(true);
    const previousTime = reminderTime; // Store previous time for potential revert
    time.setSeconds(0, 0); // Ignore seconds
    setReminderTime(time); // Update UI optimistically

    const newHour = time.getHours();
    const newMinute = time.getMinutes();
    const prefsToSave = { enabled: notificationsEnabled, hour: newHour, minute: newMinute };

    try {
        await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify(prefsToSave));
        // Reschedule only if notifications are currently enabled
        if (notificationsEnabled) {
            const granted = await requestNotificationPermissions(); // Re-check permissions just in case
            if (granted) {
                const scheduled = await scheduleDailyReminder(newHour, newMinute);
                if (scheduled) { Alert.alert("Reminder Time Updated", `Daily reminder time changed to ${formatDate(time, "HH:mm")}.`); }
                else { // Rescheduling failed, revert
                    setReminderTime(previousTime); await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify({ ...prefsToSave, hour: previousTime.getHours(), minute: previousTime.getMinutes() })); Alert.alert("Error", "Could not update reminder time.");
                }
            } else { // Permission denied after changing time? Disable notifications
                 setNotificationsEnabled(false); await AsyncStorage.setItem(NOTIFICATION_PREFS_KEY, JSON.stringify({ ...prefsToSave, enabled: false })); Alert.alert("Permission Denied", "Notifications disabled as permission was revoked.");
            }
        }
    } catch (e) { console.error("SettingsScreen: Failed save/reschedule time.", e); Alert.alert("Error", "Could not update reminder time."); setReminderTime(previousTime); } // Revert UI on error
    finally { setIsScheduling(false); }
  };

  // Handle Theme Change
  const handleSetScheme = (scheme) => {
      if (setScheme) { setScheme(scheme); } // Call context function
  };

  // Handle Sign Out
   const handleSignOut = () => {
       Alert.alert(
           "Sign Out",
           "Are you sure you want to sign out?",
           [
               { text: "Cancel", style: "cancel" },
               {
                   text: "Sign Out",
                   style: "destructive",
                   onPress: async () => {
                       if (signOut) {
                           await signOut();
                           // AuthProvider listener should handle navigation automatically
                       } else {
                           Alert.alert("Error", "Sign out function not available.");
                       }
                   },
               },
           ]
       );
   };

   // --- Main Render ---
   if (loadingSettings) {
       return ( <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}><ActivityIndicator size="large" color={colors.primary} /></View> );
   }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} >

            {/* --- Notifications Section --- */}
             <SettingsSection title="Notifications" colors={colors}>
                <SettingRow label="Enable Daily Reminders" description="Get a daily notification to check your microgreens." colors={colors}>
                     <Switch trackColor={{ false: colors.gray + "80", true: colors.primaryLight }} thumbColor={notificationsEnabled ? colors.primary : colors.lightGray} ios_backgroundColor={colors.lightGray} onValueChange={handleNotificationToggle} value={notificationsEnabled} disabled={isScheduling} />
                </SettingRow>
                {/* Only show time picker option if enabled */}
                {notificationsEnabled && (
                     <SettingRow label="Reminder Time" colors={colors}>
                         <TouchableOpacity onPress={showTimePicker} disabled={isScheduling} style={styles.timeDisplayButton}>
                            {/* Ensure time is wrapped in Text */}
                             <Text style={[styles.timeDisplayText, {color: colors.primaryDark}]}>{formatDate(reminderTime, "HH:mm")}</Text>
                             <MaterialCommunityIcons name="clock-edit-outline" size={22} color={colors.primaryDark} style={{ marginLeft: SIZES.base }} />
                         </TouchableOpacity>
                     </SettingRow>
                )}
                 {/* Show subtle indicator while scheduling */}
                 {isScheduling && <ActivityIndicator size="small" color={colors.primary} style={styles.schedulingIndicator} />}
            </SettingsSection>

             {/* --- Appearance Section --- */}
             <SettingsSection title="Appearance" colors={colors}>
                 <SettingRow label="App Theme" colors={colors} description="Choose your preferred color scheme.">
                     {/* Content takes full width */}
                     {null}
                 </SettingRow>
                 {/* Theme options below the label/description */}
                 <View style={styles.themeOptionsContainer}>
                    <ThemeOptionButton schemeValue="light" schemeLabel="Light" iconName="weather-sunny" currentPref={colorSchemePref} onPress={handleSetScheme} colors={colors} />
                    <ThemeOptionButton schemeValue="dark" schemeLabel="Dark" iconName="weather-night" currentPref={colorSchemePref} onPress={handleSetScheme} colors={colors} />
                    <ThemeOptionButton schemeValue="system" schemeLabel="System" iconName="theme-light-dark" currentPref={colorSchemePref} onPress={handleSetScheme} colors={colors} />
                 </View>
            </SettingsSection>

            {/* --- Account Section --- */}
            <SettingsSection title="Account" colors={colors}>
                <AppButton
                    title="Sign Out"
                    onPress={handleSignOut}
                    color="danger" // Use danger color for sign out
                    variant="outline" // Use outline style
                    icon={<MaterialCommunityIcons name="logout-variant" size={20} color={colors.danger}/>}
                    style={styles.signOutButton}
                />
            </SettingsSection>


            {/* --- Date Time Picker Modal --- */}
            <DateTimePickerModal
                isVisible={isTimePickerVisible}
                mode="time"
                date={reminderTime || new Date()} // Ensure valid date passed
                onConfirm={handleConfirmTime}
                onCancel={hideTimePicker}
                headerTextIOS="Select Reminder Time" // Customize iOS header
                is24Hour={true} // Use 24 hour format
                // Add theming/color props if available in your version
                // buttonTextColorIOS={colors.primary}
            />
        </ScrollView>
    </SafeAreaView>
  );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, },
  container: { flex: 1, },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: SIZES.paddingLarge, paddingBottom: SIZES.paddingLarge * 3, },
  section: { marginBottom: SIZES.paddingLarge * 1.8, }, // More space between sections
  sectionTitle: { ...FONTS.h3, fontWeight: "600", marginBottom: SIZES.padding, paddingBottom: SIZES.padding * 0.6, borderBottomWidth: 1, },
  sectionContent: { // Add padding within section if needed, or rely on row padding
    // paddingHorizontal: SIZES.base,
  },
  settingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: SIZES.padding * 0.8, minHeight: 60, borderBottomWidth: 1, // Add subtle divider between rows
      borderBottomColor: 'rgba(128,128,128,0.1)', // Very light divider
  },
  settingTextContainer: { flex: 1, marginRight: SIZES.padding },
  settingLabel: { ...FONTS.body1, marginBottom: SIZES.base / 4, }, // Use body1 for setting labels
  settingDescription: { ...FONTS.body3, lineHeight: 18, opacity: 0.8 },
  settingControlContainer: { // Container for switch, button etc.
     // Allows control elements to define their own size
  },
  themeOptionsContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "stretch", gap: SIZES.base, marginTop: SIZES.base }, // Use gap for spacing
  themeOptionButton: { flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center", paddingVertical: SIZES.padding * 0.8, paddingHorizontal: SIZES.base, borderRadius: SIZES.radius, borderWidth: 2, minHeight: 65, // Make theme buttons taller
    gap: SIZES.base * 0.5, // Space between icon and text
  },
  themeIcon: { /* Removed marginRight */ },
  themeOptionText: { ...FONTS.body2, fontWeight: "600" },
  timeDisplayButton: { flexDirection: "row", alignItems: "center", paddingVertical: SIZES.base, paddingHorizontal: SIZES.padding * 0.5, borderRadius: SIZES.radius * 0.5, },
  timeDisplayText: { ...FONTS.h4, fontWeight: "500" }, // Make time slightly smaller
  schedulingIndicator: { marginTop: SIZES.padding * 0.5, alignSelf: "flex-end", height: 20, },
  signOutButton: { marginTop: SIZES.padding, }, // Add margin above sign out button
});

export default SettingsScreen;