// screens/HomeScreen.js
// ... other imports ...
import { useAppContext } from '../contexts/AppContext';
import LoadingOverlay from '../components/LoadingOverlay'; // Re-introduce if needed for intra-screen loading

const HomeScreen = ({ navigation }) => {
    // Get isLoading state specific to AppContext data fetching
    const { batches, streakData, isLoading } = useAppContext();
    // ... rest of state (dailyTip, isLoadingTip) ...

    // ... useEffect for daily tip ...
    // ... useMemo for sortedBatches ...
    // ... renderStreak, renderEmptyState, handleAddNewBatch ...

    // *** Add Loading Check ***
    // This handles loading state *after* the initial Auth check in App.js
    // Useful if data needs to be refetched within AppContext
    if (isLoading && batches.length === 0) { // Show overlay only if loading AND no batches are shown yet
         return <LoadingOverlay visible={true} text="Loading your garden..." />;
         // Or return a simpler inline ActivityIndicator:
         // return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Potentially show a smaller indicator if isLoading is true but batches exist? */}
            {/* {isLoading && <ActivityIndicator style={styles.inlineLoader} color={COLORS.primary} />} */}
            <ScrollView /* ... */ >
                {/* ... rest of the JSX ... */}
            </ScrollView>
            <View style={styles.addButtonContainer}>
                 {/* ... Add Button ... */}
            </View>
        </SafeAreaView>
    );
};

// Add styles for loading if needed:
const styles = StyleSheet.create({
    // ... other styles ...
    loadingContainer: { // Optional: For full screen indicator
        flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background
    },
    // inlineLoader: { // Optional: For small indicator when reloading
    //     position: 'absolute', top: SIZES.padding, alignSelf: 'center', zIndex: 10
    // }
});
// ... rest of the styles ...

export default HomeScreen;