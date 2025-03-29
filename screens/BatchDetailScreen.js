// screens/BatchDetailScreen.js
import React, { useMemo, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    FlatList,
    Dimensions,
    ActivityIndicator,
    Image, // Keep Image import in case ObservationCard uses it internally
    Platform
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppContext } from '../contexts/AppContext';
import ObservationCard from '../components/ObservationCard'; // Uses styled component
import AppButton from '../components/AppButton'; // Uses styled component
import { COLORS, FONTS, SIZES } from '../utils/theme'; // Using the refined theme
import { formatDate, getDaysSinceSown } from '../utils/helpers';

// Get screen width for chart sizing
const screenWidth = Dimensions.get("window").width;

const BatchDetailScreen = ({ route, navigation }) => {
  // Get batchId from navigation parameters
  const { batchId } = route.params;
  // Get context data and loading state
  const { batches, isAppLoading } = useAppContext();

  // Derive the specific batch data from the context's batches array using useMemo.
  // This ensures the component updates if the 'batches' array changes in the context.
  const batch = useMemo(() => {
      if (!batches) return null; // Guard against batches being initially undefined
      return batches.find(b => b.id === batchId);
  }, [batches, batchId]); // Dependency array ensures recalculation only when needed

   // Effect to set the navigation header title dynamically once the batch data is available
   useEffect(() => {
      if (batch) {
        navigation.setOptions({ title: batch.name });
      } else {
          // Set a default title if the batch isn't found (e.g., after deletion)
          navigation.setOptions({ title: 'Batch Details' });
      }
   }, [batch, navigation]); // Dependencies: batch data and navigation object

   // Prepare data for the LineChart using useMemo for performance.
   // Recalculates only when the batch's observations change.
   const chartData = useMemo(() => {
        // Ensure batch and observations exist
        if (!batch || !batch.observations || batch.observations.length < 1) return null;

        // Filter for valid height data and sort chronologically (ascending for chart)
        const validObservations = batch.observations
            .filter(obs => obs.height !== null && obs.height !== undefined && typeof obs.height === 'number' && obs.height >= 0) // Allow 0 height
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        // Need at least two data points with height > 0 for a meaningful line chart
        const dataPointsWithHeight = validObservations.filter(obs => obs.height > 0);
        if (dataPointsWithHeight.length < 2) return null;

        // Create labels (e.g., '3/29') and data points (heights)
        const labels = validObservations.map(obs => formatDate(obs.date, 'M/d'));
        const dataPoints = validObservations.map(obs => obs.height);

        // Limit the number of labels shown on the X-axis for readability if there are many points
        const maxLabels = 6;
        const skipInterval = labels.length > maxLabels ? Math.ceil(labels.length / maxLabels) : 1;

        return {
            labels: labels.filter((_, i) => i % skipInterval === 0), // Show fewer labels if many data points
            datasets: [{
                data: dataPoints,
                color: (opacity = 1) => COLORS.primaryDark, // Use theme color for line
                strokeWidth: 2.5, // Slightly thicker line
                withDots: dataPoints.length < 15, // Show dots only if not too many points
            }],
            legend: ["Height (cm)"], // Optional: Chart legend
        };
    }, [batch]); // Dependency: Recalculate if batch data changes

   // --- Loading State ---
   // Show loading indicator while context is initializing
   if (isAppLoading) {
     return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading Details...</Text>
        </View>
     );
   }

   // --- Error State ---
   // Handle cases where the batch might not be found (e.g., deleted or invalid ID)
   if (!batch) {
      return (
          <View style={styles.loadingContainer}>
              <MaterialCommunityIcons name="alert-circle-outline" size={60} color={COLORS.danger} />
              <Text style={styles.errorText}>Batch Not Found</Text>
              <Text style={styles.errorSubText}>This batch may have been deleted or the ID is invalid.</Text>
              <AppButton title="Go Back" onPress={() => navigation.goBack()} color="danger"/>
          </View>
      );
   }

   // Calculate days since sown only if batch exists
   const days = getDaysSinceSown(batch.sowDate);

   // --- Render Helper for Empty Observation List ---
   const renderEmptyObservations = () => (
       <View style={styles.emptyObsContainer}>
           <MaterialCommunityIcons name="text-box-search-outline" size={60} color={COLORS.gray} style={{marginBottom: SIZES.padding}}/>
           <Text style={styles.noDataText}>No observations recorded yet.</Text>
           <Text style={styles.noDataSubText}>Tap 'Add Observation' below to log your first entry!</Text>
       </View>
   );

  // --- Main Component Render ---
  return (
    // Use a View as the outer container for better control over ScrollView and Button positioning
    <View style={styles.flexContainer}>
        <ScrollView
            style={styles.scrollView} // Allow ScrollView to take available space
            contentContainerStyle={styles.scrollContent} // Apply padding to content inside
            showsVerticalScrollIndicator={false} // Hide scroll bar visually
            keyboardShouldPersistTaps="handled" // Handle taps inside scroll view correctly
        >
            {/* --- Batch Header Information --- */}
            <View style={styles.headerInfo}>
                <Text style={styles.batchName}>{batch.name}</Text>
                {/* Detail Row for Sowing Date */}
                <View style={styles.detailRow}>
                    <MaterialCommunityIcons name="calendar-arrow-right" size={18} color={COLORS.primaryDark} style={styles.detailIcon}/>
                    <Text style={styles.detailText}>Sown: {formatDate(batch.sowDate)} ({days} days ago)</Text>
                </View>
                {/* Detail Row for Notes (Conditional) */}
                {batch.comments ? (
                    <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="note-text-outline" size={18} color={COLORS.primaryDark} style={styles.detailIcon}/>
                        <Text style={styles.detailText}>Notes: {batch.comments}</Text>
                    </View>
                ) : null}
            </View>

            {/* --- Growth Progress Section --- */}
            <View style={styles.sectionHeaderContainer}>
                <Text style={styles.sectionTitle}>Growth Progress</Text>
            </View>

            {/* --- Growth Chart or Empty State --- */}
            {chartData ? (
                <View style={styles.chartContainer}>
                <LineChart
                    data={chartData}
                    width={screenWidth - SIZES.padding * 2 - SIZES.base * 2} // Adjusted width for padding inside container
                    height={220}
                    yAxisSuffix=" cm"
                    yAxisInterval={1} // Adjust interval based on expected height range
                    chartConfig={{
                        backgroundColor: COLORS.white,
                        backgroundGradientFrom: COLORS.white,
                        backgroundGradientTo: COLORS.white,
                        decimalPlaces: 1, // Show one decimal place for height
                        color: (opacity = 1) => COLORS.primary + `${Math.round(opacity * 255).toString(16).padStart(2, '0')}`, // Primary color for grid lines
                        labelColor: (opacity = 1) => COLORS.textSecondary, // Gray for labels
                        style: { borderRadius: SIZES.radius * 0.8 },
                        propsForDots: { r: "5", strokeWidth: "1", stroke: COLORS.primaryDark }, // Dot styling
                        propsForBackgroundLines: { strokeDasharray: '', strokeWidth: 0.5, stroke: COLORS.lightGray }, // Subtle grid lines
                    }}
                    bezier // Use smooth curves
                    style={styles.chartStyle}
                    verticalLabelRotation={0} // Keep labels horizontal
                    // fromZero={true} // Ensure Y-axis starts at 0
                />
                </View>
            ) : (
                // Displayed when chartData is null (not enough data)
                <View style={styles.emptyChartContainer}>
                     <MaterialCommunityIcons name="chart-line-variant" size={40} color={COLORS.gray} style={{marginBottom: SIZES.base}}/>
                    <Text style={styles.noDataText}>Log Height Data</Text>
                     <Text style={styles.noDataSubText}>Need at least two entries with height > 0 to show the growth graph.</Text>
                </View>
            )}

            {/* --- Observation Log Section --- */}
             <View style={styles.sectionHeaderContainer}>
                <Text style={styles.sectionTitle}>Observation Log</Text>
            </View>

            {/* --- Observation List or Empty State --- */}
            {/* Render ObservationCard components using FlatList */}
            {batch.observations && batch.observations.length > 0 ? (
                // No need for FlatList if ScrollView manages scrolling; render directly or use non-scrollable FlatList
                // Using map for simplicity here as FlatList virtualization isn't crucial inside ScrollView
                <View>
                    {batch.observations.map(item => (
                         <ObservationCard key={item.id} observation={item} />
                    ))}
                </View>
                // Or use non-scrollable FlatList:
                // <FlatList
                //    data={batch.observations} // Data is already sorted desc in context
                //    keyExtractor={(item) => item.id}
                //    renderItem={({ item }) => <ObservationCard observation={item} />}
                //    scrollEnabled={false} // Disable FlatList scrolling
                //  />
            ) : (
                // Render the specific empty state component when no observations exist
                renderEmptyObservations()
            )}

             {/* Spacer view at the bottom of the scroll content to ensure space for the fixed button */}
            <View style={{ height: 120 }} />

        </ScrollView>

        {/* --- Add Observation Button (Fixed Position at Bottom) --- */}
        <View style={styles.addButtonContainer}>
            <AppButton
                title="Add Observation"
                // Navigate to the modal screen defined in App.js
                onPress={() => navigation.navigate('AddObservationModal', { batchId: batch.id })}
                style={styles.addObsButton} // Optional: Specific button styles
                icon={<MaterialCommunityIcons name="plus-circle-outline" size={22} color={COLORS.white} />}
                color="secondary" // Use secondary color for this action button
            />
        </View>
    </View>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  flexContainer: {
    flex: 1, // Ensure outer container takes full screen height
    backgroundColor: COLORS.background, // Set background color
  },
  scrollView: {
    flex: 1, // Allow ScrollView to grow within the container
  },
  scrollContent: {
      paddingHorizontal: SIZES.padding, // Apply horizontal padding to scrollable content
      paddingTop: SIZES.padding, // Add padding at the top
      paddingBottom: 140, // Ensure enough space below content for the fixed button
  },
  loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: COLORS.background,
      padding: SIZES.paddingLarge,
  },
  loadingText: {
      ...FONTS.body1,
      marginTop: SIZES.padding,
      color: COLORS.textSecondary,
  },
  errorText: {
      ...FONTS.h3,
      color: COLORS.danger,
      textAlign: 'center',
      marginTop: SIZES.padding,
      marginBottom: SIZES.base,
  },
   errorSubText: {
      ...FONTS.body2,
      color: COLORS.textSecondary,
      textAlign: 'center',
      marginBottom: SIZES.paddingLarge,
   },
  // Header Info Styles
  headerInfo: {
      backgroundColor: COLORS.primaryLight, // Use theme light color
      paddingVertical: SIZES.padding * 1.2,
      paddingHorizontal: SIZES.padding,
      borderRadius: SIZES.radius, // Apply rounding
      marginBottom: SIZES.paddingLarge, // More space below header
      borderWidth: 1, // Subtle border
      borderColor: COLORS.primary + '30', // Transparent primary border
  },
  batchName: {
      ...FONTS.h1,
      color: COLORS.primaryDark,
      marginBottom: SIZES.padding * 0.8,
      fontWeight: 'bold',
  },
  detailRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: SIZES.base * 1.2, // Slightly more space between rows
  },
  detailIcon: {
      marginRight: SIZES.padding * 0.6, // More space next to icon
      marginTop: Platform.OS === 'ios' ? 3 : 5, // Fine-tune icon vertical alignment
      color: COLORS.primaryDark,
      opacity: 0.9,
  },
  detailText: {
      ...FONTS.body1,
      color: COLORS.primaryDark,
      flexShrink: 1, // Allow text to wrap
      lineHeight: 23, // Improved readability
      opacity: 0.9,
  },
  // Section Header Styles
  sectionHeaderContainer: {
      marginTop: SIZES.padding * 0.5, // Reduced space above section header
      marginBottom: SIZES.padding, // Space below section header
      borderBottomWidth: 1.5, // Slightly thicker border
      borderBottomColor: COLORS.lightGray,
      paddingBottom: SIZES.base * 1.2, // Padding below text, above border
      flexDirection: 'row', // Allow potential icons next to title
      alignItems: 'center',
  },
  sectionTitle: {
    ...FONTS.h2, // Use H2 for section titles
    fontWeight: '600',
    color: COLORS.text,
    flex: 1, // Allow title to take available space
  },
  // Chart Styles
  chartContainer: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: SIZES.radius,
    paddingVertical: SIZES.padding * 0.8,
    paddingHorizontal: SIZES.base,
    marginBottom: SIZES.paddingLarge,
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
  },
   chartStyle: {
       marginVertical: SIZES.base,
       borderRadius: SIZES.radius * 0.8,
   },
   emptyChartContainer: {
       backgroundColor: COLORS.cardBackground,
       borderRadius: SIZES.radius,
       padding: SIZES.paddingLarge,
       marginBottom: SIZES.paddingLarge,
       alignItems: 'center',
       borderWidth: 1.5, // Make dashed border slightly thicker
       borderColor: COLORS.lightGray,
       borderStyle: 'dashed',
       opacity: 0.9,
   },
  // Empty Observation State Styles
  emptyObsContainer: {
      alignItems: 'center',
      paddingVertical: SIZES.paddingLarge * 1.5,
      paddingHorizontal: SIZES.padding,
      backgroundColor: COLORS.cardBackground + 'B3', // Semi-transparent background
      borderRadius: SIZES.radius,
      marginTop: SIZES.base,
      borderWidth: 1.5, // Match empty chart border
      borderColor: COLORS.lightGray,
      borderStyle: 'dashed',
  },
  noDataText: {
     ...FONTS.h4,
     color: COLORS.textSecondary,
     textAlign: 'center',
     marginBottom: SIZES.base * 0.8, // More space below main text
  },
  noDataSubText: {
    ...FONTS.body2,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: '90%',
    lineHeight: 18, // Improve readability
  },
  // Add Button Container Styles
  addButtonContainer: {
    position: 'absolute',
    bottom: 0, // Stick to bottom
    left: 0,
    right: 0,
    paddingHorizontal: SIZES.padding,
    paddingTop: SIZES.padding * 0.8, // Padding above button
    paddingBottom: Platform.OS === 'ios' ? SIZES.paddingLarge : SIZES.padding, // Safe area padding
    backgroundColor: COLORS.background + 'E6', // Semi-transparent background
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  addObsButton: {
      // Button styling primarily handled by AppButton component
      // Example override: Make it slightly less wide if needed
      // marginHorizontal: SIZES.padding,
  }
});

export default BatchDetailScreen;