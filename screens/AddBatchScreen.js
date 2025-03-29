// screens/AddBatchScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { useAppContext } from '../contexts/AppContext'; // Use AppContext for addBatch
import AppButton from '../components/AppButton';
import { COLORS, FONTS, SIZES } from '../utils/theme';
// Optional: Import date picker if needed
// import DateTimePickerModal from "react-native-modal-datetime-picker";
// import { formatDate } from '../utils/helpers';

const AddBatchScreen = ({ navigation }) => {
  const { addBatch } = useAppContext(); // Get Supabase-enabled addBatch function
  const [name, setName] = useState('');
  const [sowDate, setSowDate] = useState(new Date()); // Keep using Date object locally
  const [comments, setComments] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // --- Date Picker Logic (Keep if using) ---
  // const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  // const showDatePicker = () => setDatePickerVisibility(true);
  // ... etc ...

  const handleAddBatch = async () => { // Make async
    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter a name for your microgreen batch.');
      return;
    }
    // Basic validation for sow date (ensure it's a valid date)
    if (isNaN(sowDate.getTime())) {
        Alert.alert('Invalid Date', 'Please select a valid sowing date.');
        return;
    }

    setIsSaving(true);
    const newBatchData = {
      name: name.trim(),
      // Ensure sowDate is sent in ISO format suitable for Supabase timestamptz
      sowDate: sowDate.toISOString(),
      comments: comments.trim(),
    };

    try {
      await addBatch(newBatchData); // Call the async context function
      navigation.goBack(); // Go back only on success
    } catch (error) {
      // Error is likely already alerted in context, but you could add more specific handling here
      console.error("Error caught in AddBatchScreen:", error);
      // Alert.alert('Error', 'Could not save the batch.'); // Avoid double alerts if context alerts
    } finally {
       setIsSaving(false);
    }
  };

  // Simple Date Input (for Snack compatibility, replace with Picker ideally)
  const handleDateChange = (text) => {
      // Basic attempt to parse YYYY-MM-DD, very lenient
      const parts = text.split('-');
      if (parts.length === 3) {
          const year = parseInt(parts[0]);
          const month = parseInt(parts[1]) - 1; // Month is 0-indexed
          const day = parseInt(parts[2]);
          if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
              const date = new Date(Date.UTC(year, month, day)); // Use UTC to avoid timezone issues
              if (!isNaN(date.getTime())) {
                   setSowDate(date);
                   return; // Exit if valid date found
              }
          }
      }
      // If parsing fails or input is incomplete, maybe set back to current or handle differently
      // For simplicity, we don't strictly validate format here, rely on check before save.
  };

  return (
    <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
    >
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
        >
            <Text style={styles.title}>Start a New Batch</Text>

            {/* Input Fields using Theme */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Microgreen Name/Type *</Text>
                <TextInput
                style={styles.input}
                placeholder="e.g., Radish, Broccoli, Sunflower Mix"
                value={name}
                onChangeText={setName}
                placeholderTextColor={COLORS.gray}
                editable={!isSaving}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Sowing Date *</Text>
                 {/* Simple Text Input for Date */}
                 <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD (Tap to edit)"
                     // Display current date or selected date
                    value={sowDate.toISOString().split('T')[0]}
                    // onChangeText={handleDateChange} // Use handler for basic parsing
                     onFocus={() => Alert.alert("Date Entry", "Please enter date as YYYY-MM-DD. A date picker is recommended for real apps.")} // Simple alert instead of complex input handling
                    placeholderTextColor={COLORS.gray}
                    keyboardType="numeric"
                    editable={!isSaving}
                />
                 {/* Add a proper Date Picker component here in a real app */}
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Substrate/Notes (Optional)</Text>
                <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., Coconut coir, weighted blackout..."
                value={comments}
                onChangeText={setComments}
                multiline
                numberOfLines={4} // Increased lines
                placeholderTextColor={COLORS.gray}
                textAlignVertical="top" // Android alignment
                editable={!isSaving}
                />
            </View>

            <AppButton
                title="Add Batch"
                onPress={handleAddBatch}
                style={styles.addButton}
                loading={isSaving}
                disabled={isSaving}
                color="primary"
            />

        </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Styles using Theme
const styles = StyleSheet.create({
   keyboardAvoidingView: { flex: 1, backgroundColor: COLORS.background },
   container: { flex: 1 },
   scrollContent: { flexGrow: 1, padding: SIZES.paddingLarge },
   title: { ...FONTS.h1, color: COLORS.primaryDark, marginBottom: SIZES.paddingLarge * 1.5, textAlign: 'center' },
   inputGroup: { marginBottom: SIZES.padding * 1.2 },
   label: { ...FONTS.h4, color: COLORS.textSecondary, marginBottom: SIZES.base },
   input: {
       backgroundColor: COLORS.inputBackground,
       borderWidth: 1.5,
       borderColor: COLORS.inputBorder,
       borderRadius: SIZES.radius * 0.8,
       paddingHorizontal: SIZES.padding,
       paddingVertical: Platform.OS === 'ios' ? SIZES.padding * 0.9 : SIZES.padding * 0.7,
       ...FONTS.input,
       color: COLORS.text,
   },
   textArea: { height: 100, textAlignVertical: 'top' }, // Ensure consistent height
   addButton: { marginTop: SIZES.padding * 1.5, width: '100%' }, // Make button full width
   // Date picker styles (if using TouchableOpacity for picker)
   // dateText: { ...FONTS.input },
   // placeholderText: { ...FONTS.input, color: COLORS.gray },
});

export default AddBatchScreen;