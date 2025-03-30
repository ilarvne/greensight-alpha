// screens/CreateProfileScreen.js
import React, { useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, Alert, ScrollView, Image,
    TouchableOpacity, Platform, KeyboardAvoidingView, ActivityIndicator
} from 'react-native';
import { z } from 'zod'; // Import Zod
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import AppButton from '../components/AppButton';
import { FONTS, SIZES } from '../utils/theme';
import { useTheme } from '../contexts/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// --- Zod Validation Schema ---
const profileSchema = z.object({
  username: z.string()
    .trim()
    .min(3, { message: "Username must be at least 3 characters" })
    .max(30, { message: "Username cannot exceed 30 characters" })
    .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores (_)" }),
  // avatarUri is handled separately, not part of this schema validation
});

// --- Helper Function to Upload Avatar (remains the same as previously provided) ---
const uploadAvatar = async (userId, fileUri) => {
    if (!fileUri || !userId) return null;
    console.log("CreateProfileScreen: Attempting avatar upload for user:", userId);
    try {
        const fileExt = fileUri.split('.').pop()?.toLowerCase() ?? 'jpg';
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`; // Path format: {user_id}/{filename.ext}
        const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;
        const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
        const fileData = decode(base64);
        console.log(`CreateProfileScreen: Read file, size: ${fileData.byteLength}, type: ${contentType}`);
        const BUCKET_NAME = 'avatars'; // Ensure bucket exists
        console.log(`CreateProfileScreen: Uploading avatar to bucket '${BUCKET_NAME}' at: ${filePath}`);
        const { data, error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filePath, fileData, { contentType, upsert: false });
        if (uploadError) throw uploadError;
        console.log("CreateProfileScreen: Supabase upload successful:", data);
        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(data.path);
        console.log("CreateProfileScreen: Public URL:", urlData?.publicUrl);
        return urlData?.publicUrl ?? null;
    } catch (error) {
        console.error('CreateProfileScreen: Error during avatar upload process:', error);
        Alert.alert("Upload Error", error?.message ? `Failed to upload: ${error.message}` : "Failed to upload profile picture.");
        return null;
    }
};


// --- Create Profile Screen Component ---
const CreateProfileScreen = () => {
    const { user, refreshUserProfileCheck } = useAuth();
    const { colors } = useTheme();
    const [username, setUsername] = useState('');
    const [avatarUri, setAvatarUri] = useState(null); // Local temporary URI
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({}); // State for validation errors

    // --- Image Picker Function (remains the same) ---
    const pickImage = async () => {
        if (loading) return;
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') { Alert.alert('Permission Required','Camera roll access is needed.'); return; }
        try {
            let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.7 });
            if (!result.canceled && result.assets?.length > 0) { setAvatarUri(result.assets[0].uri); }
        } catch(e){ console.error("Image Picker Error:", e); Alert.alert("Error", "Could not select image."); }
    };

    // --- Form Submission Handler (UPDATED with Validation) ---
    const handleCompleteProfile = async () => {
        if (!user) { Alert.alert("Error", "User session not found."); return; }
        setErrors({}); // Clear previous errors

        // Validate username
        const validationResult = profileSchema.safeParse({ username: username });

        if (!validationResult.success) {
            const formattedErrors = {};
            validationResult.error.errors.forEach(err => {
                if (err.path.length > 0) { formattedErrors[err.path[0]] = err.message; }
            });
            setErrors(formattedErrors);
            console.log("Profile Validation errors:", formattedErrors);
            Alert.alert("Validation Failed", "Please check the errors below.");
            return; // Stop submission
        }

        // --- Validation passed ---
        const validatedData = validationResult.data; // Use validated username
        setLoading(true);
        let avatarPublicUrl = null;

        try {
            // 1. Upload Avatar if selected
            if (avatarUri) {
                avatarPublicUrl = await uploadAvatar(user.id, avatarUri);
            }

            // 2. Prepare data for update
            const updates = {
                username: validatedData.username, // Use validated username
                avatar_url: avatarPublicUrl,
                updated_at: new Date().toISOString(),
            };
            console.log(`CreateProfileScreen: Attempting to update profile for user ${user.id} with:`, { username: updates.username, avatar_url: !!updates.avatar_url });

            // 3. Update the profile row
            const { error } = await supabase
                .from('profiles')
                .update(updates)
                .eq('id', user.id);

            // 4. Handle potential errors
            if (error) {
                 if (error.code === '23505' && error.message.includes('profiles_username_key')) { // Check for unique constraint violation on username
                     setErrors({ username: "Username already taken. Please choose another." });
                     Alert.alert("Username Taken", "This username is already in use.");
                 } else if (error.code === '42501' || error.message.includes('security policy')) {
                     console.error("CreateProfileScreen: RLS Violation details:", error);
                     Alert.alert("Permission Denied", "Could not update profile due to security rules.");
                 } else {
                      throw error; // Re-throw other errors
                 }
            } else {
                // 5. Success - refresh profile in AuthContext
                console.log("CreateProfileScreen: Profile updated successfully.");
                Alert.alert("Profile Saved!", "Your profile is now set up.");
                await refreshUserProfileCheck(); // Trigger context update and navigation
            }
        } catch (error) {
            console.error("CreateProfileScreen: Error completing profile:", error);
            if (!errors.username) { // Avoid overwriting specific username error if already set
                Alert.alert("Error", `Failed to save profile: ${error.message || "An unknown error occurred."}`);
            }
        } finally {
            setLoading(false);
        }
    };

    // --- Component Render (UPDATED with Error Display) ---
    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={[styles.keyboardAvoidingView, { backgroundColor: colors.background }]}>
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                <Text style={[styles.title, { color: colors.primaryDark }]}>Complete Your Profile</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Choose a unique username and optional profile picture.
                </Text>

                 {/* Avatar Picker */}
                 <TouchableOpacity onPress={pickImage} style={styles.avatarPicker} disabled={loading}>
                     {loading && <View style={styles.avatarLoadingOverlay}><ActivityIndicator color={colors.white} /></View>}
                     {avatarUri ? (
                         <Image source={{ uri: avatarUri }} style={[styles.avatarImage, { borderColor: colors.primaryLight }]} />
                     ) : (
                         <View style={[styles.avatarPlaceholder, { backgroundColor: colors.lightGray + '80', borderColor: colors.gray }]}>
                              <MaterialCommunityIcons name="camera-plus-outline" size={50} color={colors.gray}/>
                         </View>
                     )}
                      <View style={[styles.avatarEditIconContainer, { backgroundColor: colors.primary + 'B3'}]}>
                          <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.white}/>
                      </View>
                 </TouchableOpacity>

                {/* Username Input */}
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>Username *</Text>
                    <TextInput
                        style={[
                            styles.input,
                            { backgroundColor: colors.inputBackground, borderColor: errors.username ? colors.danger : colors.inputBorder, color: colors.text } // Highlight error border
                        ]}
                        placeholder="Letters, numbers, underscores only (3-30 chars)" // Updated placeholder
                        value={username}
                        onChangeText={(text) => { setUsername(text); setErrors(prev => ({ ...prev, username: undefined })); }} // Clear error on change
                        autoCapitalize="none"
                        autoCorrect={false}
                        placeholderTextColor={colors.gray}
                        editable={!loading}
                        maxLength={30} // Match schema max length
                    />
                    {/* Display username error */}
                    {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
                </View>

                {/* Save Button */}
                <AppButton
                    title="Save Profile & Continue"
                    onPress={handleCompleteProfile}
                    loading={loading}
                    // Basic client-side disable check (Zod handles main check on press)
                    disabled={loading || !username.trim() || username.trim().length < 3}
                    style={styles.saveButton}
                    color="primary"
                />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

// --- Stylesheet (Add errorText style if not already present) ---
const styles = StyleSheet.create({
    keyboardAvoidingView: { flex: 1 },
    container: { flex: 1 },
    scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: SIZES.paddingLarge, paddingTop: SIZES.paddingLarge * 1.5, paddingBottom: SIZES.paddingLarge * 2 },
    title: { ...FONTS.h1, textAlign: 'center', marginBottom: SIZES.base },
    subtitle: { ...FONTS.body1, textAlign: 'center', marginBottom: SIZES.paddingLarge * 1.5, opacity: 0.9 },
    avatarPicker: { width: 120, height: 120, borderRadius: 60, marginBottom: SIZES.paddingLarge * 1.5, position: 'relative', justifyContent: 'center', alignItems: 'center', },
    avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 60, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderStyle: 'dashed', },
    avatarImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, },
    avatarEditIconContainer: { position: 'absolute', bottom: 0, right: 0, padding: SIZES.base, borderRadius: 15, },
    avatarLoadingOverlay: { position: 'absolute', width: '100%', height: '100%', borderRadius: 60, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 1, },
    inputGroup: { width: '100%', marginBottom: SIZES.padding * 1.5 },
    label: { ...FONTS.h4, marginBottom: SIZES.base, fontWeight: '600' },
    input: { borderWidth: 1.5, borderRadius: SIZES.radius, paddingHorizontal: SIZES.padding, paddingVertical: Platform.OS === 'ios' ? SIZES.padding : SIZES.padding * 0.8, ...FONTS.input, width: '100%', },
    saveButton: { width: '100%', marginTop: SIZES.padding },
    errorText: {
       ...FONTS.body3,
       color: 'red', // Or use colors.danger from theme
       marginTop: SIZES.base * 0.5,
       marginLeft: SIZES.base * 0.5,
       fontSize: 12,
    },
});

export default CreateProfileScreen;