// screens/AddBatchScreen.js
import React, { useState, useCallback } from 'react';
import {
    View, Text, TextInput, StyleSheet, ScrollView, Platform, FlatList,
    KeyboardAvoidingView, Alert, TouchableOpacity, Image, ActivityIndicator, Keyboard,
    TouchableWithoutFeedback // Import for dismissing keyboard
} from 'react-native';
import { z } from 'zod';
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import AppButton from '../components/AppButton';
import { useTheme } from '../contexts/ThemeContext';
import { FONTS, SIZES } from '../utils/theme';
import { formatDate } from '../utils/helpers';
import DateTimePickerModal from "react-native-modal-datetime-picker"; // Ensure this is installed
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
// Image upload helpers will be called from AppContext now
// import * as FileSystem from 'expo-file-system';
// import { decode } from 'base64-arraybuffer';
// import { supabase } from '../lib/supabase';

// --- Zod Validation Schema (Keep from previous step) ---
const batchSchema = z.object({
  name: z.string().trim().min(3, { message: "Name must be at least 3 characters" }),
  sowDate: z.date().max(new Date(), { message: "Sow date cannot be in the future" }),
  estimatedDays: z.string()
    .transform((val) => val.trim() === '' ? null : parseInt(val.replace(',', '.'), 10)) // Allow comma, convert empty to null
    .nullable()
    .refine((val) => val === null || (!isNaN(val) && val > 0), { message: "Must be a positive number if entered" }),
  comments: z.string().optional(),
});

// --- Add Batch Screen Component ---
const AddBatchScreen = ({ route, navigation }) => {
  const prefillName = route.params?.prefillName;
  const { colors } = useTheme();
  const { user } = useAuth();
  const { addBatch, knowledgeBaseEntries } = useAppContext(); // Use context addBatch

  // --- State ---
  const [name, setName] = useState(prefillName || '');
  const [sowDate, setSowDate] = useState(new Date()); // Default to today
  const [comments, setComments] = useState('');
  const [localImageUri, setLocalImageUri] = useState(null); // Local URI for display/upload
  const [estimatedDays, setEstimatedDays] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [errors, setErrors] = useState({});

  // --- Input Handlers ---
  const handleNameChange = useCallback((text) => {
      setName(text);
      if (errors.name) setErrors(prev => ({ ...prev, name: undefined })); // Clear error on change
      if (text.trim().length > 1) {
          const filtered = knowledgeBaseEntries.filter(entry => entry.name.toLowerCase().includes(text.toLowerCase())).slice(0, 5);
          setSuggestions(filtered);
          setShowSuggestions(filtered.length > 0);
      } else {
          setSuggestions([]); setShowSuggestions(false);
      }
  }, [errors.name, knowledgeBaseEntries]); // Include errors in dependency if clearing depends on it

  const handleSuggestionSelect = useCallback((suggestion) => {
      setName(suggestion.name);
      setSuggestions([]); setShowSuggestions(false);
      setErrors(prev => ({ ...prev, name: undefined })); // Clear name error
      const harvestDays = suggestion.max_harvest_days ?? suggestion.min_harvest_days ?? null;
      setEstimatedDays(harvestDays !== null ? String(harvestDays) : '');
      setErrors(prev => ({ ...prev, estimatedDays: undefined })); // Clear harvest day error
      Keyboard.dismiss();
  }, []); // No dependencies needed here usually

  const handleEstimatedDaysChange = (text) => {
      // Allow only numbers and potentially a comma/dot
      const numericText = text.replace(/[^0-9.,]/g, '');
      setEstimatedDays(numericText);
      if (errors.estimatedDays) setErrors(prev => ({ ...prev, estimatedDays: undefined }));
  };

  // --- Image Picker ---
  const pickImage = async () => {
    if (isSaving) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'Camera roll access needed.'); return; }
    try {
        let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
        if (!result.canceled && result.assets?.length > 0) { setLocalImageUri(result.assets[0].uri); }
    } catch(e){ console.error("Image Picker Error:", e); Alert.alert("Error", "Could not select image."); }
  };
  const removeImage = () => setLocalImageUri(null);

  // --- Date Picker Handlers ---
  const showDatePicker = () => !isSaving && setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirmDate = (selectedDate) => {
    hideDatePicker(); // Hide picker immediately
    if (selectedDate) {
        const currentDate = new Date(); currentDate.setHours(23, 59, 59, 999); // End of today
        if (selectedDate <= currentDate) {
             setSowDate(selectedDate);
             setErrors(prev => ({ ...prev, sowDate: undefined })); // Clear error
        } else {
             // This alert might be annoying, handled by Zod on submit anyway
             // Alert.alert("Invalid Date", "Cannot select a future date.");
             // Optionally set back to today or keep invalid state for Zod to catch
             // setSowDate(new Date());
        }
    }
  };

  // --- Form Submission ---
  const handleAddBatch = async () => {
    if (!user) { Alert.alert("Error", "User not found."); return null; }
    Keyboard.dismiss(); // Dismiss keyboard before validation/saving
    setErrors({});

    const dataToValidate = { name, sowDate, estimatedDays, comments };
    const validationResult = batchSchema.safeParse(dataToValidate);

    if (!validationResult.success) {
        const formattedErrors = {};
        validationResult.error.errors.forEach(err => { if (err.path.length > 0) { formattedErrors[err.path[0]] = err.message; }});
        setErrors(formattedErrors); console.log("Validation errors:", formattedErrors);
        Alert.alert("Validation Failed", "Please check the inputs."); return null;
    }

    const validatedData = validationResult.data;
    setIsSaving(true);
    let addedBatchId = null;

    try {
        // Prepare data for AppContext function (includes local URI)
        const newBatchDataForContext = {
            name: validatedData.name,
            sowDate: validatedData.sowDate.toISOString(),
            comments: validatedData.comments?.trim() ?? '',
            estimatedDays: validatedData.estimatedDays, // Already number or null
            localImageUri: localImageUri, // Pass local URI
        };

        addedBatchId = await addBatch(newBatchDataForContext); // Context handles upload now

        if (addedBatchId) { navigation.goBack(); }
        else { console.log("AddBatchScreen: addBatch call failed or didn't return ID."); }

    } catch (error) { console.error("Error saving batch from AddBatchScreen:", error); Alert.alert('Save Error', `An unexpected error occurred: ${error.message}`); addedBatchId = null; }
    finally { setIsSaving(false); }
    return addedBatchId;
  };

  // --- Render Suggestion Item ---
  const renderSuggestionItem = ({ item }) => ( <TouchableOpacity style={[styles.suggestionItem, { borderBottomColor: colors.lightGray }]} onPress={() => handleSuggestionSelect(item)} > <Text style={{ color: colors.text }}>{item.name}</Text> </TouchableOpacity> );

  // --- Component Render ---
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.keyboardAvoidingView, { backgroundColor: colors.background }]}>
       {/* Use TouchableWithoutFeedback to dismiss keyboard and suggestions when tapping outside */}
       <TouchableWithoutFeedback onPress={() => { Keyboard.dismiss(); setShowSuggestions(false); }}>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {/* Optional: Add a subtle icon/title */}
                <View style={styles.titleContainer}>
                     <MaterialCommunityIcons name="plus-box-multiple-outline" size={32} color={colors.primary} />
                     <Text style={[styles.title, { color: colors.primaryDark }]}>New Batch</Text>
                 </View>

                {/* Image Picker Section */}
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Cover Image (Optional)</Text>
                    <TouchableOpacity onPress={pickImage} style={[styles.imagePicker, { backgroundColor: colors.cardBackground, borderColor: colors.inputBorder }]} disabled={isSaving} activeOpacity={0.7}>
                         {isSaving && localImageUri && <View style={styles.imageLoadingOverlay}><ActivityIndicator color={colors.white} /></View>}
                         {localImageUri ? (<Image source={{ uri: localImageUri }} style={styles.imagePreview} resizeMode="cover" />)
                         : (<View style={styles.imagePlaceholder}><MaterialCommunityIcons name="image-plus" size={40} color={colors.gray}/><Text style={[styles.imagePlaceholderText, { color: colors.gray }]}>Add Cover Image</Text></View>)}
                         {!isSaving && (<View style={[styles.imageEditIconContainer, { backgroundColor: colors.primary + 'B3'}]}><MaterialCommunityIcons name="pencil-outline" size={18} color={colors.white}/></View>)}
                    </TouchableOpacity>
                    {localImageUri && !isSaving && (<AppButton title="Remove Image" onPress={removeImage} color="danger" variant="outline" style={styles.removeButton} textStyle={styles.removeButtonText} disabled={isSaving} />)}
                </View>

                {/* Name Input & Suggestions */}
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Microgreen Name/Type *</Text>
                    <View>
                        <TextInput
                            style={[ styles.input, { backgroundColor: colors.inputBackground, borderColor: errors.name ? colors.danger : colors.inputBorder, color: colors.text }]}
                            placeholder="e.g., Radish (start typing for suggestions)" value={name} onChangeText={handleNameChange}
                            placeholderTextColor={colors.gray} editable={!isSaving} autoCapitalize="words"
                            onFocus={() => { if (name.trim().length > 1 && suggestions.length > 0) setShowSuggestions(true); }}
                        />
                        {errors.name && <Text style={[styles.errorText, {color: colors.danger}]}>{errors.name}</Text>}
                        {/* Suggestions List absolutely positioned */}
                        {showSuggestions && suggestions.length > 0 && (
                            <View style={[styles.suggestionsContainer, {top: Platform.OS === 'ios' ? 55 : 60 /* Adjust based on input height */, backgroundColor: colors.cardBackground, borderColor: colors.lightGray}]}>
                                <FlatList data={suggestions} renderItem={renderSuggestionItem} keyExtractor={(item) => item.id.toString()} keyboardShouldPersistTaps="always" style={styles.suggestionList} />
                            </View>
                        )}
                    </View>
                </View>

                {/* Estimated Harvest Days Input */}
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Est. Harvest Days (Optional)</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: errors.estimatedDays ? colors.danger : colors.inputBorder, color: colors.text }]}
                        placeholder="e.g., 10" value={estimatedDays} onChangeText={handleEstimatedDaysChange}
                        keyboardType="numeric" placeholderTextColor={colors.gray} editable={!isSaving} maxLength={3} />
                    {errors.estimatedDays && <Text style={[styles.errorText, {color: colors.danger}]}>{errors.estimatedDays}</Text>}
                </View>

                {/* Date Picker */}
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Sowing Date *</Text>
                    <TouchableOpacity style={[styles.input, styles.dateInputTouchable, { backgroundColor: colors.inputBackground, borderColor: errors.sowDate ? colors.danger : colors.inputBorder }]} onPress={showDatePicker} disabled={isSaving} activeOpacity={0.7}>
                        <MaterialCommunityIcons name="calendar-month-outline" size={22} color={colors.primary} style={styles.dateIcon}/>
                        {/* Ensure date is formatted and wrapped */}
                        <Text style={[styles.dateText, { color: colors.text }]}>{formatDate(sowDate, 'MMMM d, yyyy')}</Text>
                        <MaterialCommunityIcons name="menu-down" size={22} color={colors.gray} />
                    </TouchableOpacity>
                    {errors.sowDate && <Text style={[styles.errorText, {color: colors.danger}]}>{errors.sowDate}</Text>}
                </View>

                {/* Comments Input */}
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Substrate/Notes (Optional)</Text>
                    <TextInput style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]} placeholder="e.g., Coconut coir, weighted..." value={comments} onChangeText={setComments} multiline numberOfLines={4} textAlignVertical="top" placeholderTextColor={colors.gray} editable={!isSaving} />
                </View>

                {/* Add Button */}
                <AppButton title="Add Batch" onPress={handleAddBatch} style={styles.addButton} loading={isSaving} disabled={isSaving} color="primary" />

                {/* Spacer at bottom */}
                <View style={{ height: 100 }} />

            </ScrollView>
       </TouchableWithoutFeedback>

        {/* Date Picker Modal */}
        <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            date={sowDate || new Date()} // Ensure a valid date is always passed
            onConfirm={handleConfirmDate}
            onCancel={hideDatePicker}
            maximumDate={new Date()} // Prevent future dates
            // Theming options for the modal itself might depend on the library version
            // Check documentation for react-native-modal-datetime-picker V18+ for theme props
            // Example for potential future props:
            // buttonTextColorIOS={colors.primary}
            // confirmTextIOS="Confirm"
            // cancelTextIOS="Cancel"
            // customStyles={{ ... }} // Check library docs
        />
    </KeyboardAvoidingView>
  );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
   keyboardAvoidingView: { flex: 1 },
   container: { flex: 1 },
   scrollContent: { flexGrow: 1, padding: SIZES.paddingLarge, },
   titleContainer: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', marginBottom: SIZES.paddingLarge * 1.5, },
   title: { ...FONTS.h1, textAlign: 'center', marginLeft: SIZES.base },
   inputGroup: { marginBottom: SIZES.padding * 1.5, width: '100%', zIndex: 1 }, // Ensure zIndex for suggestions
   label: { ...FONTS.h4, marginBottom: SIZES.base, fontWeight: '600', opacity: 0.9 },
   input: { borderWidth: 1.5, borderRadius: SIZES.radius * 0.8, paddingHorizontal: SIZES.padding, paddingVertical: Platform.OS === 'ios' ? SIZES.padding : SIZES.padding * 0.8, ...FONTS.input, width: '100%', fontSize: 16 }, // Slightly larger font size
   textArea: { height: 100, textAlignVertical: 'top' }, // Slightly shorter text area
   addButton: { marginTop: SIZES.padding * 1.5, width: '100%' },
   dateInputTouchable: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
   dateIcon: { marginRight: SIZES.padding * 0.6, },
   dateText: { ...FONTS.input, flex: 1, fontSize: 16 }, // Match input font size
   imagePicker: { width: 140, height: 140, borderRadius: SIZES.radius, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', marginBottom: SIZES.base, overflow: 'hidden', alignSelf: 'center', position: 'relative', }, // Larger image picker
   imagePreview: { width: '100%', height: '100%', },
   imagePlaceholder: { justifyContent: 'center', alignItems: 'center', opacity: 0.7, },
   imagePlaceholderText: { ...FONTS.body3, marginTop: SIZES.base / 2, textAlign: 'center' },
   imageEditIconContainer: { position: 'absolute', bottom: 6, right: 6, padding: SIZES.base * 0.8, borderRadius: 18, // Make icon bg circular
      elevation: 2, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.2, shadowRadius: 1 },
   imageLoadingOverlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1, borderRadius: SIZES.radius, }, // Match picker rounding
   removeButton: { width: 'auto', marginTop: SIZES.base, alignSelf: 'center', paddingHorizontal: SIZES.padding, }, // Auto width, more padding
   removeButtonText: { fontSize: 13 }, // Smaller remove text
   // Suggestion Styles - Adjusted zIndex and border
   suggestionsContainer: {
       position: 'absolute', left: 0, right: 0, maxHeight: 160, // Increased max height
       borderWidth: 1.5, borderRadius: SIZES.radius * 0.8, zIndex: 10, // High zIndex
       elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 4, // More shadow
   },
   suggestionList: { flexGrow: 0, },
   suggestionItem: { paddingVertical: SIZES.padding * 0.9, paddingHorizontal: SIZES.padding, borderBottomWidth: 1, }, // More padding
   // Error Text Style
   errorText: { ...FONTS.body3, marginTop: SIZES.base * 0.7, marginLeft: SIZES.base * 0.5, fontSize: 12, fontWeight: '500' },
});

export default AddBatchScreen;