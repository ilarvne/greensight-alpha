// screens/BatchDetailScreen.js
import React, { useMemo, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Image,
  Platform,
  RefreshControl,
  Alert,
  TouchableOpacity,
  SafeAreaView // Ensure SafeAreaView is used
} from "react-native";
import { LineChart } from "react-native-chart-kit";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppContext } from "../contexts/AppContext";
import ObservationCard from "../components/ObservationCard"; // Use latest refined version
import AppButton from "../components/AppButton";
import { useTheme } from "../contexts/ThemeContext";
import { FONTS, SIZES } from "../utils/theme";
import { formatDate, getDaysSinceSown } from "../utils/helpers";
import { ObservationSkeleton } from '../components/SkeletonPlaceholder';

const screenWidth = Dimensions.get("window").width;
const CHART_HORIZONTAL_PADDING = SIZES.padding * 1.5; // Padding inside the chart card

// --- Reusable Info Card (Defined Outside) ---
// Added slightly more pronounced shadow/border
const InfoCard = ({ children, colors, style, title, titleStyle, contentStyle }) => (
    <View style={[styles.infoCard, { backgroundColor: colors.cardBackground, borderColor: colors.lightGray + '60', shadowColor: colors.shadow }, style]}>
         {title && (
            <Text style={[styles.infoCardTitle, { color: colors.text, borderBottomColor: colors.lightGray + '80' }, titleStyle]}>
                {/* Ensure title is a string */}
                {String(title || '')}
            </Text>
         )}
        <View style={[styles.infoCardContent, contentStyle]}>
            {/* Ensure children are valid React nodes */}
            {children || null}
        </View>
    </View>
);

// --- Reusable Filter/Sort Button (Defined Outside) ---
const FilterSortButton = ({ onPress, label, icon, isActive, first, last, colors }) => (
    <TouchableOpacity
        style={[
            styles.filterSortButton, { backgroundColor: isActive ? colors.primaryLight : colors.inputBackground, borderColor: isActive ? colors.primaryDark : colors.inputBorder },
            first && styles.filterSortButtonFirst, last && styles.filterSortButtonLast,
        ]}
        onPress={onPress} activeOpacity={0.7} >
        {icon && <MaterialCommunityIcons name={icon} size={16} color={isActive ? colors.primaryDark : colors.textSecondary} style={styles.filterSortIcon} />}
        {/* Ensure label is always rendered within Text */}
        <Text style={[ styles.filterSortText, { color: isActive ? colors.primaryDark : colors.textSecondary } ]}>
            {String(label || '')}
        </Text>
    </TouchableOpacity>
);

// --- Reusable Detail Row (Defined Outside, More Robust) ---
const DetailDisplayRow = ({ icon, label, value, valueColor, iconColor, colors, key }) => {
    // Ensure value is explicitly checked and handled for rendering
    const displayValue = (value !== null && value !== undefined && String(value).trim() !== '') ? String(value) : '--';
    // Ensure label is handled
    const displayLabel = label ? `${label}: ` : '';

    // Don't render if both label and value are essentially empty (only icon would show)
    if (!label && displayValue === '--') return null;

    return (
        <View style={styles.detailRow} key={key}>
            {icon ? <MaterialCommunityIcons name={icon} size={18} color={iconColor || colors.textSecondary} style={styles.detailIcon} /> : <View style={styles.detailIconPlaceholder} />}
            <View style={styles.detailTextContainer}>
                 {/* Combined Text for better wrapping; render label conditionally */}
                 <Text style={[styles.detailTextCombined, { color: valueColor || colors.textSecondary }]} selectable={true}>
                    {label && <Text style={styles.detailTextLabel}>{displayLabel}</Text>}
                    {/* Render value, ensuring it's a string */}
                    {displayValue}
                </Text>
            </View>
        </View>
    );
};


// --- Main Component ---
const BatchDetailScreen = ({ route, navigation }) => {
  const { batchId } = route.params;
  const { colors } = useTheme(); // Get colors via hook inside component
  const {
    getBatchById, isLoadingData: isLoadingContext, fetchObservationsForBatch,
    refreshData: refreshAppContextData, /* fetchSensorReadings */
  } = useAppContext();

  // --- State ---
  const [loadingObservations, setLoadingObservations] = useState(false);
  const [loadingSensors, setLoadingSensors] = useState(false); // Initialize false
  const [refreshing, setRefreshing] = useState(false);
  const [sensorData, setSensorData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterType, setFilterType] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');

  // --- Memoized Data ---
  const batch = useMemo(() => getBatchById(batchId), [getBatchById, batchId]);
  const rawObservations = useMemo(() => batch?.observations || [], [batch?.observations]);
  const filteredAndSortedObservations = useMemo(() => {
      let processedObservations = Array.isArray(rawObservations) ? [...rawObservations] : [];
      if (filterType === 'photo') processedObservations = processedObservations.filter(obs => !!obs.photoUri);
      else if (filterType === 'height') processedObservations = processedObservations.filter(obs => obs.height !== null && typeof obs.height === 'number');
      processedObservations.sort((a, b) => (sortOrder === 'newest' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date)));
      return processedObservations;
  }, [rawObservations, filterType, sortOrder]);
  const chartData = useMemo(() => {
    if (!Array.isArray(rawObservations) || rawObservations.length === 0) return null;
    const validObservations = rawObservations.filter(obs => obs.height !== null && typeof obs.height === 'number' && obs.height >= 0).sort((a, b) => new Date(a.date) - new Date(b.date));
    const dataPointsWithHeight = validObservations.filter(obs => obs.height > 0);
    if (dataPointsWithHeight.length < 2) return null;
    const labels = validObservations.map((obs) => formatDate(obs.date, "M/d"));
    const dataPoints = validObservations.map((obs) => obs.height);
    const maxLabels = 6; const skipInterval = labels.length > maxLabels ? Math.ceil(labels.length / maxLabels) : 1;
    const filteredLabels = labels.filter((_, i) => i % skipInterval === 0);
    return { labels: filteredLabels, datasets: [{ data: dataPoints, color: (opacity = 1) => colors.primaryDark, strokeWidth: 2.5, withDots: dataPoints.length < 15 }], };
  }, [rawObservations, colors.primaryDark]);

  // --- Effects ---
  useEffect(() => {
      // Set Navigation Title
      if (batch?.name) navigation.setOptions({ title: batch.name });
      else if (!isLoadingContext) navigation.setOptions({ title: "Batch Not Found" });
      else navigation.setOptions({ title: "Loading..." });
  }, [batch?.name, isLoadingContext, navigation]);

  const loadObservations = useCallback(async () => {
    const currentBatchInContext = getBatchById(batchId);
    if (!batchId || !fetchObservationsForBatch || (currentBatchInContext?.observations && currentBatchInContext.observations.length > 0)) { setLoadingObservations(false); return; }
    setLoadingObservations(true);
    try { await fetchObservationsForBatch(batchId); } catch (err) { console.error("BatchDetailScreen: Failed load observations:", err); Alert.alert("Error", "Could not load observation details."); } finally { setLoadingObservations(false); }
  }, [batchId, fetchObservationsForBatch, getBatchById]);

  const loadSensorData = useCallback(async () => {
     if (!batchId) return;
     setLoadingSensors(true); // Set loading TRUE before fetch
     try {
         await new Promise(resolve => setTimeout(resolve, 1200)); // Simulate fetch
         const data = { air_temperature: 23.8, air_humidity: 45.1, water_temperature: 21.5, light_level: 780 }; // Example data
         // const data = null; // Example: No data
         setSensorData(data);
     } catch (err) { console.error("BatchDetailScreen: Failed load sensor data:", err); setSensorData(null); }
     finally { setLoadingSensors(false); } // Set loading FALSE after fetch/error
  }, [batchId]);

  // Initial loads effect
  useEffect(() => { if (batchId) { loadObservations(); loadSensorData(); } }, [batchId]);

  // Refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (refreshAppContextData) await refreshAppContextData();
      if (batchId) {
         if (fetchObservationsForBatch) await fetchObservationsForBatch(batchId); // Re-fetch specific batch obs
         await loadSensorData(); // Re-fetch sensors
      }
    } catch (error) { console.error("BatchDetailScreen: Error during refresh:", error); Alert.alert("Refresh Failed", "Could not refresh data."); }
    finally { setRefreshing(false); }
  }, [batchId, refreshAppContextData, fetchObservationsForBatch, loadSensorData]); // Add all dependencies

  // --- Render Helper Functions ---
  const renderEmptyState = (title, message, icon = "information-outline") => (
     <InfoCard colors={colors} style={[styles.fullWidthCard, styles.emptyContentContainer]}>
        <MaterialCommunityIcons name={icon} size={44} color={colors.gray} style={styles.emptyIcon} />
        {/* Ensure title and message are wrapped */}
        <Text style={[styles.noDataText, { color: colors.textSecondary }]}>{String(title || '')}</Text>
        {message && <Text style={[styles.noDataSubText, { color: colors.textSecondary }]}>{String(message || '')}</Text>}
     </InfoCard>
  );

  const renderSensorDataContent = () => {
    if (loadingSensors) { return ( <View style={styles.sensorPlaceholder}><ActivityIndicator color={colors.primary} /><Text style={[styles.sensorStatusText, { color: colors.textSecondary, marginTop: SIZES.base }]}>Loading status...</Text></View> ); }
    if (!sensorData) { return renderEmptyState("No Sensor Data", "Connect sensor or check connection.", "access-point-network-off"); }
    return (
      <View style={styles.sensorGrid}>
         {/* Sensor Item Example (Repeat for others) - Explicit String Check */}
         <View style={styles.sensorItem}>
            <MaterialCommunityIcons name="thermometer" size={28} color={colors.accentDark} style={styles.sensorItemIcon} />
            <Text style={[styles.sensorValue, { color: colors.text }]}>
                {/* Explicitly check and format */}
                {(sensorData.air_temperature !== null && sensorData.air_temperature !== undefined) ? `${sensorData.air_temperature.toFixed(1)}` : '--'}
                {/* Render unit only if value exists */}
                {(sensorData.air_temperature !== null && sensorData.air_temperature !== undefined) && <Text style={styles.sensorUnit}>°C</Text>}
            </Text>
            <Text style={[styles.sensorLabel, { color: colors.textSecondary }]}>Air Temp</Text>
         </View>
         <View style={styles.sensorItem}>
            <MaterialCommunityIcons name="water-percent" size={28} color={colors.accentDark} style={styles.sensorItemIcon} />
             <Text style={[styles.sensorValue, { color: colors.text }]}>
                 {(sensorData.air_humidity !== null && sensorData.air_humidity !== undefined) ? `${sensorData.air_humidity.toFixed(1)}` : '--'}
                 {(sensorData.air_humidity !== null && sensorData.air_humidity !== undefined) && <Text style={styles.sensorUnit}>%</Text>}
             </Text>
            <Text style={[styles.sensorLabel, { color: colors.textSecondary }]}>Air Humidity</Text>
         </View>
          <View style={styles.sensorItem}>
            <MaterialCommunityIcons name="water-thermometer" size={28} color={colors.accentDark} style={styles.sensorItemIcon} />
             <Text style={[styles.sensorValue, { color: colors.text }]}>
                 {(sensorData.water_temperature !== null && sensorData.water_temperature !== undefined) ? `${sensorData.water_temperature.toFixed(1)}` : '--'}
                 {(sensorData.water_temperature !== null && sensorData.water_temperature !== undefined) && <Text style={styles.sensorUnit}>°C</Text>}
             </Text>
            <Text style={[styles.sensorLabel, { color: colors.textSecondary }]}>Water Temp</Text>
         </View>
         <View style={styles.sensorItem}>
            <MaterialCommunityIcons name="lightbulb-on-outline" size={28} color={colors.accentDark} style={styles.sensorItemIcon} />
            <Text style={[styles.sensorValue, { color: colors.text }]}>
                {(sensorData.light_level !== null && sensorData.light_level !== undefined) ? `${sensorData.light_level.toFixed(0)}` : '--'}
                {(sensorData.light_level !== null && sensorData.light_level !== undefined) && <Text style={styles.sensorUnit}> lux</Text>}
            </Text>
            <Text style={[styles.sensorLabel, { color: colors.textSecondary }]}>Light Level</Text>
         </View>
      </View>
    );
  };

  // --- Tab Content Rendering ---
  const renderTabContent = () => {
      switch (activeTab) {
          case 'overview':
              if (!batch) return null;
              const days = getDaysSinceSown(batch.sowDate);
              const daysRemaining = batch.estimatedHarvestDays ? batch.estimatedHarvestDays - days : null;
              let harvestValue = batch.estimatedHarvestDays ? `Day ${batch.estimatedHarvestDays}` : '--';
              let harvestIconColor = batch.estimatedHarvestDays ? colors.secondary : colors.gray;
              let harvestValueColor = colors.textSecondary;
              let harvestIcon = batch.estimatedHarvestDays ? "calendar-check-outline" : "calendar-question";
              if (daysRemaining !== null && daysRemaining >= 0) { harvestValue = `~${daysRemaining}d left (Day ${batch.estimatedHarvestDays})`; harvestIconColor = colors.secondary; harvestValueColor = colors.textSecondary; harvestIcon="calendar-clock-outline"; }
              else if (daysRemaining !== null && daysRemaining < 0) { harvestValue = `Ready (Day ${batch.estimatedHarvestDays})`; harvestIconColor = colors.primaryDark; harvestValueColor = colors.primaryDark; harvestIcon="check-circle-outline"; }
              const batchName = batch.name || '';
              const batchComments = batch.comments || '';
              return (
                  <View style={styles.tabContentContainer}>
                       <InfoCard colors={colors} style={styles.fullWidthCard}>
                            <View style={styles.overviewHeader}>
                                {batch.imageUrl ? ( <Image source={{ uri: batch.imageUrl }} style={styles.batchOverviewImage} /> )
                                 : ( <View style={[styles.batchOverviewImagePlaceholder, {backgroundColor: colors.primaryLight + '60'}]}><MaterialCommunityIcons name="sprout" size={35} color={colors.primary} /></View> )}
                                <Text style={[styles.batchNameOverview, { color: colors.text }]}>{batchName}</Text>
                            </View>
                           <View style={styles.headerDetailsContainer}>
                                <DetailDisplayRow colors={colors} icon="calendar-arrow-right" label="Sown" value={`${formatDate(batch.sowDate)} (${days} days ago)`} valueColor={colors.textSecondary} iconColor={colors.primary}/>
                                {/* Ensure harvestValue is handled by DetailDisplayRow */}
                                <DetailDisplayRow colors={colors} icon={harvestIcon} label="Est. Harvest" value={harvestValue} valueColor={harvestValueColor} iconColor={harvestIconColor} />
                               {batchComments ? ( <DetailDisplayRow colors={colors} icon="note-text-outline" label="Notes" value={batchComments} valueColor={colors.textSecondary} iconColor={colors.primary} /> ) : null}
                           </View>
                       </InfoCard>
                       <InfoCard title="System Status" colors={colors} style={styles.fullWidthCard}>
                          {renderSensorDataContent()}
                       </InfoCard>
                  </View>
              );
          case 'chart':
                return (
                   <View style={styles.tabContentContainer}>
                       {chartData ? (
                            <InfoCard title="Height Over Time (cm)" colors={colors} style={styles.fullWidthCard}>
                                <LineChart
                                    data={chartData}
                                    width={screenWidth - (SIZES.padding * 2) - CHART_HORIZONTAL_PADDING}
                                    height={240}
                                    yAxisSuffix=" cm"
                                    yAxisInterval={1}
                                    chartConfig={{ // Use a consistent config object
                                        backgroundColor: colors.cardBackground, backgroundGradientFrom: colors.cardBackground, backgroundGradientTo: colors.cardBackground, decimalPlaces: 1,
                                        color: (opacity = 1) => colors.primary + `${Math.round(opacity * 255).toString(16).padStart(2, '0')}`, labelColor: (opacity = 1) => colors.textSecondary,
                                        style: { borderRadius: SIZES.radius }, propsForDots: { r: "5", strokeWidth: "1", stroke: colors.primaryDark }, propsForBackgroundLines: { strokeDasharray: "", strokeWidth: 0.5, stroke: colors.lightGray + '60' }
                                    }}
                                    bezier style={styles.chartStyle} verticalLabelRotation={0} fromZero={true}
                                />
                           </InfoCard>
                       ) : ( renderEmptyState("Not Enough Height Data", "Log 2+ observations with height > 0.", "chart-line") )}
                   </View>
                );
          case 'log':
              return (
                  <View style={styles.tabContentContainer}>
                       {/* Filter and Sort Controls - Stacked Vertically */}
                       <View style={styles.filterSortContainer}>
                           <View style={styles.filterSortGroup}>
                               <Text style={[styles.filterSortLabel, {color: colors.textSecondary}]}>Filter:</Text>
                               <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterSortButtonsScroll}>
                                   <FilterSortButton colors={colors} label="All" onPress={() => setFilterType('all')} isActive={filterType === 'all'} first />
                                   <FilterSortButton colors={colors} label="Photos" icon="image-outline" onPress={() => setFilterType('photo')} isActive={filterType === 'photo'} />
                                   <FilterSortButton colors={colors} label="Height" icon="ruler" onPress={() => setFilterType('height')} isActive={filterType === 'height'} last />
                               </ScrollView>
                           </View>
                           <View style={styles.filterSortGroup}>
                               <Text style={[styles.filterSortLabel, {color: colors.textSecondary}]}>Sort:</Text>
                               <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterSortButtonsScroll}>
                                   <FilterSortButton colors={colors} label="Newest" icon="sort-calendar-descending" onPress={() => setSortOrder('newest')} isActive={sortOrder === 'newest'} first />
                                   <FilterSortButton colors={colors} label="Oldest" icon="sort-calendar-ascending" onPress={() => setSortOrder('oldest')} isActive={sortOrder === 'oldest'} last />
                               </ScrollView>
                           </View>
                       </View>

                       {/* Observation List Rendering - FIXED Check */}
                       {/* Check filtered list existence *before* accessing length */}
                       {loadingObservations && (!filteredAndSortedObservations || filteredAndSortedObservations.length === 0) ? (
                            <View style={styles.observationListContainer}>
                                <ObservationSkeleton />
                                <ObservationSkeleton />
                            </View>
                        ) : !loadingObservations && (!filteredAndSortedObservations || filteredAndSortedObservations.length === 0) ? (
                             renderEmptyState("No Observations Found", filterType !== 'all' ? `No observations match the current filter.` : "Log your first observation below!", "text-box-search-outline")
                        ) : (
                            // Only map if filteredAndSortedObservations is an array with items
                            Array.isArray(filteredAndSortedObservations) && filteredAndSortedObservations.length > 0 ? (
                                <View style={styles.observationListContainer}>
                                    {filteredAndSortedObservations.map((obs) => (
                                       <ObservationCard key={obs.id} observation={obs} />
                                    ))}
                                </View>
                             ) : (
                                // Fallback safety net - should be covered by empty state above
                                <View><Text style={{color: colors.textSecondary}}>No observations to display.</Text></View>
                             )
                        )}
                  </View>
              );
          default: return null; // Default case returns null explicitly
      }
  };

  // --- Loading / Error States ---
  if (isLoadingContext && !batch) { return ( <View style={[ styles.loadingContainer, { backgroundColor: colors.background } ]}><ActivityIndicator size="large" color={colors.primary} /><Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading Batch...</Text></View> ); }
  if (!batch) { return ( <View style={[ styles.loadingContainer, { backgroundColor: colors.background } ]}><MaterialCommunityIcons name="alert-circle-outline" size={60} color={colors.danger} /><Text style={[styles.errorText, { color: colors.danger }]}>Batch Not Found</Text><Text style={[styles.errorSubText, { color: colors.textSecondary }]}>This batch may no longer exist.</Text><AppButton title="Go Back" onPress={() => navigation.goBack()} color="secondary" style={{marginTop: SIZES.paddingLarge}}/></View> ); }

  // --- Main Screen Render ---
  return (
    <SafeAreaView style={[styles.flexContainer, { backgroundColor: colors.background }]}>
      {/* Tab Bar */}
      <View style={[styles.tabBarContainer, { backgroundColor: colors.cardBackground, borderBottomColor: colors.lightGray + '80' }]}>
          <TouchableOpacity style={[styles.tabButton, activeTab === 'overview' && styles.activeTabButton, { borderBottomColor: activeTab === 'overview' ? colors.primary : 'transparent'}]} onPress={() => setActiveTab('overview')}>
               <MaterialCommunityIcons name="information-outline" size={20} color={activeTab === 'overview' ? colors.primary : colors.textSecondary} style={styles.tabIcon}/>
               <Text style={[styles.tabText, { color: activeTab === 'overview' ? colors.primary : colors.textSecondary }]}>Overview</Text>
          </TouchableOpacity>
           <TouchableOpacity style={[styles.tabButton, activeTab === 'chart' && styles.activeTabButton, { borderBottomColor: activeTab === 'chart' ? colors.primary : 'transparent'}]} onPress={() => setActiveTab('chart')}>
               <MaterialCommunityIcons name="chart-line" size={20} color={activeTab === 'chart' ? colors.primary : colors.textSecondary} style={styles.tabIcon}/>
               <Text style={[styles.tabText, { color: activeTab === 'chart' ? colors.primary : colors.textSecondary }]}>Chart</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tabButton, activeTab === 'log' && styles.activeTabButton, { borderBottomColor: activeTab === 'log' ? colors.primary : 'transparent'}]} onPress={() => setActiveTab('log')}>
               <MaterialCommunityIcons name="clipboard-list-outline" size={20} color={activeTab === 'log' ? colors.primary : colors.textSecondary} style={styles.tabIcon}/>
               <Text style={[styles.tabText, { color: activeTab === 'log' ? colors.primary : colors.textSecondary }]}>Log</Text>
          </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" refreshControl={ <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary}/> } >
          {renderTabContent() || null}
          <View style={{ height: 120 }} />
      </ScrollView>

      <View style={[styles.addButtonContainer, { backgroundColor: colors.background + 'F0', borderTopColor: colors.lightGray }]}>
            <AppButton title="Add Observation" onPress={() => batch?.id && navigation.navigate('AddObservationModal', { batchId: batch.id })} style={styles.addObsButton} icon={<MaterialCommunityIcons name="plus-circle-outline" size={22} color={colors.buttonSecondaryText || colors.white} />} color="secondary" disabled={!batch?.id}/>
       </View>
    </SafeAreaView>
  );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
  flexContainer: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 140, flexGrow: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SIZES.paddingLarge },
  loadingText: { ...FONTS.body1, marginTop: SIZES.padding },
  errorText: { ...FONTS.h3, textAlign: 'center', marginTop: SIZES.padding, marginBottom: SIZES.base },
  errorSubText: { ...FONTS.body2, textAlign: 'center', marginBottom: SIZES.paddingLarge },
  // Tab Styles
  tabBarContainer: { flexDirection: 'row', borderBottomWidth: 1, elevation: 2, shadowOpacity: 0.06, shadowOffset: {width: 0, height: 1}, shadowRadius: 3},
  tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SIZES.padding, borderBottomWidth: 3, paddingHorizontal: SIZES.base },
  activeTabButton: { /* Can add subtle background if needed */ },
  tabIcon: { marginRight: SIZES.base * 0.8 },
  tabText: { ...FONTS.body1, fontWeight: '600', },
  tabContentContainer: { padding: SIZES.padding },
  // Card Styles
  infoCard: { borderRadius: SIZES.radius, borderWidth: 1, marginBottom: SIZES.padding * 1.5, shadowColor: '#444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5, overflow: 'hidden' },
  infoCardTitle: { ...FONTS.h3, fontWeight: '600', paddingHorizontal: SIZES.padding, paddingTop: SIZES.padding, paddingBottom: SIZES.padding * 0.6, borderBottomWidth: 1 },
  infoCardContent: { padding: SIZES.padding },
  fullWidthCard: { marginBottom: SIZES.padding * 1.5 },
  // Overview Tab Styles
  overviewHeader: { flexDirection: 'row', alignItems: 'center', paddingBottom: SIZES.padding },
  batchOverviewImage: { width: 80, height: 80, borderRadius: SIZES.radius, marginRight: SIZES.padding },
  batchOverviewImagePlaceholder: { width: 80, height: 80, borderRadius: SIZES.radius, marginRight: SIZES.padding, justifyContent: 'center', alignItems: 'center'},
  batchNameOverview: { ...FONTS.h1, fontWeight: 'bold', flexShrink: 1, lineHeight: FONTS.h1.fontSize * 1.1 },
  headerDetailsContainer: { paddingTop: SIZES.base },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SIZES.padding * 0.9, },
  detailIcon: { marginRight: SIZES.padding * 0.7, opacity: 0.9, paddingTop: 4 },
  detailIconPlaceholder: { width: 18 + SIZES.padding * 0.7 }, // Match width for alignment
  detailTextContainer: { flex: 1, flexDirection: 'row', flexWrap: 'wrap'}, // Allows label+value to wrap together
  detailTextLabel: { ...FONTS.body1, lineHeight: 24, fontWeight: '600'},
  detailTextValue: { ...FONTS.body1, flexShrink: 1, lineHeight: 24, opacity: 0.9 },
  detailTextCombined: { ...FONTS.body1, flexShrink: 1, lineHeight: 24, }, // Combined style
  // Sensor Styles
  sensorPlaceholder: { minHeight: 120, justifyContent: 'center', alignItems: 'center', opacity: 0.8, padding: SIZES.padding },
  sensorStatusText: { ...FONTS.body1, textAlign: 'center' },
  sensorGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', alignItems: 'flex-start', paddingTop: SIZES.base },
  sensorItem: { alignItems: 'center', width: '48%', marginBottom: SIZES.padding * 1.8 },
  sensorItemIcon: { marginBottom: SIZES.base * 1.0 },
  sensorValue: { ...FONTS.h2, fontWeight: '600', marginTop: SIZES.base * 0.5, textAlign: 'center' },
  sensorUnit: { ...FONTS.body3, fontWeight: 'normal', marginLeft: 2, opacity: 0.8 },
  sensorLabel: { ...FONTS.body3, marginTop: SIZES.base * 0.8, opacity: 0.9, textAlign: 'center' },
  // Chart Styles
  chartStyle: { marginVertical: SIZES.base, borderRadius: SIZES.radius * 0.8 },
  emptyContentContainer: { alignItems: 'center', justifyContent: 'center', minHeight: 180, padding: SIZES.paddingLarge, opacity: 0.8, },
  emptyIcon: { marginBottom: SIZES.padding },
  noDataText: { ...FONTS.h4, textAlign: 'center', marginBottom: SIZES.base * 0.8, },
  noDataSubText: { ...FONTS.body2, textAlign: 'center', maxWidth: '90%', lineHeight: 18, },
  // Filter/Sort Styles
  filterSortContainer: { marginBottom: SIZES.padding * 1.5, }, // Stack groups vertically
  filterSortGroup: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.base * 1.5, },
  filterSortLabel: { ...FONTS.body3, fontWeight: '600', marginRight: SIZES.base, minWidth: 50, textAlign: 'right' },
  filterSortButtonsScroll: { flexGrow: 0 }, // Prevent taking full width
  filterSortButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: SIZES.base, paddingHorizontal: SIZES.padding * 0.8, borderWidth: 1.5, borderRightWidth: 0, }, // Slightly reduced padding
  filterSortButtonFirst: { borderTopLeftRadius: SIZES.radius * 0.6, borderBottomLeftRadius: SIZES.radius * 0.6, },
  filterSortButtonLast: { borderTopRightRadius: SIZES.radius * 0.6, borderBottomRightRadius: SIZES.radius * 0.6, borderRightWidth: 1.5, },
  filterSortIcon: { marginRight: SIZES.base * 0.5, opacity: 0.9, },
  filterSortText: { ...FONTS.body3, fontSize: 12, fontWeight: '600', },
  // Observation List Styles
  observationListContainer: { paddingTop: SIZES.base },
  // Add Button Styles
  addButtonContainer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: SIZES.padding, paddingTop: SIZES.padding, paddingBottom: Platform.OS === 'ios' ? SIZES.paddingLarge * 1.2 : SIZES.padding * 1.1, borderTopWidth: 1, },
  addObsButton: { },
});

export default BatchDetailScreen;