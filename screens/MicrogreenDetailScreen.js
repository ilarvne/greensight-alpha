// screens/MicrogreenDetailScreen.js
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform, Image, ActivityIndicator } from 'react-native'; // Added Image, ActivityIndicator
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FONTS, SIZES } from '../utils/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useAppContext } from '../contexts/AppContext'; // Import App Context
import AppButton from '../components/AppButton'; // Import AppButton

// Helper component for displaying sections (remains the same)
const InfoSection = ({ title, content, iconName, colors }) => {
    if (!content && !Array.isArray(content)) return null; // Hide section if content is empty/null (unless it's an array like tips)
    if (Array.isArray(content) && content.length === 0) return null; // Hide section if tips array is empty

    return (
        <View style={[styles.sectionContainer, { backgroundColor: colors.cardBackground, borderColor: colors.lightGray }]}>
            <View style={styles.sectionHeader}>
                {iconName && <MaterialCommunityIcons name={iconName} size={20} color={colors.primary} style={styles.sectionIcon} />}
                <Text style={[styles.sectionTitle, { color: colors.primaryDark }]}>{title}</Text>
            </View>
            {Array.isArray(content) ? (
                content.map((item, index) => (
                    <View key={index} style={styles.listItem}>
                        <Text style={[styles.bulletPoint, { color: colors.primary }]}>•</Text>
                        <Text style={[styles.sectionContent, { color: colors.text }]}>{item}</Text>
                    </View>
                ))
            ) : (
                <Text style={[styles.sectionContent, { color: colors.text }]}>{content}</Text>
            )}
        </View>
    );
};


const MicrogreenDetailScreen = ({ route, navigation }) => {
  const { kbEntryId } = route.params; // <-- Get ID from navigation params
  const { colors } = useTheme();
  const { knowledgeBaseEntries, isLoadingData } = useAppContext(); // <-- Get entries from context

  // Find the specific entry using the ID
  const entry = useMemo(() => {
      if (!knowledgeBaseEntries || !kbEntryId) return null;
      return knowledgeBaseEntries.find(e => e.id === kbEntryId);
  }, [knowledgeBaseEntries, kbEntryId]);

  // Handle loading state or if entry not found
  if (isLoadingData && !entry) {
       return ( <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}><ActivityIndicator size="large" color={colors.primary} /></View> );
  }

  if (!entry) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={60} color={colors.danger} />
        <Text style={[styles.errorText, { color: colors.danger }]}>Entry Not Found</Text>
        <Text style={[styles.errorText, { color: colors.textSecondary, marginTop: SIZES.base }]}>Could not load details for ID: {kbEntryId}</Text>
        <AppButton title="Go Back" onPress={() => navigation.goBack()} color="secondary" style={{marginTop: SIZES.paddingLarge}}/>
      </View>
    );
  }

  // Determine difficulty badge colors (remains the same)
  const getDifficultyColors = () => {
      const difficulty = entry.difficulty || 'Medium';
      switch (difficulty.toLowerCase()) {
          case 'easy': return { bg: colors.primaryLight + 'B3', text: colors.primaryDark };
          case 'medium': return { bg: colors.secondary + '30', text: colors.secondary };
          case 'hard': return { bg: colors.danger + '30', text: colors.danger };
          default: return { bg: colors.gray + '30', text: colors.textSecondary };
      }
  };
  const difficultyColors = getDifficultyColors();

  const hasImage = entry.image_url && typeof entry.image_url === 'string' && entry.image_url.trim() !== '';

  // --- Navigate to Add Batch Screen ---
  const handleStartGrowing = () => {
      navigation.navigate('AddBatchModal', {
          // Pass the name to pre-fill the AddBatchScreen input
          prefillName: entry.name
      });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.scrollContent}>
      {/* --- Image Header --- */}
      {hasImage && (
          <Image source={{ uri: entry.image_url }} style={[styles.headerImage, {backgroundColor: colors.lightGray}]} resizeMode="cover" />
      )}

      {/* --- Title and Difficulty --- */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.primaryDark }]}>{entry.name}</Text>
         <View style={[styles.difficultyBadge, {backgroundColor: difficultyColors.bg}]}>
            <Text style={[styles.difficultyText, {color: difficultyColors.text}]}>
                 {entry.difficulty || 'N/A'}
             </Text>
         </View>
      </View>

      {/* --- Description --- */}
      <Text style={[styles.description, { color: colors.textSecondary }]}>
          {entry.description}
      </Text>

      {/* --- Info Sections --- */}
      {/* Pass colors down to helper component */}
      <InfoSection title="Taste Profile" content={entry.taste_profile} iconName="food-apple-outline" colors={colors} />
      <InfoSection title="Category" content={entry.type} iconName="tag-outline" colors={colors} />
      <InfoSection title="Germination Time" content={entry.germination_time} iconName="clock-time-four-outline" colors={colors} />
      <InfoSection title="Ideal Temperature" content={entry.ideal_temp} iconName="thermometer" colors={colors} />
      <InfoSection title="Lighting Needs" content={entry.lighting} iconName="lightbulb-on-outline" colors={colors} />
      <InfoSection title="Watering Guide" content={entry.watering} iconName="water-outline" colors={colors} />
      <InfoSection title="Harvesting" content={entry.harvest} iconName="content-cut" colors={colors} />
      <InfoSection title="Tips & Notes" content={entry.tips} iconName="information-outline" colors={colors} />
      <InfoSection title="Common Problems" content={entry.common_problems} iconName="alert-circle-outline" colors={colors} />
      <InfoSection title="Nutritional Info" content={entry.nutritional_info} iconName="food-variant" colors={colors} />


      {/* --- Start Growing Button --- */}
      <AppButton
          title={`Start Growing ${entry.name}`}
          onPress={handleStartGrowing}
          style={styles.startButton}
          color="primary" // Or secondary, depending on desired emphasis
          icon={<MaterialCommunityIcons name="plus-circle" size={20} color={colors.buttonPrimaryText || colors.white}/>}
      />

    </ScrollView>
  );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
  container: { flex: 1, },
  scrollContent: { paddingBottom: SIZES.paddingLarge * 3 }, // Extra padding at bottom
  headerImage: {
      width: '110%', // Allow slight overflow for effect if desired
      height: 200, // Fixed height for header image
      alignSelf: 'center',
      marginBottom: SIZES.paddingLarge,
      // Apply border radius if needed, or leave as rectangle
      // borderRadius: SIZES.radius,
  },
  header: {
      marginBottom: SIZES.padding, flexDirection: 'row',
      justifyContent: 'space-between', alignItems: 'flex-start',
      paddingHorizontal: SIZES.paddingLarge, // Add padding here now that it's below image
   },
  title: { ...FONTS.h1, flex: 1, marginRight: SIZES.base, },
  difficultyBadge: {
      paddingHorizontal: SIZES.base * 1.5, paddingVertical: SIZES.base * 0.6,
      borderRadius: SIZES.radius * 0.5, alignSelf: 'flex-start',
      marginTop: SIZES.base * 0.5, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)'
  },
  difficultyText: { ...FONTS.body3, fontWeight: 'bold', textTransform: 'uppercase', },
  description: {
      ...FONTS.body1, marginBottom: SIZES.paddingLarge, lineHeight: 22,
      opacity: 0.9, paddingHorizontal: SIZES.paddingLarge, // Add padding here now
  },
  // InfoSection Styles (remain the same)
  sectionContainer: {
      borderRadius: SIZES.radius, padding: SIZES.padding,
      marginBottom: SIZES.padding * 0.9, borderWidth: 1,
      marginHorizontal: SIZES.paddingLarge, // Add horizontal margin to sections
      shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
   sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.padding * 0.7, },
   sectionIcon: { marginRight: SIZES.padding * 0.6, opacity: 0.8, },
   sectionTitle: { ...FONTS.h4, fontWeight: 'bold', },
   sectionContent: { ...FONTS.body1, lineHeight: 23, paddingLeft: 5, },
   listItem: { flexDirection: 'row', marginBottom: SIZES.base * 0.8, alignItems: 'flex-start', paddingLeft: 5, },
   bulletPoint: { ...FONTS.body1, marginRight: SIZES.base, lineHeight: 23, },
   // Start Growing Button
   startButton: {
       marginTop: SIZES.paddingLarge * 1.5,
       marginHorizontal: SIZES.paddingLarge, // Match section margin
   },
   // Error display
    errorText: {
       ...FONTS.h4,
       textAlign: 'center',
       marginTop: SIZES.padding,
   },
});

export default MicrogreenDetailScreen;