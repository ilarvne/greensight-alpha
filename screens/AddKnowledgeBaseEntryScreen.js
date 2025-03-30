// screens/AddKnowledgeBaseEntryScreen.js
import React, { useState, useCallback } from 'react';
import {
    View, Text, TextInput, StyleSheet, ScrollView, Platform,
    KeyboardAvoidingView, Alert, TouchableOpacity, Image, ActivityIndicator, Keyboard,
    TouchableWithoutFeedback
} from 'react-native';
import { z } from 'zod'; // Import Zod
import { useAppContext } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import AppButton from '../components/AppButton';
import { useTheme } from '../contexts/ThemeContext';
import { FONTS, SIZES } from '../utils/theme';
import { formatDate } from '../utils/helpers'; // Although not used here, keep for consistency if needed later
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

// --- Zod Validation Schema ---
// Added min_harvest_days and max_harvest_days
const kbEntrySchema = z.object({
  name: z.string().trim().min(3, { message: "Name must be at least 3 characters" }),
  description: z.string().trim().min(10, { message: "Description requires at least 10 characters" }),
  difficulty: z.enum(['Easy', 'Medium', 'Hard'], { required_error: "Please select a difficulty" }),
  // --- New Harvest Day Fields ---
  min_harvest_days: z.string()
      .transform(val => val.trim() === '' ? null : parseInt(val.replace(/[^0-9]/g, ''), 10)) // Allow only numbers, empty -> null
      .nullable()
      .refine(val => val === null || (Number.isInteger(val) && val > 0), { message: "Min days must be a positive whole number if entered" }),
  max_harvest_days: z.string()
      .transform(val => val.trim() === '' ? null : parseInt(val.replace(/[^0-9]/g, ''), 10)) // Allow only numbers, empty -> null
      .nullable()
      .refine(val => val === null || (Number.isInteger(val) && val > 0), { message: "Max days must be a positive whole number if entered" }),
  // --- Optional String Fields ---
  germination_time: z.string().trim().optional(),
  ideal_temp: z.string().trim().optional(),
  lighting: z.string().trim().optional(),
  watering: z.string().trim().optional(),
  harvest: z.string().trim().optional(), // General harvest info string
  tips: z.string().trim().optional(),
  common_problems: z.string().trim().optional(),
  nutritional_info: z.string().trim().optional(),
  taste_profile: z.string().trim().optional(),
  type: z.string().trim().optional(),
  icon_name: z.string().trim().optional(),
})
// Add schema-level refinement to check max >= min if both provided
.refine(data => {
    if (data.min_harvest_days !== null && data.max_harvest_days !== null) {
        return data.max_harvest_days >= data.min_harvest_days;
    }
    return true; // Pass if one or both are null
}, {
    message: "Max harvest days must be greater than or equal to min days",
    path: ["max_harvest_days"], // Assign error to max_harvest_days field
});


// Difficulty Options
const DIFFICULTY_OPTIONS = ['Easy', 'Medium', 'Hard'];

// --- Add Knowledge Base Entry Screen Component ---
const AddKnowledgeBaseEntryScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { addKnowledgeBaseEntry } = useAppContext();

  // --- State ---
  const [formData, setFormData] = useState({
      name: '', description: '', difficulty: null,
      min_harvest_days: '', max_harvest_days: '', // Add new state fields (as strings for input)
      germination_time: '', ideal_temp: '', lighting: '', watering: '',
      harvest: '', tips: '', common_problems: '', nutritional_info: '',
      taste_profile: '', type: '', icon_name: ''
  });
  const [localImageUri, setLocalImageUri] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // --- Input Handlers ---
  const handleInputChange = useCallback((fieldName, value) => {
      // For numeric fields, only allow digits
      if (fieldName === 'min_harvest_days' || fieldName === 'max_harvest_days') {
          value = value.replace(/[^0-9]/g, ''); // Remove non-digits
      }
      setFormData(prev => ({ ...prev, [fieldName]: value }));
      if (errors[fieldName]) { setErrors(prev => ({ ...prev, [fieldName]: undefined })); }
      // Clear max_harvest_days error if min changes (due to refine dependency)
      if (fieldName === 'min_harvest_days' && errors.max_harvest_days) {
           setErrors(prev => ({ ...prev, max_harvest_days: undefined }));
      }
  }, [errors]);

  const handleDifficultySelect = (level) => { /* ... (no change) ... */ };

  // --- Image Picker ---
  const pickImage = async () => { /* ... (no change) ... */ };
  const removeImage = () => setLocalImageUri(null);

  // --- Form Submission ---
  const handleSaveEntry = async () => {
    if (typeof addKnowledgeBaseEntry !== 'function') { Alert.alert("Error", "Cannot save entry."); return; }
    if (!user) { Alert.alert("Error", "User not found."); return; }
    Keyboard.dismiss();
    setErrors({});

    // Pass current formData to validation
    const validationResult = kbEntrySchema.safeParse(formData);

    if (!validationResult.success) {
        const formattedErrors = {};
        validationResult.error.errors.forEach(err => { if (err.path.length > 0) { formattedErrors[err.path[0]] = err.message; }});
        setErrors(formattedErrors);
        console.log("KB Validation errors:", formattedErrors);
        Alert.alert("Validation Failed", "Please check required fields (*) and formats."); return;
    }

    const validatedData = validationResult.data; // Contains parsed numbers or null for harvest days
    setIsSaving(true);

    try {
        // Prepare data for context, including local URI and validated numeric fields
        const dataForContext = {
            ...validatedData,
            // These are now numbers or null from Zod transform:
            min_harvest_days: validatedData.min_harvest_days,
            max_harvest_days: validatedData.max_harvest_days,
            // Convert other fields if needed (example: tips to array)
            tips: validatedData.tips ? validatedData.tips.split('\n').map(t=>t.trim()).filter(t=>t) : null,
            common_problems: validatedData.common_problems ? validatedData.common_problems.split('\n').map(t=>t.trim()).filter(t=>t) : null,
            // Ensure other optional fields are null if empty string, based on DB preference
            germination_time: validatedData.germination_time || null,
            ideal_temp: validatedData.ideal_temp || null,
            lighting: validatedData.lighting || null,
            watering: validatedData.watering || null,
            harvest: validatedData.harvest || null,
            nutritional_info: validatedData.nutritional_info || null,
            taste_profile: validatedData.taste_profile || null,
            type: validatedData.type || null,
            icon_name: validatedData.icon_name || null,
            // Pass local URI
            localImageUri: localImageUri
        };
        // Remove localImageUri before sending if context doesn't expect it inside the main object
        // delete dataForContext.localImageUri; // Adjust based on how addKnowledgeBaseEntry is defined

        const success = await addKnowledgeBaseEntry(dataForContext); // Pass data to context

        if (success) { Alert.alert("Success", `${validatedData.name} added.`); navigation.goBack(); }
        else { console.log("AddKnowledgeBaseEntryScreen: addKnowledgeBaseEntry call failed."); }

    } catch (error) { console.error("Error saving KB entry:", error); Alert.alert('Save Error', `An unexpected error occurred: ${error.message}`); }
    finally { setIsSaving(false); }
  };

  // --- Render Input Row Helper ---
  // Added numberOfLines prop
  const renderInput = (field, placeholder, multiline = false, keyboardType = 'default', isRequired = false, numberOfLines = 1) => (
      <View style={styles.inputGroup} key={field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
              {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              {isRequired ? ' *' : ''}
          </Text>
          <TextInput
              style={[ styles.input, multiline ? styles.textArea : {}, { backgroundColor: colors.inputBackground, borderColor: errors[field] ? colors.danger : colors.inputBorder, color: colors.text } ]}
              placeholder={placeholder} value={formData[field]} onChangeText={(value) => handleInputChange(field, value)}
              placeholderTextColor={colors.gray} editable={!isSaving} multiline={multiline}
              numberOfLines={multiline ? numberOfLines : 1} keyboardType={keyboardType}
              autoCapitalize={multiline || ['name', 'type', 'taste_profile'].includes(field) ? 'sentences' : 'none'}
          />
          {errors[field] && <Text style={[styles.errorText, {color: colors.danger}]}>{errors[field]}</Text>}
      </View>
  );

  // --- Component Render ---
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.keyboardAvoidingView, { backgroundColor: colors.background }]}>
       <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <View style={styles.titleContainer}>
                     <MaterialCommunityIcons name="notebook-plus-outline" size={32} color={colors.primary} />
                     <Text style={[styles.title, { color: colors.primaryDark }]}>Add Knowledge</Text>
                 </View>

                {/* Image Picker */}
                <View style={styles.inputGroup}>
                     <Text style={[styles.label, { color: colors.textSecondary }]}>Image (Optional)</Text>
                     <TouchableOpacity onPress={pickImage} style={[styles.imagePicker, { backgroundColor: colors.cardBackground, borderColor: colors.inputBorder }]} disabled={isSaving} activeOpacity={0.7}>
                          {isSaving && localImageUri && <View style={styles.imageLoadingOverlay}><ActivityIndicator color={colors.white} /></View>}
                         {localImageUri ? (<Image source={{ uri: localImageUri }} style={styles.imagePreview} resizeMode="cover" />)
                         : (<View style={styles.imagePlaceholder}><MaterialCommunityIcons name="image-plus" size={40} color={colors.gray}/><Text style={[styles.imagePlaceholderText, { color: colors.gray }]}>Add Image</Text></View>)}
                         {!isSaving && (<View style={[styles.imageEditIconContainer, { backgroundColor: colors.primary + 'B3'}]}><MaterialCommunityIcons name={localImageUri ? "pencil-outline" : "plus"} size={18} color={colors.white}/></View>)}
                     </TouchableOpacity>
                     {localImageUri && !isSaving && (<AppButton title="Remove Image" onPress={removeImage} color="danger" variant="outline" style={styles.removeButton} textStyle={styles.removeButtonText} disabled={isSaving} />)}
                </View>

                {/* Required Fields */}
                {renderInput('name', 'e.g., Sunflower', false, 'default', true)}
                {renderInput('description', 'General description...', true, 'default', true, 3)}

                {/* Difficulty Selection */}
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Difficulty *</Text>
                    <View style={styles.difficultyContainer}>
                        {DIFFICULTY_OPTIONS.map(level => (
                            <TouchableOpacity key={level} style={[ styles.difficultyButton, { backgroundColor: formData.difficulty === level ? colors.primaryLight : colors.inputBackground, borderColor: formData.difficulty === level ? colors.primaryDark : errors.difficulty ? colors.danger : colors.inputBorder} ]} onPress={() => handleDifficultySelect(level)} disabled={isSaving} >
                                <Text style={[styles.difficultyText, {color: formData.difficulty === level ? colors.primaryDark : colors.textSecondary}]}>{level}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                     {errors.difficulty && <Text style={[styles.errorText, {color: colors.danger}]}>{errors.difficulty}</Text>}
                </View>

                {/* Harvest Days (Min/Max) */}
                 <View style={styles.rowInputGroup}>
                    <View style={styles.rowItem}>
                         {renderInput('min_harvest_days', 'e.g., 7', false, 'numeric', false)}
                     </View>
                     <View style={styles.rowItem}>
                         {renderInput('max_harvest_days', 'e.g., 14', false, 'numeric', false)}
                     </View>
                 </View>

                {/* Other Optional Fields */}
                {renderInput('type', 'e.g., Leafy, Brassica', false)}
                {renderInput('taste_profile', 'e.g., Nutty, Spicy', false)}
                {renderInput('germination_time', 'e.g., 2-4 days', false, 'default')}
                {renderInput('ideal_temp', 'e.g., 18-22°C', false, 'default')}
                {renderInput('lighting', 'e.g., Bright indirect', true, 'default', false, 2)}
                {renderInput('watering', 'e.g., Keep moist', true, 'default', false, 2)}
                {renderInput('harvest', 'e.g., 7-14 days, at first true leaf', true, 'default', false, 2)}
                {renderInput('tips', 'Tip 1 (new line) Tip 2...', true, 'default', false, 4)}
                {renderInput('common_problems', 'Problem 1 (new line) Problem 2...', true, 'default', false, 3)}
                {renderInput('nutritional_info', 'e.g., High in Vitamin K, C', true, 'default', false, 2)}
                {renderInput('icon_name', 'MCI Icon: e.g., leaf-maple', false, 'default')}


                {/* Save Button */}
                <AppButton title="Save Knowledge Base Entry" onPress={handleSaveEntry} style={styles.saveButton} loading={isSaving} disabled={isSaving} color="primary" />

                <View style={{ height: 150 }} />
            </ScrollView>
       </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
   keyboardAvoidingView: { flex: 1 },
   container: { flex: 1 },
   scrollContent: { flexGrow: 1, padding: SIZES.paddingLarge },
   titleContainer: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', marginBottom: SIZES.paddingLarge * 1.5, },
   title: { ...FONTS.h1, textAlign: 'center', marginLeft: SIZES.base },
   inputGroup: { marginBottom: SIZES.padding * 1.5, width: '100%', },
   rowInputGroup: { // Style for side-by-side inputs
       flexDirection: 'row',
       justifyContent: 'space-between',
       marginBottom: SIZES.padding * 1.5,
       gap: SIZES.padding, // Add gap between row items
   },
   rowItem: {
       flex: 1, // Each item takes half the space minus gap
   },
   label: { ...FONTS.h4, marginBottom: SIZES.base * 0.8, fontWeight: '600', opacity: 0.9 },
   input: { borderWidth: 1.5, borderRadius: SIZES.radius * 0.8, paddingHorizontal: SIZES.padding, paddingVertical: Platform.OS === 'ios' ? SIZES.padding : SIZES.padding * 0.8, ...FONTS.input, width: '100%', fontSize: 15 },
   textArea: { minHeight: 80, textAlignVertical: 'top', paddingVertical: SIZES.padding * 0.8 },
   saveButton: { marginTop: SIZES.padding * 2, width: '100%' },
   imagePicker: { width: 160, height: 120, borderRadius: SIZES.radius, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', marginBottom: SIZES.base, overflow: 'hidden', alignSelf: 'center', position: 'relative', },
   imagePreview: { width: '100%', height: '100%', },
   imagePlaceholder: { justifyContent: 'center', alignItems: 'center', opacity: 0.7, },
   imagePlaceholderText: { ...FONTS.body3, marginTop: SIZES.base / 2, textAlign: 'center' },
   imageEditIconContainer: { position: 'absolute', bottom: 6, right: 6, padding: SIZES.base * 0.8, borderRadius: 18, },
   imageLoadingOverlay: { position: 'absolute', width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1, borderRadius: SIZES.radius, },
   removeButton: { width: 'auto', marginTop: SIZES.base, alignSelf: 'center', paddingHorizontal: SIZES.padding, },
   removeButtonText: { fontSize: 13 },
   // Difficulty Styles
   difficultyContainer: { flexDirection: 'row', justifyContent: 'space-around', gap: SIZES.base },
   difficultyButton: { flex: 1, paddingVertical: SIZES.padding * 0.8, borderRadius: SIZES.radius * 0.8, borderWidth: 1.5, alignItems: 'center', },
   difficultyText: { ...FONTS.body1, fontWeight: '600' },
   // Error Text Style
   errorText: { ...FONTS.body3, color: 'red', // Default, color applied inline
       marginTop: SIZES.base * 0.7, marginLeft: SIZES.base * 0.5, fontSize: 12, fontWeight: '500' },
});

export default AddKnowledgeBaseEntryScreen;