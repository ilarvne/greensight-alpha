// components/ObservationCard.js
import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { FONTS, SIZES } from '../utils/theme';
import { formatDate } from '../utils/helpers';

// Define Tag details (label, icon) for display purposes
const TAG_DETAILS = {
    'watered': { label: 'Watered', icon: 'water-outline' },
    'fertilized': { label: 'Fertilized', icon: 'bottle-tonic-outline' },
    'pest_issue': { label: 'Pest/Issue', icon: 'bug-outline' },
    'harvested': { label: 'Harvested', icon: 'content-cut' },
    'relocated': { label: 'Relocated', icon: 'location-enter' },
};

const ObservationCard = ({ observation }) => {
  const { colors } = useTheme();

  // Basic validation
  if (!observation || !observation.date) {
    // Render nothing or a minimal placeholder if data is invalid
    return null;
    // Or:
    // return (
    //     <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.lightGray }]}>
    //         <Text style={{ color: colors.textSecondary }}>Invalid observation data.</Text>
    //     </View>
    // );
  }

  // Helper checks
  const hasContent = (value) => value && String(value).trim() !== '';
  const hasValidHeight = (value) => value !== null && value !== undefined && typeof value === 'number' && !isNaN(value);
  const hasTags = Array.isArray(observation.tags) && observation.tags.length > 0;
  const hasPhoto = !!observation.photoUri;
  const hasNotes = hasContent(observation.notes);
  const hasStage = hasContent(observation.phenology_stage);
  const hasHeight = hasValidHeight(observation.height);

  // Determine card padding based on content
  const cardPaddingBottom = hasTags ? SIZES.padding * 0.9 : SIZES.padding * 0.5; // Less padding if no tags

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.lightGray, paddingBottom: cardPaddingBottom }]}>

      {/* Image Display (takes full width if present) */}
      {hasPhoto && (
          <Image
              source={{ uri: observation.photoUri }}
              style={[styles.image, { backgroundColor: colors.lightGray }]}
              resizeMode="cover"
              accessibilityLabel={`Observation photo from ${formatDate(observation.date, 'MMM d')}`}
           />
      )}

      {/* Content Area (below image or at top if no image) */}
      <View style={styles.contentArea}>
          {/* Header: Timestamp (less prominent) */}
          <View style={styles.header}>
             <MaterialCommunityIcons name="calendar-clock-outline" size={16} color={colors.textSecondary} style={styles.headerIcon}/>
             <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                 {formatDate(observation.date, 'MMM d, yyyy \'at\' HH:mm')}
             </Text>
          </View>

          {/* Details Row (Stage & Height) */}
          {(hasStage || hasHeight) && (
            <View style={styles.detailsRow}>
                {hasStage && (
                 <View style={[styles.detailChip, { backgroundColor: colors.primaryLight + '90', borderColor: colors.primary + '40' }]}>
                    <MaterialCommunityIcons name="leaf-circle-outline" size={15} color={colors.primaryDark} style={styles.detailIcon} />
                    <Text style={[styles.detailText, { color: colors.primaryDark }]}>
                        {observation.phenology_stage}
                    </Text>
                 </View>
                )}
                {hasHeight && (
                 <View style={[styles.detailChip, { backgroundColor: colors.secondary + '20', borderColor: colors.secondary + '50' }]}>
                    <MaterialCommunityIcons name="ruler" size={15} color={colors.secondaryDark} style={styles.detailIcon}/>
                    <Text style={[styles.detailText, { color: colors.secondaryDark }]}>
                        {observation.height} cm
                    </Text>
                 </View>
               )}
            </View>
          )}

          {/* Display Notes */}
          {hasNotes && (
              <View style={styles.notesContainer}>
                  <Text style={[styles.notesText, { color: colors.text }]}>
                      {observation.notes}
                  </Text>
              </View>
          )}

           {/* Display Event Tags */}
            {hasTags && (
                <View style={styles.tagsDisplayContainer}>
                    {observation.tags.map(tagId => {
                        const tagDetail = TAG_DETAILS[tagId];
                        if (!tagDetail) return null;
                        return (
                            <View key={tagId} style={[styles.tagChip, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}>
                                <MaterialCommunityIcons name={tagDetail.icon} size={14} color={colors.textSecondary} style={styles.tagChipIcon} />
                                <Text style={[styles.tagChipText, { color: colors.textSecondary }]}>{tagDetail.label}</Text>
                            </View>
                        );
                    })}
                </View>
            )}
      </View>
    </View>
  );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
    card: {
        borderRadius: SIZES.radius, // More standard rounding
        marginBottom: SIZES.padding * 1.1, // Slightly more space between cards
        borderWidth: 1,
        // Softer shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: Platform.OS === 'ios' ? 0.06 : 0.08,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden', // Clip image corners
    },
    image: {
        width: '100%',
        height: 200, // Slightly taller image
        // No margin bottom here, handled by contentArea padding
    },
    contentArea: {
        paddingHorizontal: SIZES.padding * 0.9,
        paddingTop: SIZES.padding * 0.8, // Padding applied here instead of spacing elements
        paddingBottom: SIZES.base, // Ensure some padding at the very bottom before tags
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SIZES.padding * 0.7, // Space below date
        opacity: 0.8, // Make date less prominent
    },
    headerIcon: {
       marginRight: SIZES.base * 0.8,
    },
    dateText: {
        ...FONTS.body3, // Smaller font for date
        fontSize: 11,
        fontWeight: '500',
    },
    detailsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap', // Allow chips to wrap
        gap: SIZES.base * 1.2, // Space between chips
        marginBottom: SIZES.padding * 0.6, // Space below chips row
    },
    detailChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: SIZES.base * 0.5,
        paddingHorizontal: SIZES.padding * 0.6,
        borderRadius: SIZES.radius * 0.5, // Smaller radius
        borderWidth: 1,
        // Removed margins - use gap in detailsRow
    },
    detailIcon: {
        marginRight: SIZES.base * 0.7,
    },
    detailText: {
        ...FONTS.body2,
        fontSize: 13, // Slightly smaller detail text
        fontWeight: '600',
    },
    notesContainer: {
        // No background needed unless distinct section required
        marginBottom: SIZES.padding * 0.6, // Space below notes
    },
    notesText: {
        ...FONTS.body1,
        lineHeight: 22,
        opacity: 0.95, // Make notes text clear
    },
    tagsDisplayContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SIZES.base, // Space between tags
        marginTop: SIZES.padding * 0.5, // Space above tags
        paddingTop: SIZES.base, // Padding above tags if needed
        // borderTopWidth: 0.5, // Optional top border
        // borderTopColor: colors.lightGray,
    },
    tagChip: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: SIZES.radius * 0.5,
        paddingVertical: SIZES.base * 0.4,
        paddingHorizontal: SIZES.base,
    },
    tagChipIcon: {
        marginRight: SIZES.base * 0.5,
        opacity: 0.8,
    },
    tagChipText: {
        ...FONTS.body3,
        fontSize: 11,
        fontWeight: '500',
    },
});

export default ObservationCard;