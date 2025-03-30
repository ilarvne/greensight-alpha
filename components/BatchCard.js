// components/BatchCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { FONTS, SIZES } from '../utils/theme';
import { useTheme } from '../contexts/ThemeContext';
import { formatDate, getDaysSinceSown } from '../utils/helpers';

// --- Reusable Info Snippet ---
const InfoSnippet = ({ icon, text, iconColor, textColor, style }) => {
    if (!text) return null;
    return (
        <View style={[styles.infoSnippetContainer, style]}>
            {icon && <MaterialCommunityIcons name={icon} size={14} color={iconColor || textColor} style={styles.infoSnippetIcon}/>}
            {/* Ensure text is a string */}
            <Text style={[styles.infoSnippetText, { color: textColor }]}>{String(text || '')}</Text>
        </View>
    );
};

const BatchCard = ({ batch, onPress }) => {
  const { colors } = useTheme();

  if (!batch || !batch.id || !batch.name) { return null; }

  // --- Log the image URL to help debug ---
  console.log(`BatchCard: Rendering batch "${batch.name}", Image URL:`, batch.imageUrl);

  // Calculate days sown
  const days = getDaysSinceSown(batch.sowDate);
  const daysText = `${days} ${days === 1 ? 'day' : 'days'} old`;

  // Calculate estimated harvest info
  let harvestText = 'Est. N/A';
  let harvestIcon = 'calendar-question';
  let harvestColor = colors.textSecondary;
  if (batch.estimatedHarvestDays != null && typeof batch.estimatedHarvestDays === 'number') {
      const daysRemaining = batch.estimatedHarvestDays - days;
      if (daysRemaining > 0) {
          harvestText = `~${daysRemaining}d left`; harvestIcon = 'calendar-clock-outline'; harvestColor = colors.secondaryDark;
      } else {
          harvestText = 'Ready!'; harvestIcon = 'check-circle-outline'; harvestColor = colors.primaryDark;
      }
  }

  // Image handling - Check if URL is a valid non-empty string
  const hasImage = batch.imageUrl && typeof batch.imageUrl === 'string' && batch.imageUrl.trim() !== '';

  return (
    <TouchableOpacity
        style={[ styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.lightGray + '80' } ]}
        onPress={() => onPress(batch.id)}
        activeOpacity={0.75}
    >
        {/* Left Side: Image or Placeholder Icon */}
        <View style={[styles.imageContainer, { backgroundColor: colors.lightGray + '50' }]}>
            {hasImage ? (
                <Image
                    source={{ uri: batch.imageUrl }}
                    style={styles.image} // Ensure styles.image has width/height
                    resizeMode="cover"
                    onError={(e) => console.warn(`BatchCard: Failed to load image ${batch.imageUrl}`, e.nativeEvent.error)} // Add error handler
                />
            ) : (
                <MaterialCommunityIcons name="sprout" size={30} color={colors.primary} />
            )}
        </View>

        {/* Center: Text Info & Snippets */}
        <View style={styles.centerContainer}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{batch.name || ''}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                {/* Ensure comments/date are strings */}
                {String(batch.comments || `Sown: ${formatDate(batch.sowDate)}`)}
            </Text>

            {/* Info Snippets Row */}
            <View style={styles.infoRow}>
                <InfoSnippet
                    icon="calendar-today"
                    text={daysText}
                    iconColor={colors.primary}
                    textColor={colors.textSecondary}
                    style={styles.infoSnippetMargin}
                />
                 <InfoSnippet
                    icon={harvestIcon}
                    text={harvestText}
                    iconColor={harvestColor}
                    textColor={harvestColor}
                />
            </View>
        </View>

        {/* Right side: Chevron Icon */}
        <MaterialCommunityIcons name="chevron-right" size={28} color={colors.gray} style={styles.chevron} />
    </TouchableOpacity>
  );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
  card: {
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.padding * 0.8,
    paddingHorizontal: SIZES.padding * 0.9,
    marginBottom: SIZES.padding,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  imageContainer: {
    width: 60, // Explicit positive width
    height: 60, // Explicit positive height
    borderRadius: SIZES.radius * 0.8,
    marginRight: SIZES.padding * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  image: {
    width: '100%', // Takes full width of container
    height: '100%', // Takes full height of container
    // backgroundColor: '#eee', // Optional: Add temporary background to visualize area
  },
  centerContainer: {
      flex: 1,
      justifyContent: 'center',
      marginRight: SIZES.base,
  },
  name: {
      ...FONTS.h3,
      fontWeight: '600',
      marginBottom: SIZES.base * 0.4,
  },
  subtitle: {
      ...FONTS.body3,
      marginBottom: SIZES.padding * 0.6,
      opacity: 0.8,
  },
  infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'nowrap',
  },
  infoSnippetContainer: {
      flexDirection: 'row',
      alignItems: 'center',
  },
   infoSnippetMargin: {
       marginRight: SIZES.padding,
   },
  infoSnippetIcon: {
      marginRight: SIZES.base * 0.6,
      opacity: 0.9,
  },
  infoSnippetText: {
      ...FONTS.body3,
      fontSize: 12.5,
      fontWeight: '500',
  },
  chevron: {
      opacity: 0.8,
  },
});

export default BatchCard;