// screens/AnalyticsScreen.js
// --- THIS IS A HARDCODED VISUAL MOCKUP/TEMPLATE v4 ---
// --- Contains NO real data fetching or logic ---
// --- All values, indicators (+/- %), colors, icons are HARDCODED examples ---
// --- Charts use SIMULATED data ---
// --- Uses pagingEnabled/snapToInterval for horizontal scroll views ---
// --- FIX: Added definition for chartCardWidth ---

import React, { useState, useMemo } from 'react';
import {
    View, Text, StyleSheet, ScrollView, SafeAreaView,
    Platform, Dimensions, TouchableOpacity
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LineChart } from "react-native-chart-kit";
import { useTheme } from '../contexts/ThemeContext';
import { FONTS, SIZES } from '../utils/theme';

const screenWidth = Dimensions.get("window").width;
// Calculate width for paging view aiming for ~2 cards per screen width
const H_PADDING_SENSORS = SIZES.padding; // Padding for the sensor scroll view container
const INTER_CARD_SPACING = SIZES.padding / 2;
const cardPageWidth = (screenWidth - H_PADDING_SENSORS * 2 - INTER_CARD_SPACING) / 2; // Width for sensor cards (2 per page)

// *** Define chartCardWidth - Width for chart cards (1 per page) ***
// Slightly less padding than main screen for chart scroll view
const H_PADDING_CHARTS = SIZES.padding / 2;
const chartCardWidth = screenWidth - H_PADDING_CHARTS * 2; // Chart card takes most of screen width

// --- Reusable Card Component ---
const InfoCard = ({ title, children, colors, style }) => (
    <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.lightGray + '50' }, style]}>
        <View style={styles.cardContent}>
            {title && <Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text>}
            {children}
        </View>
    </View>
);

// --- Reusable Sensor Display with HARDCODED Placeholders ---
const SensorDisplayCardItem = ({ label, value, unit, icon, colors, statusIcon, statusColor, statusText }) => {
    const displayValue = `${value}${unit || ''}`;
    const displayStatusIcon = statusIcon || 'minus';
    const displayStatusColor = statusColor || colors.textSecondary;
    const displayStatusText = statusText || '';

    return (
        <View style={styles.sensorCardItem}>
            <View style={styles.sensorHeader}>
                {icon && <MaterialCommunityIcons name={icon} size={16} color={colors.textSecondary} style={styles.sensorIcon}/>}
                <Text style={[styles.sensorLabel, { color: colors.textSecondary }]}>{label}</Text>
            </View>
            <Text style={[styles.sensorValue, { color: colors.text }]}>{displayValue}</Text>
            <View style={[styles.statusIndicator, { backgroundColor: displayStatusColor + '1A' }]}>
                 <MaterialCommunityIcons name={displayStatusIcon} size={14} color={displayStatusColor} />
                 <Text style={[styles.statusText, { color: displayStatusColor }]}>{displayStatusText}</Text>
            </View>
        </View>
    );
};

// --- Main Analytics Screen ---
const AnalyticsScreen = () => {
    const { colors } = useTheme();
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'details'

    // --- Hardcoded Example Values ---
    const exampleTimestamp = "Mar 30, 10:17:11";
    const latestData = { air_temperature: 24.3, air_humidity: 31.2, water_temperature: -127.0, light_level: 2.2, device: "both_devices", soil1: 8, soil2: 10, soil3: 9, soil4: 19, soil5: 100 };
    const exampleAvgSoil = ((latestData.soil1 + latestData.soil2 + latestData.soil3 + latestData.soil4 + latestData.soil5) / 5).toFixed(1);

    // --- Simulated Data for Charts ---
    const simulatedChartData = useMemo(() => ({
        labels: ["-6h", "-5h", "-4h", "-3h", "-2h", "-1h", "Now"],
        temp: [24.0, 24.1, 24.3, 24.4, 24.3, 24.2, 24.3],
        humidity: [30.5, 31.0, 31.1, 31.9, 31.2, 31.0, 31.2],
        soil: [15.2, 14.8, 15.0, 14.5, 15.1, 15.5, 15.0],
    }), []);

    // --- Chart Config ---
    const chartConfig = {
        backgroundColor: colors.cardBackground, backgroundGradientFrom: colors.cardBackground, backgroundGradientTo: colors.cardBackground, decimalPlaces: 1,
        color: (opacity = 1) => colors.primary + `${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
        labelColor: (opacity = 1) => colors.textSecondary, style: { borderRadius: SIZES.radius * 0.5 },
        propsForDots: { r: "3", strokeWidth: "1", stroke: colors.primaryDark },
        propsForBackgroundLines: { stroke: colors.lightGray + '30', strokeDasharray: "" }
    };

    // --- Render Logic for Tabs ---
    const renderContent = () => {
        if (activeTab === 'overview') {
            // --- Overview Tab Content ---
            return (
                 <>
                     {/* --- Horizontally Scrolling Sensor Cards (Snap ~2 per page) --- */}
                     <Text style={[styles.sectionHeader, { color: colors.text }]}>Current Overview</Text>
                     <ScrollView
                         horizontal={true}
                         // pagingEnabled={true} // Paging might be jerky with multiple items per screen
                         decelerationRate="fast"
                         snapToInterval={cardPageWidth * 2 + INTER_CARD_SPACING} // Snap interval for two cards + space
                         snapToAlignment="start" // Snap to the start of the interval
                         showsHorizontalScrollIndicator={false}
                         style={styles.horizontalScrollViewPager}
                         contentContainerStyle={[styles.pagerContentContainer, { paddingHorizontal: H_PADDING_SENSORS / 2 }]} // Use correct padding var
                     >
                          {/* Cards need explicit width now */}
                          <InfoCard title="Air Temp" colors={colors} style={[styles.horizontalCard, { width: cardPageWidth }]}>
                             <SensorDisplayCardItem value={latestData.air_temperature} unit="°C" icon="thermometer" colors={colors} statusIcon="check-circle-outline" statusColor={colors.primary} statusText="+0.1%" />
                         </InfoCard>
                         <InfoCard title="Humidity" colors={colors} style={[styles.horizontalCard, { width: cardPageWidth }]}>
                             <SensorDisplayCardItem value={latestData.air_humidity} unit="%" icon="water-percent" colors={colors} statusIcon="arrow-bottom-right" statusColor={colors.warning} statusText="-2.1%" />
                         </InfoCard>
                          <InfoCard title="Avg. Soil" colors={colors} style={[styles.horizontalCard, { width: cardPageWidth }]}>
                             <SensorDisplayCardItem value={exampleAvgSoil} unit="%" icon="sprout" colors={colors} statusIcon="arrow-bottom-right" statusColor={colors.danger} statusText="-8.0%" />
                         </InfoCard>
                          <InfoCard title="Light" colors={colors} style={[styles.horizontalCard, { width: cardPageWidth }]}>
                              <SensorDisplayCardItem value={latestData.light_level} unit=" lux" icon="lightbulb-on-outline" colors={colors} statusIcon="check-circle-outline" statusColor={colors.primary} statusText="OK" />
                         </InfoCard>
                         <InfoCard title="Water Temp" colors={colors} style={[styles.horizontalCard, { width: cardPageWidth }]}>
                             <SensorDisplayCardItem value={latestData.water_temperature === -127 ? 'N/A' : latestData.water_temperature} unit={latestData.water_temperature === -127 ? "" : "°C"} icon="water-thermometer" colors={colors} statusIcon="minus" statusColor={colors.textSecondary} statusText="N/A" />
                        </InfoCard>
                     </ScrollView>

                     {/* --- Horizontally Paging Charts (1 per page) --- */}
                     <Text style={[styles.sectionHeader, { color: colors.text }]}>Trends (Simulated Data)</Text>
                     <ScrollView
                         horizontal={true}
                         pagingEnabled={true} // Paging for single large items
                         decelerationRate="fast"
                         showsHorizontalScrollIndicator={false}
                         style={styles.horizontalScrollViewPager}
                         contentContainerStyle={[styles.pagerContentContainer, { paddingHorizontal: H_PADDING_CHARTS / 2 }]} // Use chart padding var
                     >
                          {/* Use defined chartCardWidth */}
                          <InfoCard title="Temperature" colors={colors} style={[styles.pageCard, {width: chartCardWidth}]}>
                             <LineChart data={{ labels: simulatedChartData.labels, datasets: [{ data: simulatedChartData.temp }] }} width={chartCardWidth - SIZES.padding * 1.5} height={180} chartConfig={{...chartConfig, color: (opacity=1)=>colors.accent}} bezier style={styles.chartStyle} fromZero={false} yAxisSuffix="°C" />
                          </InfoCard>
                          <InfoCard title="Humidity" colors={colors} style={[styles.pageCard, {width: chartCardWidth}]}>
                              <LineChart data={{ labels: simulatedChartData.labels, datasets: [{ data: simulatedChartData.humidity }] }} width={chartCardWidth - SIZES.padding * 1.5} height={180} chartConfig={{...chartConfig, color: (opacity=1)=>colors.primary}} bezier style={styles.chartStyle} fromZero={false} yAxisSuffix="%"/>
                          </InfoCard>
                          <InfoCard title="Soil Moisture (Avg)" colors={colors} style={[styles.pageCard, {width: chartCardWidth}]}>
                               <LineChart data={{ labels: simulatedChartData.labels, datasets: [{ data: simulatedChartData.soil }] }} width={chartCardWidth - SIZES.padding * 1.5} height={180} chartConfig={{...chartConfig, color: (opacity=1)=>colors.secondary}} bezier style={styles.chartStyle} fromZero={false} yAxisSuffix="%"/>
                          </InfoCard>
                     </ScrollView>
                 </>
            );
        } else { // activeTab === 'details'
            // --- Sensor Details Tab Content ---
            return (
                 <View>
                     <InfoCard title="Individual Soil Sensors" colors={colors} style={styles.cardFull}>
                         <View style={styles.sensorGrid}>
                             <SensorDisplayCardItem label="Soil 1" value={latestData.soil1} unit="%" icon="numeric-1-box-outline" colors={colors} statusIcon="alert-circle-outline" statusColor={colors.danger} statusText="Very Low" />
                             <SensorDisplayCardItem label="Soil 2" value={latestData.soil2} unit="%" icon="numeric-2-box-outline" colors={colors} statusIcon="alert-circle-outline" statusColor={colors.danger} statusText="Very Low" />
                             <SensorDisplayCardItem label="Soil 3" value={latestData.soil3} unit="%" icon="numeric-3-box-outline" colors={colors} statusIcon="alert-circle-outline" statusColor={colors.danger} statusText="Very Low" />
                             <SensorDisplayCardItem label="Soil 4" value={latestData.soil4} unit="%" icon="numeric-4-box-outline" colors={colors} statusIcon="alert-outline" statusColor={colors.warning} statusText="Low" />
                             <SensorDisplayCardItem label="Soil 5" value={latestData.soil5} unit="%" icon="numeric-5-box-outline" colors={colors} statusIcon="alert-outline" statusColor={colors.warning} statusText="High?"/>
                         </View>
                     </InfoCard>
                     <InfoCard title="Other Readings" colors={colors} style={styles.cardFull}>
                         <View style={styles.sensorGrid}>
                              <SensorDisplayCardItem label="Water Temp" value={latestData.water_temperature === -127 ? 'N/A' : latestData.water_temperature} unit={latestData.water_temperature === -127 ? "" : "°C"} icon="water-thermometer" colors={colors} />
                             <SensorDisplayCardItem label="Light Level" value={latestData.light_level} unit=" lux" icon="lightbulb-on-outline" colors={colors} />
                             <SensorDisplayCardItem label="Device ID" value={latestData.device} unit="" icon="devices" colors={colors} />
                         </View>
                    </InfoCard>
                 </View>
            );
        }
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
             {/* Tab Selector */}
            <View style={[styles.tabContainer, {borderColor: colors.lightGray}]}>
                <TouchableOpacity style={[styles.tabButton, { borderBottomColor: activeTab === 'overview' ? colors.primary : 'transparent'}]} onPress={() => setActiveTab('overview')}>
                     <MaterialCommunityIcons name="view-dashboard-variant-outline" size={20} color={activeTab === 'overview' ? colors.primary : colors.textSecondary} style={styles.tabIcon}/>
                     <Text style={[styles.tabText, { color: activeTab === 'overview' ? colors.primary : colors.textSecondary }]}>Overview</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tabButton, { borderBottomColor: activeTab === 'details' ? colors.primary : 'transparent'}]} onPress={() => setActiveTab('details')}>
                     <MaterialCommunityIcons name="tune-variant" size={20} color={activeTab === 'details' ? colors.primary : colors.textSecondary} style={styles.tabIcon}/>
                     <Text style={[styles.tabText, { color: activeTab === 'details' ? colors.primary : colors.textSecondary }]}>Sensor Details</Text>
                </TouchableOpacity>
            </View>
            {/* Main ScrollView */}
            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {renderContent()}
            </ScrollView>
        </SafeAreaView>
    );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, },
    container: { flex: 1, },
    scrollContent: { paddingBottom: SIZES.paddingLarge * 2, },
    screenTitle: { ...FONTS.h1, fontWeight: 'bold', paddingHorizontal: SIZES.padding, paddingTop: SIZES.padding, marginBottom: SIZES.base, textAlign: 'center' },
    timestamp: { ...FONTS.body3, textAlign: 'center', marginBottom: SIZES.padding, opacity: 0.7, paddingHorizontal: SIZES.padding, },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SIZES.paddingLarge, minHeight: 300 },
    emptyText: { ...FONTS.body1, textAlign: 'center', marginTop: SIZES.padding, },
    tabContainer: { flexDirection: 'row', borderBottomWidth: 1, },
    tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SIZES.padding * 0.9, borderBottomWidth: 3, },
    tabIcon: { marginRight: SIZES.base },
    tabText: { ...FONTS.h4, fontWeight: '600', },
    sectionHeader: { ...FONTS.h3, fontWeight: '600', paddingHorizontal: SIZES.padding, marginBottom: SIZES.padding * 0.8, marginTop: SIZES.padding * 1.5 },
    horizontalScrollViewPager: { paddingVertical: SIZES.padding * 0.5 },
    pagerContentContainer: { // Add horizontal padding here for start/end spacing
         paddingHorizontal: SIZES.padding / 2,
     },
    card: { borderRadius: SIZES.radius * 1.2, borderWidth: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 4, overflow: Platform.OS === 'android' ? 'hidden' : 'visible', },
    cardContent: { padding: SIZES.padding * 0.8, },
    horizontalCard: { // Sensor card in horizontal scroll (2 per page)
        width: cardPageWidth, // Defined above
        marginHorizontal: INTER_CARD_SPACING / 2, // Defined above
        marginBottom: SIZES.padding * 0.5, // Less bottom margin
        minHeight: 165, // Adjusted height
        justifyContent: 'space-between',
    },
    chartCardHorizontal: { // Chart card in horizontal scroll (1 per page)
         width: chartCardWidth, // Defined above
         marginHorizontal: H_PADDING_CHARTS / 2, // Use chart padding var for spacing
         marginBottom: SIZES.padding,
     },
    pageCard: { // General term for cards inside horizontal pagers
         // Width is applied specifically where used now
         marginBottom: SIZES.padding,
    },
    cardFull: { marginHorizontal: SIZES.padding, marginBottom: SIZES.padding * 1.5, },
    cardTitle: { ...FONTS.h4, fontWeight: 'bold', marginBottom: SIZES.padding, },
    sensorGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -(SIZES.padding / 4), },
    sensorCardItem: { // Style for items inside cards (adjust width if needed in grid)
        width: '100%', // Full width inside horizontal card
        marginBottom: SIZES.padding * 0.8,
        // For sensorGrid usage:
        // width: '50%',
        // paddingHorizontal: SIZES.padding / 4,
    },
    sensorHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SIZES.base * 0.5, },
    sensorIcon: { marginRight: SIZES.base, opacity: 0.7 },
    sensorLabel: { ...FONTS.body3, opacity: 0.9, fontWeight: '500' },
    sensorValue: { ...FONTS.h1, fontWeight: '600', },
    statusIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: SIZES.base * 0.8, paddingHorizontal: SIZES.base * 0.8, paddingVertical: SIZES.base * 0.3, borderRadius: SIZES.radius * 0.5, alignSelf: 'flex-start', },
    statusText: { ...FONTS.body3, fontSize: 11, fontWeight: 'bold', marginLeft: SIZES.base * 0.5, },
    trendsSection: { marginTop: SIZES.base },
    chartStyle: { borderRadius: SIZES.radius * 0.5, alignSelf: 'center' },
});

export default AnalyticsScreen;