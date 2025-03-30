// screens/KnowledgeBaseScreen.js
import React, { useState, useMemo, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    SafeAreaView, TextInput, Image, ActivityIndicator, Platform, Keyboard // Added Keyboard
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../contexts/AppContext';
import { FONTS, SIZES } from '../utils/theme';
import { useTheme } from '../contexts/ThemeContext';

// --- Reusable Filter Button ---
const FilterButton = ({ level, currentFilter, onPress, colors }) => {
    const isActive = level === currentFilter;
    // Use primary color scheme for active filter
    const bgColor = isActive ? colors.primaryLight : colors.inputBackground;
    const textColor = isActive ? colors.primaryDark : colors.textSecondary;
    const borderColor = isActive ? colors.primaryDark : colors.inputBorder;
    return (
        <TouchableOpacity
            style={[styles.filterButton, { backgroundColor: bgColor, borderColor: borderColor }]}
            onPress={() => onPress(isActive ? null : level)} // Toggle filter
            activeOpacity={0.7}
        >
            {/* Ensure level is string */}
            <Text style={[styles.filterButtonText, { color: textColor }]}>{String(level || 'All')}</Text>
        </TouchableOpacity>
    );
};

// --- Reusable Empty State Component ---
const EmptyListComponent = ({ colors, title, message, icon="text-box-search-outline" }) => (
    <View style={styles.emptyListContainer}>
        <MaterialCommunityIcons name={icon} size={60} color={colors.gray} style={styles.emptyIcon} />
        <Text style={[styles.emptyListTitle, {color: colors.textSecondary}]}>{String(title || '')}</Text>
        {message && <Text style={[styles.emptyListMessage, {color: colors.textSecondary}]}>{String(message || '')}</Text>}
    </View>
);

// --- Knowledge Base Screen Component ---
const KnowledgeBaseScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { knowledgeBaseEntries, isLoadingData } = useAppContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState(null); // null, 'Easy', 'Medium', 'Hard'

  // --- Filtered Data ---
  const filteredEntries = useMemo(() => {
      if (!Array.isArray(knowledgeBaseEntries)) return []; // Safety check
      let results = knowledgeBaseEntries;
      const lowerCaseQuery = searchQuery.toLowerCase().trim();
      const lowerCaseFilter = filterDifficulty?.toLowerCase();

      if (lowerCaseQuery) {
          results = results.filter(entry => entry.name?.toLowerCase().includes(lowerCaseQuery));
      }
      if (lowerCaseFilter) {
          results = results.filter(entry => entry.difficulty?.toLowerCase() === lowerCaseFilter);
      }
      // Already sorted by name from AppContext fetch
      return results;
  }, [knowledgeBaseEntries, searchQuery, filterDifficulty]);

  // --- Navigation ---
  const handleNavigateToDetail = useCallback((kbEntryId) => {
       navigation.navigate('MicrogreenDetail', { kbEntryId: kbEntryId });
  }, [navigation]);

  const handleNavigateToAddEntry = () => {
       navigation.navigate('AddKnowledgeBaseEntryModal'); // Navigate to the modal screen (to be created)
   };

   // --- Render KB Entry Item ---
   const renderItem = useCallback(({ item }) => {
       const hasImage = item.image_url && typeof item.image_url === 'string' && item.image_url.trim() !== '';
       const difficulty = item.difficulty || '';
       let difficultyColor = colors.textSecondary;
       if (difficulty.toLowerCase() === 'easy') difficultyColor = colors.primary;
       else if (difficulty.toLowerCase() === 'medium') difficultyColor = colors.warning; // Use warning color for medium
       else if (difficulty.toLowerCase() === 'hard') difficultyColor = colors.danger;

       return (
           <TouchableOpacity
             style={[ styles.itemContainer, { backgroundColor: colors.cardBackground, borderColor: colors.lightGray + '60' } ]}
             onPress={() => handleNavigateToDetail(item.id)}
             activeOpacity={0.75} >
               {/* Image or Placeholder */}
               <View style={[styles.itemImageContainer, { backgroundColor: colors.lightGray + '40'}]}>
                   {hasImage ? (
                       <Image source={{ uri: item.image_url }} style={styles.itemImage} resizeMode="cover"/>
                   ) : (
                       <MaterialCommunityIcons name={item.icon_name || 'seed'} size={32} color={colors.primary} />
                   )}
              </View>
              {/* Text Content */}
             <View style={styles.itemTextContainer}>
               <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>{item.name || 'Unnamed Entry'}</Text>
               <Text style={[styles.itemDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                   {/* Ensure description is string */}
                   {String(item.description || '')}
               </Text>
               {/* Difficulty Badge (Optional) */}
               {difficulty ? (
                   <View style={[styles.difficultyBadge, {borderColor: difficultyColor + '80'}]}>
                       <Text style={[styles.difficultyText, {color: difficultyColor}]}>{difficulty}</Text>
                   </View>
               ) : null}
             </View>
             {/* Chevron Icon */}
              <MaterialCommunityIcons name="chevron-right" size={26} color={colors.gray} style={styles.itemChevron}/>
           </TouchableOpacity>
         );
   }, [colors, handleNavigateToDetail]); // Include colors and navigation handler

  // --- Render Empty/Loading State ---
  const ListEmptyComponent = useMemo(() => {
      if (isLoadingData) {
           return <ActivityIndicator size="large" color={colors.primary} style={styles.activityIndicator} />;
      }
      return (
           <EmptyListComponent
               colors={colors}
               title={searchQuery || filterDifficulty ? "No Matches Found" : "Knowledge Base Empty"}
               message={searchQuery || filterDifficulty ? "Try adjusting search or filters." : "Add new entries using the '+' button."}
               icon={searchQuery || filterDifficulty ? "magnify-close" : "text-box-remove-outline"}
           />
       );
  }, [isLoadingData, searchQuery, filterDifficulty, colors]);


  // --- Main Screen Render ---
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        {/* Search Bar */}
         <View style={[styles.searchBarContainer, { backgroundColor: colors.cardBackground, borderColor: colors.inputBorder, shadowColor: colors.shadow }]}>
             <MaterialCommunityIcons name="magnify" size={22} color={colors.gray} style={styles.searchIcon} />
             <TextInput
                 style={[styles.searchInput, { color: colors.text }]}
                 placeholder="Search Knowledge Base..." placeholderTextColor={colors.gray}
                 value={searchQuery} onChangeText={setSearchQuery}
                 returnKeyType="search" clearButtonMode="while-editing"
                 onBlur={() => Keyboard.dismiss()} // Dismiss keyboard on blur
             />
        </View>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
            <FilterButton level={null} currentFilter={filterDifficulty} onPress={setFilterDifficulty} colors={colors}/>
            <FilterButton level="Easy" currentFilter={filterDifficulty} onPress={setFilterDifficulty} colors={colors}/>
            <FilterButton level="Medium" currentFilter={filterDifficulty} onPress={setFilterDifficulty} colors={colors}/>
            <FilterButton level="Hard" currentFilter={filterDifficulty} onPress={setFilterDifficulty} colors={colors}/>
        </View>

        {/* List of Microgreens */}
        <FlatList
            data={filteredEntries}
            renderItem={renderItem}
            keyExtractor={(item) => String(item?.id || Math.random())} // Robust key extractor
            ListEmptyComponent={ListEmptyComponent}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            // Performance optimizations
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={11}
        />

        {/* FAB to Add New Entry */}
        <TouchableOpacity
            style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.shadow }]}
            onPress={handleNavigateToAddEntry} // Navigate to Add screen
            activeOpacity={0.8}
        >
            <MaterialCommunityIcons name="plus" size={30} color={colors.white} />
        </TouchableOpacity>
    </SafeAreaView>
  );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  searchBarContainer: {
      flexDirection: 'row', alignItems: 'center', borderRadius: SIZES.radius * 1.5,
      marginHorizontal: SIZES.padding, marginTop: SIZES.padding, marginBottom: SIZES.padding * 0.8,
      paddingHorizontal: SIZES.padding, borderWidth: 1, minHeight: 50,
      elevation: 1, shadowOpacity: 0.06, shadowOffset: {width: 0, height: 1}, shadowRadius: 2,
  },
  searchIcon: { marginRight: SIZES.padding * 0.5 },
  searchInput: { flex: 1, ...FONTS.body1, paddingVertical: Platform.OS === 'ios' ? SIZES.padding * 0.7 : SIZES.padding * 0.6 },
  filterContainer: {
      flexDirection: 'row', justifyContent: 'space-evenly', // Space out buttons evenly
      paddingHorizontal: SIZES.padding, marginBottom: SIZES.padding * 1.5, // More space below filters
  },
  filterButton: { paddingVertical: SIZES.base * 0.9, paddingHorizontal: SIZES.padding, borderRadius: SIZES.radius * 1.5, borderWidth: 1.5, }, // Slightly larger buttons
  filterButtonText: { ...FONTS.body2, fontWeight: '600', }, // Bolder filter text
  listContainer: { paddingHorizontal: SIZES.padding, paddingBottom: 120, flexGrow: 1 },
  itemContainer: { // Card-like item
    flexDirection: 'row', alignItems: 'center', padding: SIZES.padding * 0.8,
    marginBottom: SIZES.padding, borderRadius: SIZES.radius, borderWidth: 1,
    // Removed shadow/elevation
  },
   itemImageContainer: {
       width: 70, height: 70, // Slightly larger image area
       borderRadius: SIZES.radius * 0.8, // Match card rounding more closely
       marginRight: SIZES.padding,
       alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
       borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
   },
   itemImage: { width: '100%', height: '100%' },
  itemTextContainer: { flex: 1, justifyContent: 'center'}, // Center text vertically
  itemName: { ...FONTS.h3, fontWeight: '600', marginBottom: SIZES.base * 0.5, },
  itemDescription: { ...FONTS.body3, lineHeight: SIZES.body3.fontSize * 1.4, opacity: 0.8, marginBottom: SIZES.base * 0.8},
  difficultyBadge: {
       paddingHorizontal: SIZES.base, paddingVertical: SIZES.base * 0.3,
       borderRadius: SIZES.radius * 0.5, borderWidth: 1, alignSelf: 'flex-start', // Align badge left
       marginTop: SIZES.base * 0.5,
   },
   difficultyText: { ...FONTS.body3, fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase'},
  itemChevron: { marginLeft: SIZES.base, opacity: 0.7 }, // Chevron on the right
  activityIndicator: { marginTop: SIZES.paddingLarge * 2 },
  emptyListContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: SIZES.height * 0.1, paddingHorizontal: SIZES.paddingLarge, },
  emptyIcon: { marginBottom: SIZES.padding, opacity: 0.6, },
  emptyListTitle: { ...FONTS.h3, textAlign: 'center', marginBottom: SIZES.base, fontWeight: '600' },
  emptyListMessage: { ...FONTS.body1, textAlign: 'center', maxWidth: '85%', lineHeight: 22, opacity: 0.8 },
  fab: { position: 'absolute', margin: SIZES.padding, right: SIZES.padding, bottom: SIZES.padding, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', // Removed shadow/elevation
        borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' // Add subtle border instead of shadow
    },
});

export default KnowledgeBaseScreen;