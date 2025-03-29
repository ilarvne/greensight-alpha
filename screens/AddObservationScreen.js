// screens/AddObservationScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Image, Alert, Platform, KeyboardAvoidingView, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../contexts/AppContext'; // Use AppContext for addObservation
import AppButton from '../components/AppButton';
import { COLORS, FONTS, SIZES } from '../utils/theme';

const AddObservationScreen = ({ route, navigation }) => {
  const { batchId } = route.params;
  const { addObservation } = useAppContext(); // Get Supabase-enabled function

  const [notes, setNotes] = useState('');
  const [height, setHeight] = useState('');
  const [photoUri, setPhotoUri] = useState(null); // Store local URI from picker
  const [isSaving, setIsSaving] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll access is needed to add photos.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Optional: allow user to crop/edit
      aspect: [4, 3],
      quality: 0.7, // Compress image slightly
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleAddObservation = async () => { // Make async
     if (!notes.trim() && !height.trim() && !photoUri) {
        Alert.alert('Empty Observation', 'Please add notes, height, or a photo.');
        return;
     }

    const heightValue = height.trim() === '' ? null : parseFloat(height.replace(',', '.')); // Allow comma decimal separator

    if (height.trim() !== '' && (isNaN(heightValue) || heightValue < 0)) {
         Alert.alert('Invalid Height', 'Please enter a valid positive number for height (e.g., 2.5).');
         return;
    }

    setIsSaving(true);
    const observationData = {
      notes: notes.trim(),
      height: heightValue,
      photoUri: photoUri, // Pass the local URI for now
      // In a full implementation, upload photoUri to Supabase Storage here
      // and pass the returned storage URL instead of photoUri.
    };

    try {
        // Call the context function which now saves to Supabase
        await addObservation(batchId, observationData);
        navigation.goBack(); // Go back on success
    } catch (error) {
        console.error("Error caught in AddObservationScreen:", error);
        // Alert likely shown in context function
    } finally {
        setIsSaving(false);
    }
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
            <Text style={styles.title}>Log Observation</Text>

            {/* Input Fields using Theme */}
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Notes / Visual Changes</Text>
                <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="e.g., True leaves emerged, looking healthy..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
                placeholderTextColor={COLORS.gray}
                editable={!isSaving}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Sprout Height (cm)</Text>
                <TextInput
                style={styles.input}
                placeholder="Enter height (optional, e.g., 3.5)"
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric" // Use numeric for better input handling potentially
                placeholderTextColor={COLORS.gray}
                editable={!isSaving}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.label}>Photo (Optional)</Text>
                 <TouchableOpacity onPress={pickImage} disabled={isSaving} style={styles.imagePicker}>
                    {photoUri ? (
                        <Image source={{ uri: photoUri }} style={styles.imagePreview} resizeMode="cover" />
                    ) : (
                         <View style={styles.imagePlaceholder}>
                             <MaterialCommunityIcons name="camera-plus-outline" size={40} color={COLORS.gray}/>
                             <Text style={styles.imagePlaceholderText}>Tap to add photo</Text>
                         </View>
                    )}
                 </TouchableOpacity>
                 {photoUri && ( // Show remove button only if photo exists
                     <AppButton
                         title="Remove Photo"
                         onPress={() => setPhotoUri(null)}
                         color="danger"
                         variant="outline"
                         style={styles.removeButton}
                         disabled={isSaving}
                     />
                 )}
            </View>

            <AppButton
                title="Save Observation"
                onPress={handleAddObservation}
                loading={isSaving}
                disabled={isSaving}
                style={styles.saveButton}
                color="secondary" // Use secondary color for save
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
   input: { /* Same as AddBatchScreen input style */
       backgroundColor: COLORS.inputBackground, borderWidth: 1.5, borderColor: COLORS.inputBorder,
       borderRadius: SIZES.radius * 0.8, paddingHorizontal: SIZES.padding,
       paddingVertical: Platform.OS === 'ios' ? SIZES.padding * 0.9 : SIZES.padding * 0.7,
       ...FONTS.input, color: COLORS.text,
   },
   textArea: { height: 120, textAlignVertical: 'top' },
   imagePicker: {
       width: '100%',
       height: 200,
       borderRadius: SIZES.radius,
       backgroundColor: COLORS.lightGray + '80', // Slightly transparent background
       justifyContent: 'center',
       alignItems: 'center',
       borderWidth: 1.5,
       borderColor: COLORS.inputBorder,
       borderStyle: 'dashed', // Dashed border for placeholder
       marginBottom: SIZES.base, // Space before remove button
       overflow: 'hidden', // Ensure image respects border radius
   },
   imagePreview: { width: '100%', height: '100%' },
   imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
   imagePlaceholderText: { ...FONTS.body2, color: COLORS.gray, marginTop: SIZES.base },
   removeButton: { width: '100%', marginTop: SIZES.base, backgroundColor: 'transparent' }, // Outline buttons don't need background override
   saveButton: { marginTop: SIZES.padding * 1.5, width: '100%' },
});

export default AddObservationScreen;