// screens/KnowledgeBaseScreen.js
import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { KNOWLEDGE_BASE_DATA } from '../utils/knowledgeBaseData'; // Import the data
import { COLORS, FONTS, SIZES } from '../utils/theme';

const KnowledgeBaseScreen = ({ navigation }) => {

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => navigation.navigate('MicrogreenDetail', { microgreenData: item })}
    >
       <View style={styles.iconContainer}>
         <MaterialCommunityIcons
            name={item.iconName || 'seed'} // Use specified icon or default
            size={28}
            color={COLORS.kbIconColor} // Specific color for KB icons
          />
       </View>
      <View style={styles.textContainer}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemDescription} numberOfLines={1}>{item.description}</Text>
      </View>
       <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.gray} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Microgreen Library</Text>
      <FlatList
        data={KNOWLEDGE_BASE_DATA}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  title: {
    ...FONTS.h1,
    color: COLORS.primaryDark,
    paddingHorizontal: SIZES.paddingLarge,
    paddingTop: SIZES.paddingLarge,
    paddingBottom: SIZES.padding,
  },
  listContainer: {
      paddingHorizontal: SIZES.padding,
      paddingBottom: SIZES.paddingLarge,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground, // White card background
    padding: SIZES.padding,
    marginBottom: SIZES.padding * 0.7,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
   iconContainer: {
       backgroundColor: COLORS.kbCardBackground, // Light green circle background
       padding: SIZES.base * 1.1,
       borderRadius: SIZES.radius * 2, // Make it circular
       marginRight: SIZES.padding,
   },
  textContainer: {
    flex: 1,
    marginRight: SIZES.base,
  },
  itemName: {
    ...FONTS.h4,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SIZES.base / 2,
  },
  itemDescription: {
    ...FONTS.body3,
    color: COLORS.textSecondary,
  },
});

export default KnowledgeBaseScreen;