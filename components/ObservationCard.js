// components/ObservationCard.js
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../utils/theme';
import { formatDate } from '../utils/helpers';

const ObservationCard = ({ observation }) => {
  return (
    <View style={styles.card}>
      {/* Header with Date */}
      <View style={styles.header}>
         <MaterialCommunityIcons name="calendar-clock-outline" size={18} color={COLORS.primary} />
         <Text style={styles.dateText}>{formatDate(observation.date, 'MMM d, yyyy \'at\' HH:mm')}</Text>
      </View>

      {/* Optional Image */}
      {observation.photoUri && (
        <Image source={{ uri: observation.photoUri }} style={styles.image} resizeMode="cover" />
      )}

      {/* Notes */}
      {observation.notes && (
          <View style={styles.notesContainer}>
             {/* Optional Icon for Notes Section */}
             {/* <MaterialCommunityIcons name="note-text-outline" size={18} color={COLORS.textSecondary} style={styles.notesIcon} /> */}
             <Text style={styles.notesText}>
                 {/* Removed bold tag for cleaner look, can add back if preferred */}
                 {observation.notes}
             </Text>
          </View>
      )}

       {/* Height Display */}
       {(observation.height !== null && observation.height !== undefined && observation.height >= 0) && (
         <View style={styles.heightContainer}>
            <MaterialCommunityIcons name="ruler" size={16} color={COLORS.secondary} />
            <Text style={styles.heightText}>Height: {observation.height === 0 ? '0' : observation.height} cm</Text>
         </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white, // Use distinct white for observation cards if needed
    borderRadius: SIZES.radius * 0.8, // Slightly less rounded
    padding: SIZES.padding * 0.9, // Consistent padding
    marginBottom: SIZES.padding, // Spacing
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.padding * 0.7, // Space below header
    opacity: 0.8, // Slightly fade header
  },
  dateText: {
    ...FONTS.body3,
    marginLeft: SIZES.base,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: SIZES.radius * 0.6, // Match card rounding style
    marginBottom: SIZES.padding * 0.8, // Space below image
    backgroundColor: COLORS.lightGray, // Placeholder background
  },
   notesContainer: {
       marginBottom: SIZES.padding * 0.5, // Space below notes if height is present
       padding: SIZES.padding * 0.5, // Add padding around notes
       backgroundColor: COLORS.background, // Subtle background for notes
       borderRadius: SIZES.radius * 0.5,
   },
    // notesIcon: { marginRight: SIZES.base * 0.5 }, // Style if icon is added
   notesText: {
       ...FONTS.body1, // Use Body1 for main notes
       color: COLORS.text,
       lineHeight: 22,
   },
  heightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SIZES.base, // Space above height if notes are present
    backgroundColor: COLORS.secondary + '1A', // Very transparent accent background
    paddingVertical: SIZES.base * 0.8,
    paddingHorizontal: SIZES.padding * 0.6,
    borderRadius: SIZES.radius * 2, // Pill shape
    alignSelf: 'flex-start', // Don't stretch full width
    borderWidth: 1,
    borderColor: COLORS.secondary + '40', // Transparent border
  },
  heightText: {
    ...FONTS.body2, // Use Body2 for height
    marginLeft: SIZES.base * 0.8,
    fontWeight: '600',
    color: COLORS.secondary, // Use theme secondary color
  },
});

export default ObservationCard;