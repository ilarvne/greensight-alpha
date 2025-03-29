// screens/MicrogreenDetailScreen.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../utils/theme';

// Helper component for displaying sections
const InfoSection = ({ title, content, iconName }) => (
    <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
             {iconName && <MaterialCommunityIcons name={iconName} size={20} color={COLORS.primary} style={styles.sectionIcon} />}
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {Array.isArray(content) ? (
            content.map((item, index) => (
                <View key={index} style={styles.listItem}>
                     <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.sectionContent}>{item}</Text>
                </View>
            ))
        ) : (
            <Text style={styles.sectionContent}>{content}</Text>
        )}
    </View>
);


const MicrogreenDetailScreen = ({ route }) => {
  const { microgreenData } = route.params;

  if (!microgreenData) {
    // Handle error case where data might not be passed
    return (
      <View style={styles.container}>
        <Text>Error: Microgreen data not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>{microgreenData.name}</Text>
         <View style={[styles.difficultyBadge, {backgroundColor: microgreenData.difficulty === 'Easy' ? COLORS.primaryLight : microgreenData.difficulty === 'Medium' ? COLORS.secondary + '30' : COLORS.danger + '30'}]}>
            <Text style={[styles.difficultyText, {color: microgreenData.difficulty === 'Easy' ? COLORS.primaryDark : microgreenData.difficulty === 'Medium' ? COLORS.secondary : COLORS.danger}]}>
                 {microgreenData.difficulty}
             </Text>
         </View>
      </View>

        <Text style={styles.description}>{microgreenData.description}</Text>

        <InfoSection title="Germination Time" content={microgreenData.germinationTime} iconName="clock-time-four-outline"/>
        <InfoSection title="Ideal Temperature" content={microgreenData.idealTemp} iconName="thermometer"/>
        <InfoSection title="Lighting Needs" content={microgreenData.lighting} iconName="lightbulb-on-outline"/>
        <InfoSection title="Watering Guide" content={microgreenData.watering} iconName="water-outline"/>
        <InfoSection title="Harvesting" content={microgreenData.harvest} iconName="content-cut"/>
        {microgreenData.tips && microgreenData.tips.length > 0 && (
            <InfoSection title="Tips & Notes" content={microgreenData.tips} iconName="information-outline"/>
        )}

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
      padding: SIZES.paddingLarge,
      paddingBottom: SIZES.paddingLarge * 2, // Extra padding at bottom
  },
   header: {
      marginBottom: SIZES.padding,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
   },
  title: {
    ...FONTS.h1,
    color: COLORS.primaryDark,
    flex: 1, // Allow title to take space
    marginRight: SIZES.base, // Space before badge
  },
  difficultyBadge: {
      paddingHorizontal: SIZES.base * 1.5,
      paddingVertical: SIZES.base * 0.5,
      borderRadius: SIZES.radius * 0.5,
      alignSelf: 'flex-start', // Align badge to top
      marginTop: SIZES.base * 0.5, // Align with title baseline roughly
  },
  difficultyText: {
      ...FONTS.body3,
      fontWeight: 'bold',
      textTransform: 'uppercase',
  },
  description: {
      ...FONTS.body1,
      color: COLORS.textSecondary,
      marginBottom: SIZES.paddingLarge,
      lineHeight: 22,
  },
  sectionContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radius,
    padding: SIZES.padding,
    marginBottom: SIZES.padding,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
     shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
   sectionHeader: {
       flexDirection: 'row',
       alignItems: 'center',
       marginBottom: SIZES.padding * 0.6,
   },
    sectionIcon: {
        marginRight: SIZES.base,
    },
  sectionTitle: {
    ...FONTS.h4,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
    // marginBottom: SIZES.padding * 0.6, // Moved margin to header
  },
  sectionContent: {
    ...FONTS.body1,
    color: COLORS.text,
    lineHeight: 22, // Increase readability
     flexShrink: 1, // Allow text to wrap within list item
  },
   listItem: {
       flexDirection: 'row',
       marginBottom: SIZES.base / 2,
       alignItems: 'flex-start', // Align bullet point to top
   },
    bulletPoint: {
        ...FONTS.body1,
        color: COLORS.primary,
        marginRight: SIZES.base,
        lineHeight: 22, // Match content line height
    },
});

export default MicrogreenDetailScreen;