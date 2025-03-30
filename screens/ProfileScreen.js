// screens/ProfileScreen.js
import React, { useCallback, useState, useMemo, useEffect } from 'react';
import {
    View, Text, StyleSheet, ScrollView, Image, ActivityIndicator,
    RefreshControl, Alert, Platform, FlatList, SafeAreaView, TouchableOpacity, Dimensions
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useAppContext } from '../contexts/AppContext';
import { useTheme } from '../contexts/ThemeContext';
import { FONTS, SIZES } from '../utils/theme';
import { achievementsList } from '../utils/achievementsData'; // Use achievementsList directly
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // Keep LinearGradient import

// --- Reusable Achievement Badge Component (Defined Outside) ---
// Uses horizontal list styling
const AchievementBadge = ({ achievement, isEarned, colors, onPress }) => {
    const earnedStyle = { opacity: 1 };
    const lockedStyle = { opacity: 0.55 };
    const badgeStyle = isEarned ? earnedStyle : lockedStyle;
    const iconColor = isEarned ? colors.primary : colors.textSecondary; // Use primary for earned icon
    const nameColor = isEarned ? colors.text : colors.textSecondary;
    if (!achievement || !achievement.id || !achievement.name) { return null; } // Avoid rendering bad data

    return (
        <TouchableOpacity
            style={[styles.badgeContainer, badgeStyle, { backgroundColor: colors.cardBackground, borderColor: colors.lightGray + '60' }]}
            activeOpacity={isEarned ? 0.7 : 1.0}
            onPress={() => isEarned && onPress && onPress(achievement)} >
            <MaterialCommunityIcons name={achievement.icon || 'trophy-variant-outline'} size={38} color={iconColor} style={styles.badgeIcon} />
            <Text style={[styles.badgeName, { color: nameColor }]} numberOfLines={2}>{achievement.name}</Text>
            {!isEarned && ( <View style={styles.lockOverlay}><MaterialCommunityIcons name="lock-outline" size={16} color={colors.lightGray} /></View> )}
        </TouchableOpacity>
    );
};

// --- Reusable Streak Display Component (Defined Outside) ---
// Styled as a distinct "box" for placement on gradient
const StreakDisplay = ({ streak, colors }) => (
    <View style={[styles.streakDisplayContainer, {backgroundColor: 'rgba(0, 0, 0, 0.3)' /* Semi-transparent light box */}]}>
         <MaterialCommunityIcons name="fire" size={32} color={streak > 0 ? colors.streakActive : colors.white + 'aa'} />
         <View style={styles.streakTextContent}>
             {/* Use light text colors for contrast */}
             <Text style={[styles.streakTextValue, {color: streak > 0 ? colors.white : colors.white + 'aa'}]}>{String(streak || 0)}</Text>
             <Text style={[styles.streakTextLabel, {color: colors.white + 'dd' }]}>Day Streak</Text>
         </View>
    </View>
);


// --- Main Profile Screen ---
const ProfileScreen = ({ navigation }) => {
    const { user, profile: authProfile, refreshUserProfileCheck } = useAuth();
    const { streakData, earnedAchievements, isLoadingData: isLoadingAppData, refreshData: refreshAppData } = useAppContext();
    const { colors } = useTheme();
    const [refreshing, setRefreshing] = useState(false);

    const profile = authProfile;

    // Refresh handler
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try { await Promise.all([ refreshUserProfileCheck?.(), refreshAppData?.() ].filter(Boolean)); }
        catch (error) { console.error("ProfileScreen: Error during refresh:", error); Alert.alert("Refresh Failed", "Could not refresh."); }
        finally { setRefreshing(false); }
    }, [refreshUserProfileCheck, refreshAppData]);

    // Handler for tapping an achievement badge
    const handleAchievementPress = (achievement) => {
        if (!achievement) return;
        Alert.alert(achievement.name || 'Achievement', achievement.description || 'Keep growing!');
    };

    // Prepare achievement data - ensure it's always an array
    const achievementGridData = useMemo(() => {
        return Array.isArray(achievementsList) ? achievementsList : [];
    }, []);

    // Render item for the achievement list
    const renderHorizontalBadge = useCallback(({ item }) => (
        <AchievementBadge achievement={item} isEarned={earnedAchievements.has(item?.id)} colors={colors} onPress={handleAchievementPress} />
    ), [earnedAchievements, colors, handleAchievementPress]);

    // --- Main Render ---
    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                refreshControl={ <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} /> }
                showsVerticalScrollIndicator={false}
            >
                {/* --- Header Section with Darker Gradient --- */}
                <LinearGradient
                    // Darker gradient using theme colors
                    colors={[colors.primaryDark, colors.primary, colors.primary]} // Darker start
                    style={styles.headerContainer}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} >
                    {/* Avatar */}
                    <View style={[styles.avatarContainer, {backgroundColor: colors.cardBackground, borderColor: colors.white + '90'}]}>
                        {profile?.avatar_url ? ( <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} resizeMode="cover"/> )
                         : ( <MaterialCommunityIcons name="account-circle" size={80} color={colors.gray} /> )}
                    </View>
                    {/* Name & Email - Light text for dark gradient */}
                    <Text style={[styles.username, styles.headerTextShadow, { color: colors.white }]}>{String(profile?.username || 'Grower')}</Text>
                    {user?.email && <Text style={[styles.email, styles.headerTextShadow, { color: colors.white + 'e0' }]}>{String(user.email)}</Text>}
                     {/* Streak Display in its box */}
                     <StreakDisplay streak={streakData?.streak} colors={colors} />
                </LinearGradient>

                 {/* --- Achievements Section --- */}
                 <View style={styles.achievementsSection}>
                     {/* Title Row */}
                    <View style={styles.sectionHeaderRow}>
                         <MaterialCommunityIcons name="trophy-variant-outline" size={24} color={colors.secondaryDark} style={styles.sectionHeaderIcon}/>
                         <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            {`Achievements (${earnedAchievements.size} / ${achievementGridData.length})`}
                         </Text>
                    </View>

                    {/* Horizontal Scroll List */}
                     {isLoadingAppData && earnedAchievements.size === 0 ? (
                          <ActivityIndicator color={colors.primary} style={{marginVertical: SIZES.paddingLarge}} />
                     ) : achievementGridData.length === 0 ? (
                           <Text style={[styles.noAchievementsText, { color: colors.textSecondary }]}>No achievements defined.</Text>
                     ) : (
                         <FlatList
                             horizontal={true} // Horizontal scroll
                             data={achievementGridData}
                             renderItem={renderHorizontalBadge}
                             keyExtractor={(item) => String(item?.id || Math.random())}
                             showsHorizontalScrollIndicator={false}
                             contentContainerStyle={styles.achievementListContainer}
                             ListEmptyComponent={<Text style={[styles.noAchievementsText, { color: colors.textSecondary }]}>Loading...</Text>}
                             // Removed grid props
                         />
                     )}
                 </View>

                 <View style={{ height: SIZES.paddingLarge }} /> {/* Bottom Spacer */}

            </ScrollView>
        </SafeAreaView>
    );
};

// --- Stylesheet ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, },
    container: { flex: 1, },
    scrollContent: { paddingBottom: SIZES.paddingLarge * 2 },
    // Header Styles
    headerContainer: {
        paddingTop: SIZES.paddingLarge * 1.5, paddingBottom: SIZES.paddingLarge * 1.5, paddingHorizontal: SIZES.padding,
        alignItems: 'center', marginBottom: 0, // Remove margin below header, divider handles separation
        borderBottomLeftRadius: SIZES.radius * 2.5, borderBottomRightRadius: SIZES.radius * 2.5,
        // Removed shadow/elevation
    },
    avatarContainer: {
        width: 110, height: 110, borderRadius: 55, justifyContent: 'center', alignItems: 'center',
        marginBottom: SIZES.padding, overflow: 'hidden', borderWidth: 2.5,
        // Removed shadow/elevation
    },
    avatarImage: { width: '100%', height: '100%' },
    username: { ...FONTS.h1, fontWeight: 'bold', marginBottom: SIZES.base, textAlign: 'center', fontSize: 26 },
    email: { ...FONTS.body1, textAlign: 'center', opacity: 0.9, marginBottom: SIZES.padding * 1.5 },
    headerTextShadow: { // Keep subtle shadow for light text on gradient
         textShadowColor: 'rgba(0, 0, 0, 0.30)', textShadowOffset: {width: 0, height: 1}, textShadowRadius: 2,
     },
    // Streak Display Styles
    streakDisplayContainer: { // The "box"
        flexDirection: 'row', alignItems: 'center', paddingVertical: SIZES.base * 1.2,
        paddingHorizontal: SIZES.padding * 1.8, borderRadius: SIZES.radius * 1.5,
        marginTop: SIZES.padding * 0.5,
        // Removed shadow/elevation
    },
     streakTextContent: { alignItems: 'center', marginHorizontal: SIZES.base * 1.2 },
     streakTextValue: { ...FONTS.h1, fontWeight: 'bold', fontSize: 30, lineHeight: 34 },
     streakTextLabel: { ...FONTS.body3, fontWeight: '600', opacity: 0.9 },
    // Decorative Divider
    divider: { height: 1, opacity: 0.6, marginVertical: SIZES.paddingLarge, marginHorizontal: SIZES.padding },
    // Achievements Section Styles
    achievementsSection: { marginTop: SIZES.padding, }, // Add space above section if divider removed
    sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SIZES.padding, marginBottom: SIZES.padding, },
    sectionHeaderIcon: { marginRight: SIZES.base * 1.2 },
    sectionTitle: { ...FONTS.h2, fontWeight: 'bold', },
    achievementListContainer: { paddingHorizontal: SIZES.padding, paddingVertical: SIZES.base, }, // Horizontal list padding
    badgeContainer: { // Styling for horizontal badge
        width: 105, height: 120, // Adjusted size
        borderRadius: SIZES.radius, borderWidth: 1,
        justifyContent: 'center', alignItems: 'center',
        padding: SIZES.base, position: 'relative',
        marginRight: SIZES.padding * 0.8, // Space between badges horizontally
        // Removed shadow/elevation
    },
    badgeIcon: { marginBottom: SIZES.base, },
    badgeName: { ...FONTS.body3, fontSize: 11, textAlign: 'center', fontWeight: '600', },
    lockOverlay: { position: 'absolute', top: 5, right: 5, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: 2, },
    noAchievementsText: { ...FONTS.body1, textAlign: 'center', padding: SIZES.paddingLarge, opacity: 0.8, marginHorizontal: SIZES.padding },
});

export default ProfileScreen;