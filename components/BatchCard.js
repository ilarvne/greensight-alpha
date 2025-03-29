// components/BatchCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../utils/theme';
import { formatDate, getDaysSinceSown } from '../utils/helpers';

const BatchCard = ({ batch, onPress }) => {
  const days = getDaysSinceSown(batch.sowDate);
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(batch.id)} activeOpacity={0.7}>
      <View style={styles.iconContainer}>
         <MaterialCommunityIcons name="sprout-outline" size={30} color={COLORS.primary} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.name} numberOfLines={1}>{batch.name}</Text>
        <Text style={styles.details}>Sown: {formatDate(batch.sowDate)} ({days} days)</Text>
        {batch.comments ? <Text style={styles.details} numberOfLines={1}>Notes: {batch.comments}</Text> : null}
      </View>
       <MaterialCommunityIcons name="chevron-right" size={28} color={COLORS.gray} style={styles.chevron} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBackground, // Use theme card background
    borderRadius: SIZES.radius, // Use theme radius
    paddingVertical: SIZES.padding * 0.8, // Adjust padding
    paddingHorizontal: SIZES.padding,
    marginBottom: SIZES.padding * 0.9, // Spacing between cards
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, // Subtle shadow
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.lightGray, // Use theme light gray border
  },
  iconContainer: {
    backgroundColor: COLORS.primaryLight, // Use light primary accent from theme
    padding: SIZES.padding * 0.6, // Adjust padding
    borderRadius: SIZES.radius * 0.8, // Slightly less round than card
    marginRight: SIZES.padding,
  },
  textContainer: {
    flex: 1, // Take remaining space
    marginRight: SIZES.base,
  },
  name: {
    ...FONTS.h3, // Use H3 style from theme
    fontWeight: '600',
    color: COLORS.text, // Use theme text color
    marginBottom: SIZES.base * 0.5,
  },
  details: {
    ...FONTS.body3, // Use body3 style from theme
    color: COLORS.textSecondary, // Use theme secondary text color
    lineHeight: 16,
  },
  chevron: {
    marginLeft: SIZES.base, // Space before chevron
  },
});

export default BatchCard;