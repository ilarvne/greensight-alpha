// screens/HomeScreen.js
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, SafeAreaView, TextInput,
    ActivityIndicator, Platform, RefreshControl, TouchableOpacity, Alert,
    Keyboard, Modal // Added Modal for sorting
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '../contexts/AppContext';
import BatchCard from '../components/BatchCard'; // Default import
import AppButton from '../components/AppButton'; // Default import
import { useTheme } from '../contexts/ThemeContext';
import { FONTS, SIZES } from '../utils/theme';
import { MICROGREEN_TIPS } from '../utils/tips';

// --- Helper Components (Defined Outside HomeScreen) ---

const TipCard = ({ tip, colors }) => {
    if (!tip) return null;
    return (
        <View style={[ styles.tipCardContainer, { backgroundColor: colors.cardBackground, borderColor: colors.accent + '50', shadowColor: colors.shadow, } ]}>
             <MaterialCommunityIcons name="lightbulb-on-outline" size={28} color={colors.accentDark} style={styles.tipIcon} />
            <View style={styles.tipTextContainer}>
                <Text style={[styles.tipText, { color: colors.text }]}>
                    <Text style={[styles.tipTitle, {color: colors.accentDark}]}>Tip: </Text>
                    {String(tip || '')}
                </Text>
            </View>
        </View>
    );
};

const SortButton = ({ onPress, label, icon, isActive, first, last, colors }) => (
    <TouchableOpacity
        style={[
            styles.sortButton, { backgroundColor: isActive ? colors.primaryLight : colors.inputBackground, borderColor: isActive ? colors.primaryDark : colors.inputBorder },
            first && styles.sortButtonFirst, last && styles.sortButtonLast,
        ]}
        onPress={onPress} activeOpacity={0.7} >
        {icon && <MaterialCommunityIcons name={icon} size={16} color={isActive ? colors.primaryDark : colors.textSecondary} style={styles.sortIcon} />}
        <Text style={[ styles.sortText, { color: isActive ? colors.primaryDark : colors.textSecondary } ]}>
            {String(label || '')}
        </Text>
    </TouchableOpacity>
);

const EmptyListComponent = ({ colors, title, message, icon="seed-outline" }) => (
    <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name={icon} size={60} color={colors.gray} style={styles.emptyIcon} />
        <Text style={[styles.emptyText, {color: colors.textSecondary}]}>{String(title || '')}</Text>
        {message && <Text style={[styles.emptySubText, {color: colors.textSecondary}]}>{String(message || '')}</Text>}
    </View>
);

// --- Sorting Options Type Definition ---
const SORT_OPTIONS = [
    { key: 'newest', label: 'Date Added (Newest)', icon: 'sort-calendar-descending' },
    { key: 'oldest', label: 'Date Added (Oldest)', icon: 'sort-calendar-ascending' },
    { key: 'nameAZ', label: 'Name (A-Z)', icon: 'sort-alphabetical-ascending' },
    { key: 'nameZA', label: 'Name (Z-A)', icon: 'sort-alphabetical-descending' },
];

// --- HomeScreen Component ---
const HomeScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { batches, isLoadingData, refreshData } = useAppContext();
  const [dailyTip, setDailyTip] = useState(null);
  const [isLoadingTip, setIsLoadingTip] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortCriteria, setSortCriteria] = useState('newest');
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);

  // --- Daily Tip Logic ---
  useEffect(() => {
      let isMounted = true;
      const getTip = async () => {
          setIsLoadingTip(true);
          try {
              const today = new Date().toISOString().split('T')[0];
              const storedData = await AsyncStorage.getItem('dailyTipData');
              let tipToShow = MICROGREEN_TIPS[0]; let needsUpdate = true;
              if (storedData) { const { date, tip } = JSON.parse(storedData); if (date === today && tip) { tipToShow = tip; needsUpdate = false; } }
              if (needsUpdate) { const randomIndex = Math.floor(Math.random() * MICROGREEN_TIPS.length); tipToShow = MICROGREEN_TIPS[randomIndex]; await AsyncStorage.setItem('dailyTipData', JSON.stringify({ date: today, tip: tipToShow })); }
              if (isMounted) setDailyTip(tipToShow);
          } catch (error) { console.error("HomeScreen: Error getting/setting tip:", error); if (isMounted) setDailyTip(MICROGREEN_TIPS[0]); }
          finally { if (isMounted) setIsLoadingTip(false); }
      };
      getTip();
      return () => { isMounted = false; };
  }, []);

  // --- Filtered and Sorted Batches ---
   const filteredAndSortedBatches = useMemo(() => {
       if (!Array.isArray(batches)) return [];
       const lowerCaseQuery = searchQuery.toLowerCase();
       const filtered = batches.filter(batch => batch.name?.toLowerCase().includes(lowerCaseQuery));
       return filtered.sort((a, b) => {
           switch (sortCriteria) {
               case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
               case 'nameAZ': return (a.name || '').localeCompare(b.name || '');
               case 'nameZA': return (b.name || '').localeCompare(a.name || '');
               case 'newest': default: return new Date(b.createdAt) - new Date(a.createdAt);
           }
       });
   }, [batches, searchQuery, sortCriteria]);

  // --- Pull-to-refresh ---
  const onRefresh = useCallback(async () => {
      setRefreshing(true);
      try { if (refreshData) await refreshData(); }
      catch (error) { console.error("HomeScreen: Refresh Error:", error); Alert.alert("Refresh Failed", "Could not update data."); }
      finally { setRefreshing(false); }
  }, [refreshData]);

  // --- Navigation Handlers ---
  const handleAddNewBatch = () => navigation.navigate('AddBatchModal');
  const handleOpenBatch = useCallback((batchId) => { // Wrap in useCallback if passed to child
        navigation.navigate('BatchDetail', { batchId: batchId });
  }, [navigation]);

  // --- Sort Modal Handling ---
  const openSortModal = () => setIsSortModalVisible(true);
  const closeSortModal = () => setIsSortModalVisible(false);
  const handleSelectSort = (criteria) => {
      setSortCriteria(criteria);
      closeSortModal();
  };

  // --- Render List Header ---
  const ListHeader = useMemo(() => (
      <View style={styles.headerContentContainer}>
          {/* Search Bar */}
          <View style={[styles.searchBarContainer, { backgroundColor: colors.cardBackground, borderColor: colors.inputBorder, shadowColor: colors.shadow }]}>
               <MaterialCommunityIcons name="magnify" size={22} color={colors.gray} style={styles.searchIcon} />
               <TextInput
                    style={[styles.searchInput, { color: colors.text }]}
                    placeholder="Search batches..." placeholderTextColor={colors.gray}
                    value={searchQuery} onChangeText={setSearchQuery}
                    returnKeyType="search" clearButtonMode="while-editing"
                    onBlur={() => Keyboard.dismiss()}
               />
          </View>

          {/* Tip Card */}
          {!isLoadingTip && dailyTip && <TipCard tip={dailyTip} colors={colors} />}

          {/* Title and Sort Button Row */}
          <View style={styles.listHeaderRow}>
              <Text style={[styles.listHeaderTitle, { color: colors.text }]}>Batches</Text>
               <TouchableOpacity style={[styles.sortButtonContainer, {backgroundColor: colors.cardBackground, borderColor: colors.lightGray}]} onPress={openSortModal}>
                   <MaterialCommunityIcons name="sort-variant" size={20} color={colors.primary} />
                   <Text style={[styles.sortButtonText, {color: colors.primary}]}>Sort</Text>
               </TouchableOpacity>
          </View>
      </View>
  // Include colors in dependency array if TipCard uses it directly for styling not passed as prop
  ), [searchQuery, setSearchQuery, dailyTip, isLoadingTip, colors, openSortModal]);


  // --- Render Batch Card Item ---
  const renderBatchItem = useCallback(({ item }) => (
      <BatchCard batch={item} onPress={handleOpenBatch} />
  ), [handleOpenBatch]); // Pass handleOpenBatch


  // --- Render Loading or Empty State for the List ---
  const ListEmptyOrLoadingComponent = useMemo(() => {
       if (isLoadingData && (!filteredAndSortedBatches || filteredAndSortedBatches.length === 0)) {
            return ( <View style={styles.listLoadingContainer}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.loadingText, {color: colors.textSecondary}]}>Loading garden...</Text></View> );
        }
        // Pass colors to EmptyListComponent
        return ( <EmptyListComponent colors={colors} title={searchQuery ? 'No Matches Found' : 'Your Garden is Empty'} message={searchQuery ? 'Try a different search.' : 'Tap "+" to add a batch!'} icon={searchQuery ? "magnify-close" : "seed-outline"} /> );
  }, [isLoadingData, filteredAndSortedBatches, searchQuery, colors]); // Add colors


  // --- Main Render ---
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <FlatList
            data={filteredAndSortedBatches}
            renderItem={renderBatchItem}
            keyExtractor={(item) => item.id.toString()}
            ListHeaderComponent={ListHeader}
            ListEmptyComponent={ListEmptyOrLoadingComponent}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            refreshControl={ <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> }
            initialNumToRender={7} maxToRenderPerBatch={10} windowSize={11}
        />

        {/* Floating Action Button (FAB) */}
        <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.shadow }]} onPress={handleAddNewBatch} activeOpacity={0.8}>
            <MaterialCommunityIcons name="plus" size={30} color={colors.white} />
        </TouchableOpacity>

        {/* Sort Options Modal */}
        <Modal
            animationType="fade" transparent={true} visible={isSortModalVisible}
            onRequestClose={closeSortModal} >
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeSortModal}>
                {/* Prevent modal content itself from closing modal on tap */}
                <TouchableOpacity style={[styles.modalContent, { backgroundColor: colors.cardBackground }]} activeOpacity={1}>
                    <Text style={[styles.modalTitle, { color: colors.text }]}>Sort Batches By</Text>
                    {SORT_OPTIONS.map((option) => (
                        <TouchableOpacity key={option.key} style={[styles.modalOption, { borderBottomColor: colors.lightGray }]} onPress={() => handleSelectSort(option.key)} >
                            <View style={styles.modalOptionContent}>
                                <MaterialCommunityIcons name={option.icon} size={22} color={sortCriteria === option.key ? colors.primary : colors.textSecondary} style={styles.modalOptionIcon} />
                                <Text style={[styles.modalOptionText, { color: sortCriteria === option.key ? colors.primary : colors.text }]}> {String(option.label || '')} </Text>
                            </View>
                             {sortCriteria === option.key && ( <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} /> )}
                        </TouchableOpacity>
                    ))}
                     <AppButton title="Close" onPress={closeSortModal} color="secondary" variant="outline" style={styles.modalCloseButton} />
                 </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    </SafeAreaView>
  );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  headerContentContainer: { // Container for elements above the list
    paddingTop: SIZES.base,
    marginBottom: SIZES.padding * 0.5, // Space before list starts
  },
  searchBarContainer: {
      flexDirection: 'row', alignItems: 'center', borderRadius: SIZES.radius * 1.5,
      marginHorizontal: SIZES.padding,
      marginBottom: SIZES.padding * 1.5,
      paddingHorizontal: SIZES.padding, borderWidth: 1.5,
      minHeight: 50,
      elevation: 2, shadowOpacity: 0.08, shadowOffset: {width: 0, height: 2}, shadowRadius: 3,
  },
  searchIcon: { marginRight: SIZES.padding * 0.5 },
  searchInput: { flex: 1, ...FONTS.body1, paddingVertical: Platform.OS === 'ios' ? SIZES.padding * 0.7 : SIZES.padding * 0.6 },
  tipCardContainer: {
      borderRadius: SIZES.radius, paddingVertical: SIZES.padding, paddingHorizontal: SIZES.padding,
      flexDirection: 'row', alignItems: 'center', borderWidth: 1.5,
      marginHorizontal: SIZES.padding,
      marginBottom: SIZES.padding * 1.5,
      elevation: 3, shadowOpacity: 0.1, shadowOffset: {width: 0, height: 2}, shadowRadius: 4,
  },
  tipIcon: { marginRight: SIZES.padding },
  tipTextContainer: { flex: 1 },
  tipTitle: { ...FONTS.body2, fontWeight: 'bold', },
  tipText: { ...FONTS.body1, lineHeight: 20, fontSize: 13.5 }, // Slightly larger tip text
  listHeaderRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: SIZES.padding, marginBottom: SIZES.padding,
      marginTop: SIZES.padding * 0.5, // Add space above title row if tip is present
  },
  listHeaderTitle: { ...FONTS.h2, fontWeight: 'bold', },
  sortButtonContainer: {
      flexDirection: 'row', alignItems: 'center', paddingVertical: SIZES.base * 0.8,
      paddingHorizontal: SIZES.padding, borderRadius: SIZES.radius * 0.8, borderWidth: 1.5,
      elevation: 1, shadowOpacity: 0.05, shadowOffset: {width: 0, height: 1}, shadowRadius: 2,
  },
  sortButtonText: { ...FONTS.body2, fontWeight: '600', marginLeft: SIZES.base * 0.5, fontSize: 13 },
  listContainer: { paddingHorizontal: SIZES.padding, paddingBottom: 120, flexGrow: 1 },
  listLoadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SIZES.paddingLarge, minHeight: 300, },
  loadingText: { marginTop: SIZES.padding },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SIZES.padding, paddingBottom: SIZES.paddingLarge, marginTop: SIZES.padding * 2, minHeight: 250, },
  emptyIcon: { marginBottom: SIZES.padding, opacity: 0.6, },
  emptyText: { ...FONTS.h3, textAlign: 'center', marginBottom: SIZES.base, fontWeight: '600' },
  emptySubText: { ...FONTS.body1, textAlign: 'center', maxWidth: '85%', lineHeight: 22, opacity: 0.8 },
  fab: { position: 'absolute', margin: SIZES.padding, right: SIZES.padding, bottom: SIZES.padding, width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 8, },
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: SIZES.paddingLarge },
  modalContent: { width: '100%', maxWidth: 400, borderRadius: SIZES.radius * 1.2, paddingVertical: SIZES.padding * 0.5, paddingTop: SIZES.padding * 1.5, elevation: 10, shadowOpacity: 0.2, shadowRadius: 10 },
  modalTitle: { ...FONTS.h3, fontWeight: 'bold', marginBottom: SIZES.padding, paddingHorizontal: SIZES.padding, textAlign: 'center' },
  modalOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SIZES.padding * 1.2, paddingHorizontal: SIZES.padding, borderBottomWidth: 1, },
  modalOptionContent: { flexDirection: 'row', alignItems: 'center', flex: 1 }, // Group icon and text
  modalOptionIcon: { marginRight: SIZES.padding, width: 24, opacity: 0.9 },
  modalOptionText: { ...FONTS.body1, flex: 1, fontWeight: '500'},
  modalCloseButton: { margin: SIZES.padding, marginTop: SIZES.padding * 1.5 }, // Add margin around close button
});

export default HomeScreen;