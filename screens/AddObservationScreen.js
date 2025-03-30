// screens/AddObservationScreen.js
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    ScrollView,
    Image,
    Alert,
    Platform,
    KeyboardAvoidingView,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import { z } from 'zod'; // Import Zod
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../contexts/AppContext';
import AppButton from '../components/AppButton';
import { useTheme } from '../contexts/ThemeContext';
import { FONTS, SIZES } from '../utils/theme';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

// Define available tags
const EVENT_TAGS = [
    { id: 'watered', label: 'Watered', icon: 'water-outline' },
    { id: 'fertilized', label: 'Fertilized', icon: 'bottle-tonic-outline' },
    { id: 'pest_issue', label: 'Pest/Issue', icon: 'bug-outline' },
    { id: 'harvested', label: 'Harvested', icon: 'content-cut' },
    { id: 'relocated', label: 'Relocated', icon: 'location-enter' },
];

// Temporary variable to hold photoUri for the refine check (global to the module scope)
let observationDataForValidation = { photoUri: null };

// --- Zod Validation Schema ---
const observationSchema = z.object({
    notes: z.string().trim().optional(),
    phenology_stage: z.string().trim().optional(),
    height: z.string()
        .transform((val) => val.trim().replace(',', '.'))
        .transform((val) => val === '' ? null : parseFloat(val))
        .nullable()
        .refine((val) => val === null || (!isNaN(val) && val >= 0), {
            message: "Height must be a non-negative number (e.g., 0, 2.5)",
        }),
    tags: z.array(z.string()).optional(),
}).refine(data => {
    // Check against the module-level variable + other fields
    return !!data.notes || data.height !== null || !!data.phenology_stage || (data.tags && data.tags.length > 0) || !!observationDataForValidation.photoUri;
}, {
    message: "Please add notes, height, stage, tags, or a photo.",
});


const AddObservationScreen = ({ route, navigation }) => {
  const { batchId } = route.params;
  const { colors } = useTheme(); // Get theme colors HERE
  const { addObservation } = useAppContext();

  // --- State Variables ---
  const [notes, setNotes] = useState('');
  const [height, setHeight] = useState('');
  const [phenologyStage, setPhenologyStage] = useState('');
  const [photoUri, setPhotoUri] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // --- Image Picker Logic ---
  const pickImage = async () => {
    if (isSaving) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'Camera roll access is needed.'); return; }
    try {
        let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.7 });
        if (!result.canceled && result.assets?.length > 0) {
          const uri = result.assets[0].uri;
          setPhotoUri(uri);
          observationDataForValidation.photoUri = uri; // Update for refine check
          setErrors(prev => ({ ...prev, form: undefined }));
        }
    } catch (error) { console.error("Image Picker Error:", error); Alert.alert("Image Error", "Could not select image."); }
  };

  const removePhoto = () => {
      setPhotoUri(null);
      observationDataForValidation.photoUri = null; // Update for refine check
      // Optionally clear general error if photo was the only thing entered
      // setErrors(prev => ({ ...prev, form: undefined }));
  }

  // --- Tag Selection Logic ---
  const toggleTag = (tagId) => {
      if (isSaving) return;
      setSelectedTags(prevTags => {
          const newTags = prevTags.includes(tagId) ? prevTags.filter(t => t !== tagId) : [...prevTags, tagId];
          setErrors(prev => ({ ...prev, form: undefined }));
          return newTags;
      });
  };

  // --- Save Observation Handler ---
  const handleAddObservation = async () => {
    setErrors({});
    observationDataForValidation.photoUri = photoUri;

    const dataToValidate = { notes, height, phenology_stage: phenologyStage, tags: selectedTags };
    const validationResult = observationSchema.safeParse(dataToValidate);

    if (!validationResult.success) {
        const formattedErrors = {}; let generalErrorMessage = "Please check the errors below.";
        validationResult.error.errors.forEach(err => {
            if (err.path.length > 0) { formattedErrors[err.path[0]] = err.message; }
            else { formattedErrors['form'] = err.message; generalErrorMessage = err.message; }
        });
        setErrors(formattedErrors); console.log("Observation Validation errors:", formattedErrors);
        Alert.alert("Validation Failed", generalErrorMessage); return;
    }

    const validatedData = validationResult.data;
    setIsSaving(true);
    const observationDataForContext = {
      notes: validatedData.notes ?? '', height: validatedData.height,
      phenology_stage: validatedData.phenology_stage ?? '', tags: validatedData.tags ?? [],
      photoUri: photoUri,
    };

    try {
        const success = await addObservation(batchId, observationDataForContext);
        if (success !== null) { navigation.goBack(); }
        else { console.log("AddObservationScreen: addObservation call did not indicate success."); }
    } catch (error) { console.error("Error saving observation:", error); Alert.alert('Save Error', `An unexpected error occurred: ${error.message}`); }
    finally { setIsSaving(false); }
  };

  // --- Component Render ---
  return (
     <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.keyboardAvoidingView, { backgroundColor: colors.background }]}>
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={[styles.title, { color: colors.primaryDark }]}>Log Observation</Text>

            {/* Phenology Stage Input */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Phenology Stage / Status</Text>
                <TextInput
                     style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                     placeholder="e.g., Germination, True Leaves" value={phenologyStage}
                     onChangeText={(text) => { setPhenologyStage(text); setErrors(prev => ({ ...prev, form: undefined })); }}
                     placeholderTextColor={colors.gray} editable={!isSaving} autoCapitalize="sentences"/>
            </View>

            {/* Notes Input */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Notes / Visual Changes</Text>
                <TextInput
                    style={[styles.input, styles.textArea, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder, color: colors.text }]}
                    placeholder="Describe what you see..." value={notes}
                    onChangeText={(text) => { setNotes(text); setErrors(prev => ({ ...prev, form: undefined })); }}
                    multiline numberOfLines={4} textAlignVertical="top" placeholderTextColor={colors.gray} editable={!isSaving}/>
            </View>

            {/* Height Input */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Sprout Height (cm)</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: errors.height ? colors.danger : colors.inputBorder, color: colors.text }]}
                    placeholder="Optional (e.g., 3.5 or 3,5)" value={height}
                    onChangeText={(text) => { setHeight(text); setErrors(prev => ({ ...prev, height: undefined, form: undefined })); }}
                    keyboardType="numeric" placeholderTextColor={colors.gray} editable={!isSaving}/>
                {/* Apply error color inline */}
                {errors.height && <Text style={[styles.errorText, {color: colors.danger}]}>{errors.height}</Text>}
            </View>

            {/* Photo Input */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Photo (Optional)</Text>
                 <TouchableOpacity onPress={pickImage} disabled={isSaving} style={[styles.imagePicker, { backgroundColor: colors.cardBackground + '80', borderColor: colors.inputBorder }]} activeOpacity={0.7}>
                    {photoUri ? ( <Image source={{ uri: photoUri }} style={styles.imagePreview} resizeMode="cover" /> )
                    : ( <View style={styles.imagePlaceholder}><MaterialCommunityIcons name="camera-plus-outline" size={40} color={colors.gray}/><Text style={[styles.imagePlaceholderText, { color: colors.gray }]}>Tap to add photo</Text></View> )}
                 </TouchableOpacity>
                 {photoUri && ( <AppButton title="Remove Photo" onPress={removePhoto} color="danger" variant="outline" style={styles.removeButton} disabled={isSaving} /> )}
            </View>

            {/* Event Tags Section */}
            <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Event Tags (Optional)</Text>
                <View style={styles.tagsContainer}>
                    {EVENT_TAGS.map(tag => {
                        const isSelected = selectedTags.includes(tag.id);
                        return (
                            <TouchableOpacity key={tag.id} style={[ styles.tagButton, { backgroundColor: isSelected ? colors.primaryLight : colors.inputBackground, borderColor: isSelected ? colors.primary : colors.inputBorder } ]} onPress={() => toggleTag(tag.id)} disabled={isSaving} activeOpacity={0.7}>
                                <MaterialCommunityIcons name={tag.icon} size={16} color={isSelected ? colors.primaryDark : colors.textSecondary} style={styles.tagIcon} />
                                <Text style={[styles.tagText, { color: isSelected ? colors.primaryDark : colors.textSecondary }]}> {tag.label} </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

             {/* Display general form error - Apply color inline */}
             {errors.form && <Text style={[styles.errorText, styles.formError, {color: colors.danger}]}>{errors.form}</Text>}

            {/* Save Button */}
            <AppButton title="Save Observation" onPress={handleAddObservation} loading={isSaving} disabled={isSaving} style={styles.saveButton} color="secondary"/>
        </ScrollView>
     </KeyboardAvoidingView>
  );
};

// --- Stylesheet ---
// Define styles WITHOUT theme colors directly where possible
const styles = StyleSheet.create({
   keyboardAvoidingView: { flex: 1 },
   container: { flex: 1 },
   scrollContent: { flexGrow: 1, padding: SIZES.paddingLarge },
   title: { ...FONTS.h1, marginBottom: SIZES.paddingLarge * 1.5, textAlign: 'center' },
   inputGroup: { marginBottom: SIZES.padding * 1.3, width: '100%' },
   label: { ...FONTS.h4, marginBottom: SIZES.base * 1.2, fontWeight: '600', },
   input: { borderWidth: 1.5, borderRadius: SIZES.radius, paddingHorizontal: SIZES.padding, paddingVertical: Platform.OS === 'ios' ? SIZES.padding : SIZES.padding * 0.8, ...FONTS.input, width: '100%', },
   textArea: { height: 110, textAlignVertical: 'top' },
   imagePicker: { width: '100%', height: 180, borderRadius: SIZES.radius, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderStyle: 'dashed', marginBottom: SIZES.base, overflow: 'hidden', },
   imagePreview: { width: '100%', height: '100%' },
   imagePlaceholder: { justifyContent: 'center', alignItems: 'center', opacity: 0.7, },
   imagePlaceholderText: { ...FONTS.body2, marginTop: SIZES.base },
   removeButton: { width: '100%', marginTop: SIZES.base, },
   saveButton: { marginTop: SIZES.padding * 1.5, width: '100%' },
   tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: SIZES.base, },
   tagButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: SIZES.radius * 1.5, paddingVertical: SIZES.base * 0.8, paddingHorizontal: SIZES.padding * 0.8, },
   tagIcon: { marginRight: SIZES.base * 0.6, opacity: 0.9, },
   tagText: { ...FONTS.body3, fontSize: 12, fontWeight: '600', },
   // Error text style - *REMOVED COLOR HERE*
   errorText: {
       ...FONTS.body3,
       marginTop: SIZES.base * 0.5,
       marginLeft: SIZES.base * 0.5,
       fontSize: 12,
   },
   formError: { // Style for the general form error
        textAlign: 'center',
        marginLeft: 0,
        marginTop: SIZES.padding,
        fontWeight: 'bold',
    },
});

export default AddObservationScreen;