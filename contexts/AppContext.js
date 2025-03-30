import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { parseISO, isValid } from 'date-fns';
import { isDateYesterday, isDateToday, formatDate } from '../utils/helpers';
import { achievementsList } from '../utils/achievementsData';


/**
 * Fetches the latest sensor data record from the Supabase sensor_readings table.
 * (Used as a fallback during development)
 * @returns {Promise<object|null>} A promise resolving to the latest data object or null.
 */
const fetchLatestSensorDataFromSupabase = async () => {
  console.log("Fetching latest sensor data from Supabase table 'sensor_readings'...");
  try {
    const { data, error } = await supabase
      .from('sensor_readings') // Using the correct table name
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle(); // Returns null if no rows

    if (error) {
      console.error("Supabase fetch error (sensor_readings):", error);
      throw error;
    }
    console.log("Latest sensor data from Supabase:", data);
    return data;
  } catch (err) {
    console.error("Error in fetchLatestSensorDataFromSupabase:", err);
    return null;
  }
};

const IOT_API_DATA_ENDPOINT = 'http://10.1.10.144:5000/data'; // As specified

/**
 * Basic CSV Text Parser. Assumes comma delimiter and first row is headers.
 * Converts numeric fields. Returns the *last* data row as an object.
 * WARNING: This is basic and may break with complex CSVs (e.g., quoted commas).
 * @param {string} csvText - The raw CSV text content.
 * @returns {object|null} The last data row as an object, or null if parsing fails.
 */
const parseLatestCsvReading = (csvText) => {
    if (!csvText || typeof csvText !== 'string') return null;
    try {
        const lines = csvText.trim().split('\n');
        if (lines.length < 2) return null; // Need header + at least one data row

        const headers = lines[0].split(',').map(h => h.trim());
        const lastDataLine = lines[lines.length - 1]; // Get the last line of data
        const values = lastDataLine.split(',').map(v => v.trim());

        if (headers.length !== values.length) {
            console.error("CSV header/value length mismatch");
            return null;
        }

        const result = {};
        headers.forEach((header, index) => {
            const value = values[index];
            // Attempt to convert known numeric fields
            if ([ 'soil1', 'soil2', 'soil3', 'soil4', 'soil5',
                  'water_temperature', 'air_temperature', 'air_humidity', 'light_level'].includes(header)) {
                const num = parseFloat(value);
                result[header] = isNaN(num) ? null : num; // Store null if parsing fails
                 // Handle specific known invalid values like -127 for temp
                 if (header === 'water_temperature' && result[header] === -127) {
                    result[header] = null;
                 }
            } else {
                result[header] = value; // Keep others as string (like timestamp, device)
            }
        });
        return result;
    } catch (e) {
        console.error("Error parsing CSV:", e);
        return null;
    }
};

/**
 * Fetches the latest sensor data from the real IoT /data endpoint.
 * Expects CSV, parses it, and returns the last row as JSON.
 * @returns {Promise<object|null>} A promise resolving to the data object or null.
 */
const fetchLatestSensorDataFromIoT = async () => {
    console.log(`Workspaceing latest sensor data from IoT API (expecting CSV): ${IOT_API_DATA_ENDPOINT}`);
    try {
        const response = await fetch(IOT_API_DATA_ENDPOINT, {
             method: 'GET',
             headers: { 'Accept': 'text/csv,application/json' } // Accept CSV primarily
        });
        if (!response.ok) { throw new Error(`IoT API Error: ${response.status} ${response.statusText}`); }

        const csvText = await response.text(); // Get response as text
        console.log("Received CSV text from IoT API (first 100 chars):", csvText.substring(0, 100));

        const latestData = parseLatestCsvReading(csvText); // Parse the CSV

        if (!latestData) {
            throw new Error("Failed to parse CSV data from IoT device.");
        }

        console.log("Parsed latest sensor data from IoT API CSV:", latestData);
        return latestData; // Return the parsed object for the last row

    } catch (error) {
        console.error(`Error fetching/parsing from IoT endpoint (${IOT_API_DATA_ENDPOINT}):`, error);
        Alert.alert("IoT Device Error", `Could not process data: ${error.message}`);
        return null;
    }
};

/**
 * Main dispatcher function to get the absolute latest sensor data.
 * Calls either Supabase (mock) or real IoT API based on app config.
 * @returns {Promise<object|null>}
 */
export const fetchLatestSensorData = async () => {
    const useMock = Constants.expoConfig?.extra?.useMockSensorData ?? true;
    if (useMock) {
        console.log("Using Supabase mock for latest sensor data.");
        return fetchLatestSensorDataFromSupabase();
    } else {
        console.log("Using real IoT API (CSV) for latest sensor data.");
        return fetchLatestSensorDataFromIoT();
    }
};


// --- React Context Definition ---
const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  // --- State ---
  const { session, user } = useAuth();
  const [batches, setBatches] = useState([]);
  const [knowledgeBaseEntries, setKnowledgeBaseEntries] = useState([]);
  const [streakData, setStreakData] = useState({ streak: 0, lastObservationDate: null });
  const [earnedAchievements, setEarnedAchievements] = useState(new Set());
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isCheckingAchievements, setIsCheckingAchievements] = useState(false);

  // --- Data Fetching Callbacks ---

  // Fetches user's batches including image and estimated harvest days
  const fetchBatches = useCallback(async () => {
      if (!user) { setBatches([]); return; }
      console.log("AppContext: Fetching batches...");
      try {
          const { data, error, status } = await supabase
              .from('batches')
              .select(`id, user_id, name, sow_date, comments, created_at, image_url, estimated_harvest_days`)
              .eq('user_id', user.id)
              .order('created_at', { ascending: false });

          if (error && status !== 406) throw error; // Allow 406 (no rows found)

          if (data) {
              // Map DB data to state shape
              const pBatches = data.map(b => ({
                  id: b.id,
                  user_id: b.user_id,
                  name: b.name,
                  sowDate: b.sow_date, // Convert snake_case to camelCase
                  comments: b.comments,
                  createdAt: b.created_at,
                  imageUrl: b.image_url, // Use image_url from DB
                  estimatedHarvestDays: b.estimated_harvest_days,
                  observations: [], // Initialize observations empty
              }));
              setBatches(pBatches);
              console.log(`AppContext: Fetched ${pBatches.length} batches.`);
          } else {
              setBatches([]); // Set empty if no data
          }
      } catch (error) {
          console.error("AppContext: Error fetching batches:", error);
          Alert.alert('Fetch Error', `Could not fetch batches: ${error.message}`);
          setBatches([]);
      }
  }, [user]); // Dependency: only user

  // Fetches all knowledge base entries
  const fetchKnowledgeBase = useCallback(async () => {
      console.log("AppContext: Fetching knowledge base entries...");
      try {
          const { data, error } = await supabase
              .from('knowledge_base_entries')
              .select('*') // Select all columns
              .order('name', { ascending: true }); // Order alphabetically by name
          if (error) throw error;
          if (data) {
              setKnowledgeBaseEntries(data);
              console.log(`AppContext: Fetched ${data.length} KB entries.`);
          } else {
              setKnowledgeBaseEntries([]);
          }
      } catch (error) {
          console.error("AppContext: Error fetching knowledge base:", error);
          Alert.alert('Fetch Error', `Could not fetch knowledge base: ${error.message}`);
          setKnowledgeBaseEntries([]);
      }
  }, []); // No dependencies, fetch once

  // Fetches observations for a specific batch (used for lazy loading)
   const fetchObservationsForBatch = useCallback(async (batchId) => {
        if (!user || !batchId) return;
        console.log(`AppContext: Fetching observations for batch ${batchId}...`);
        try {
            const { data, error } = await supabase
                .from('observations')
                .select('*') // Assuming select('*') includes the tags column
                .eq('batch_id', batchId)
                .order('observation_date', { ascending: false }); // Newest first

            if (error) throw error;

            if (data) {
                // Map DB data to state shape
                const pObs = data.map(o => ({
                    id: o.id,
                    batch_id: o.batch_id,
                    user_id: o.user_id,
                    date: o.observation_date, // Convert snake_case
                    notes: o.notes,
                    height: o.height,
                    phenology_stage: o.phenology_stage,
                    photoUri: o.photo_url, // Use photo_url from DB
                    createdAt: o.created_at,
                    tags: o.tags ?? [], // Ensure tags array exists, default to [] if null
                }));

                // Update the specific batch in the state with the fetched observations
                setBatches(prevBatches =>
                    prevBatches.map(b =>
                        b.id === batchId ? { ...b, observations: pObs } : b
                    )
                );
                 console.log(`AppContext: Fetched ${pObs.length} observations for batch ${batchId}.`);
            } else {
                 // If no data, ensure the batch observations array is empty
                 setBatches(prevBatches =>
                    prevBatches.map(b =>
                        b.id === batchId ? { ...b, observations: [] } : b
                    )
                 );
            }
        } catch (error) {
            console.error(`AppContext: Error fetching observations for batch ${batchId}:`, error);
            Alert.alert('Fetch Error', `Could not load observations: ${error.message}`);
        }
   }, [user]); // Only depends on user

  // Fetches earned achievement IDs for the user
  const fetchEarnedAchievements = useCallback(async () => {
       if (!user) return;
       console.log("AppContext: Fetching achievements...");
       try {
           const { data, error } = await supabase
               .from('user_achievements')
               .select('achievement_id')
               .eq('user_id', user.id);
           if (error) throw error;
           if (data) {
               setEarnedAchievements(new Set(data.map(a => a.achievement_id)));
               console.log(`AppContext: Fetched ${data.length} earned achievements.`);
           } else {
               setEarnedAchievements(new Set());
           }
       } catch (error) {
           console.error("AppContext: Error fetching achievements:", error);
           Alert.alert("Fetch Error", `Could not load achievements: ${error.message}`);
           setEarnedAchievements(new Set());
       }
  }, [user]); // Only depends on user

  // Initializes streak data based on profile information
  const initializeStreakFromProfile = useCallback(async () => {
        if (!user) { setStreakData({ streak: 0, lastObservationDate: null }); return; }
        console.log("AppContext: Initializing streak...");
        let data, error, status;
        try {
            ({ data, error, status } = await supabase.from('profiles').select('last_observation_date, current_streak').eq('id', user.id).maybeSingle());
            if (error && status !== 406) { throw error; } // Throw actual DB errors
            const lastDateStr = data?.last_observation_date;
            const currentDbStreak = data?.current_streak ?? 0;
            let calculatedStreak = 0; let lastDateObj = null;
            if (lastDateStr) {
                lastDateObj = parseISO(lastDateStr);
                if (isValid(lastDateObj)) {
                    if (isDateToday(lastDateObj) || isDateYesterday(lastDateObj)) { calculatedStreak = currentDbStreak; } // Keep streak if today or yesterday
                    else { calculatedStreak = 0; } // Reset if older than yesterday
                } else { lastDateObj = null; } // Handle invalid date in DB
            }
            console.log(`AppContext: Init streak - LastObsDB: ${lastDateStr}, DBStreak: ${currentDbStreak}, CalcStreak: ${calculatedStreak}`);
            setStreakData({ streak: calculatedStreak, lastObservationDate: lastDateObj });
        } catch (e) {
            // Check if error is because columns don't exist (e.g., code 42703 in Postgres)
            if (e?.code === '42703') { console.warn("AppContext: Streak columns (last_observation_date/current_streak) likely missing in 'profiles' table. Using default streak 0."); setStreakData({ streak: 0, lastObservationDate: null }); }
            else { console.error("AppContext: Error initializing streak from profile:", e); Alert.alert("Error", `Could not load streak data: ${e.message}`); setStreakData({ streak: 0, lastObservationDate: null }); } // Reset on other errors
        }
  }, [user]); // Only depends on user

  // --- Initial Data Fetch Effect ---
  useEffect(() => {
    if (user) {
        console.log("AppContext: User detected, fetching initial data...");
        setIsLoadingData(true);
        const fetchData = async () => {
            try {
                console.log("AppContext Effect: Starting initial fetches...");
                await fetchKnowledgeBase();
                await Promise.all([ fetchBatches(), fetchEarnedAchievements(), initializeStreakFromProfile() ]);
                console.log("AppContext Effect: Initial fetches completed successfully.");
            } catch (err) {
                console.error("AppContext Effect: Error during initial fetches:", err);
                Alert.alert("Loading Error", "Failed to load initial app data.");
            } finally {
                console.log("AppContext Effect: Fetch attempt finished, setting loading false.");
                setIsLoadingData(false);
            }
        };
        fetchData();
    } else {
        // Clear data if no user
        console.log("AppContext Effect: No user, clearing data.");
        setBatches([]);
        setKnowledgeBaseEntries([]);
        setEarnedAchievements(new Set());
        setStreakData({ streak: 0, lastObservationDate: null });
        setIsLoadingData(false); // Ensure loading stops
    }
  // Re-run if user changes or fetch functions change identity (should be stable with useCallback)
  }, [user, fetchBatches, fetchKnowledgeBase, fetchEarnedAchievements, initializeStreakFromProfile]);


  // --- Award/Check Achievement Logic ---
  const awardAchievement = useCallback(async (achievementId) => {
        if (!user || earnedAchievements.has(achievementId) || isCheckingAchievements) return;
        console.log(`AppContext: Awarding ${achievementId}`);
        setIsCheckingAchievements(true); // Prevent concurrent checks
        try {
            const { error } = await supabase.from('user_achievements').insert({ user_id: user.id, achievement_id: achievementId });
            // Handle duplicate key violation (already earned) silently
            // Handle foreign key violation (achievement ID doesn't exist in main table) with warning
            if (error && error.code !== '23505' && error.code !== '23503') {
                throw error; // Throw other errors
            }
            if (!error || error.code === '23505') { // If successful or duplicate
                setEarnedAchievements(prev => new Set(prev).add(achievementId)); // Update local state
                if (!error) { // Only alert if newly inserted
                    const achievement = achievementsList.find(a => a.id === achievementId);
                    if (achievement) { Alert.alert("Achievement Unlocked!", `${achievement.name}\n${achievement.description}`); }
                }
            } else if (error.code === '23503') {
                console.warn(`AppContext: Could not award ${achievementId}, ID missing in public 'achievements' table.`);
            }
        } catch (error) {
            console.error(`Error awarding achievement ${achievementId}:`, error);
            Alert.alert("Error", `Could not award achievement: ${error.message}`);
        } finally {
            setIsCheckingAchievements(false); // Release lock
        }
    }, [user, earnedAchievements, isCheckingAchievements]);

  // Check all achievement conditions
  const checkAndAwardAchievements = useCallback(async (currentStreak) => {
        const totalObservations = batches.reduce((sum, batch) => sum + (batch.observations?.length || 0), 0);
        const totalBatches = batches.length;
        console.log(`AppContext: Checking achievements - Streak: ${currentStreak}, Obs: ${totalObservations}, Batches: ${totalBatches}`);
        // Use Promise.all to check all achievements concurrently
        await Promise.all(achievementsList.map(async (ach) => {
            if (earnedAchievements.has(ach.id)) return; // Skip if already earned
            let conditionMet = false;
            switch (ach.type) {
                case 'streak': conditionMet = currentStreak >= ach.value; break;
                case 'observation_count': conditionMet = totalObservations >= ach.value; break;
                case 'batch_count': conditionMet = totalBatches >= ach.value; break;
                // Add future achievement types here
            }
            if (conditionMet) { await awardAchievement(ach.id); } // Attempt to award
        }));
    }, [awardAchievement, earnedAchievements, batches]);


  // --- Update Streak Logic ---
  const updateStreakAndCheckAchievements = useCallback(async (isNewObservation = true) => {
      if (!user) return;
      let updatedStreak = streakData.streak || 0;
      // Only update streak if triggered by a new observation
      if (isNewObservation) {
          const today = new Date();
          const lastObsDate = streakData.lastObservationDate;
          // Only update streak if it hasn't been updated today already
          if (!lastObsDate || !isDateToday(lastObsDate)) {
              let newStreak = 1; // Default to 1 for the first observation today
              // If the last observation was yesterday, increment the existing streak
              if (lastObsDate && isDateYesterday(lastObsDate)) {
                  newStreak = (streakData.streak || 0) + 1;
              }
              const newLastObservationDate = new Date(); // Record the time of *this* observation
              console.log(`AppContext: Updating streak to ${newStreak}.`);
              // Update local state immediately
              setStreakData({ streak: newStreak, lastObservationDate: newLastObservationDate });
              updatedStreak = newStreak; // Use the calculated new streak for achievement check

              // Update profile in Supabase (fire-and-forget or handle errors quietly)
              supabase
                  .from('profiles')
                  .update({
                      last_observation_date: newLastObservationDate.toISOString(),
                      current_streak: newStreak
                  })
                  .eq('id', user.id)
                  .then(({ error }) => {
                      if (error && error.code !== '42703') { // Ignore missing column error
                          console.error("AppContext: Failed background save streak/date:", error);
                          // Optional: Alert user, but might be annoying
                          // Alert.alert("Save Error", "Could not update streak info in your profile.");
                      } else if (!error) {
                          console.log("AppContext: Background save streak/date successful.");
                      }
                  });
          } else {
              console.log("AppContext: Streak already updated today.");
              updatedStreak = streakData.streak; // Use the existing streak for achievement check
          }
      } else {
          // If not triggered by a new observation (e.g., on app load), just use current streak state
          updatedStreak = streakData.streak;
      }
      // Always check achievements after potentially updating streak or observation count
      await checkAndAwardAchievements(updatedStreak);

  }, [streakData, user, checkAndAwardAchievements]);


   // --- Generic Image Upload Helper ---
   const uploadImageAndGetUrl = async (bucketName, userId, localFileUri, filePathPrefix = '') => {
        if (!localFileUri || !userId || !bucketName) { console.log(`Upload skipped: missing uri (${!!localFileUri}), userId (${!!userId}), or bucketName (${!!bucketName})`); return null; }
        console.log(`AppContext: Uploading to ${bucketName} for user: ${userId}`);
        try {
            const fileExt = localFileUri.split('.').pop()?.toLowerCase() ?? 'jpg';
            const fileName = `${filePathPrefix}${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            const filePath = `public/${userId}/${fileName}`; // Standard path: public/{user_id}/{prefix}{generated_filename}.ext
            const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

            console.log(`AppContext: Reading file: ${localFileUri}`);
            const base64 = await FileSystem.readAsStringAsync(localFileUri, { encoding: FileSystem.EncodingType.Base64 });
            const fileData = decode(base64);
            console.log(`AppContext: Uploading (${fileData.byteLength} bytes) to bucket '${bucketName}' at: ${filePath}`);

            // Upload the file to the specified bucket
            const { data, error: uploadError } = await supabase.storage
                .from(bucketName) // *** BUCKET NAME PASSED HERE ***
                .upload(filePath, fileData, { contentType, upsert: false, cacheControl: '3600' }); // Added cache control

            if (uploadError) { throw uploadError; } // Throw error to be caught below

            console.log(`AppContext: Upload to ${bucketName} successful:`, data);
            // Get the public URL for the uploaded file
            const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(data.path);
            console.log(`AppContext: Public URL from ${bucketName}:`, urlData?.publicUrl);
            return urlData?.publicUrl ?? null; // Return the public URL

        } catch (error) {
            console.error(`AppContext: Error during image upload to ${bucketName}:`, error);
            // Provide more specific alerts based on common storage errors
            let alertMessage = `Failed to upload image: ${error.message || 'Unknown error'}`;
            if (error.message?.includes('mime type')) alertMessage = "Upload failed: Invalid image file type.";
            else if (error.message?.includes('Bucket not found')) alertMessage = "Upload failed: Storage bucket not found. Please ensure '" + bucketName + "' exists.";
            else if (error.message?.includes('exceeds the maximum')) alertMessage = "Upload failed: Image file is too large.";
            else if (error.message?.includes('Auth') || error.message?.includes('authorized') || error.code === '401' || error.code === '403') alertMessage = `Upload failed: Check permissions (RLS) for bucket '${bucketName}'.`;
            Alert.alert("Upload Error", alertMessage);
            return null; // Return null on failure
        }
    };


  // --- addBatch Mutation ---
  const addBatch = async (newBatchDataFromForm) => {
        if (!user) { Alert.alert("Error", "Please log in."); return null; }
        let addedBatchId = null; let uploadedImageUrl = null;
        const { localImageUri, ...batchDataToInsert } = newBatchDataFromForm; // Separate local URI
        console.log("AppContext: Adding batch...", batchDataToInsert.name);
        try {
            // 1. Upload image if provided
            if (localImageUri) {
                 uploadedImageUrl = await uploadImageAndGetUrl(
                    'batchimages', // *** BUCKET NAME USED HERE ***
                    user.id, localImageUri, 'batch_cover_'
                 );
            }
            // 2. Insert batch data
            const { data, error } = await supabase.from('batches').insert({ user_id: user.id, name: batchDataToInsert.name, sow_date: batchDataToInsert.sowDate, comments: batchDataToInsert.comments, estimated_harvest_days: batchDataToInsert.estimatedDays, image_url: uploadedImageUrl, }).select().single();
            if (error) throw error;
            // 3. Update local state
            if (data) {
                const newState = { id: data.id, user_id: data.user_id, name: data.name, sowDate: data.sow_date, comments: data.comments, createdAt: data.created_at, imageUrl: data.image_url, estimatedHarvestDays: data.estimated_harvest_days, observations: [] };
                setBatches(prev => [newState, ...prev].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)));
                addedBatchId = data.id;
                await checkAndAwardAchievements(streakData.streak);
                console.log("AppContext: Batch added successfully, ID:", addedBatchId);
            } else { console.warn("AppContext: Batch inserted but no data returned?"); }
        } catch (error) { console.error("AppContext: Error adding batch:", error); Alert.alert('Save Error', `Failed to add batch: ${error.message}`); addedBatchId = null; }
        return addedBatchId;
  };

  // --- addObservation Mutation ---
  const addObservation = async (batchId, observationDataWithLocalUri) => {
      if (!user) { Alert.alert("Error", "Please log in."); return null; }
      let addedObservationId = null; let uploadedPhotoUrl = null;
      const { photoUri: localPhotoUri, ...observationDataToInsert } = observationDataWithLocalUri;
      setIsCheckingAchievements(true);
      try {
          // 1. Upload observation photo if provided
          if (localPhotoUri) {
              const filePathPrefix = `${batchId}/obs_`;
              uploadedPhotoUrl = await uploadImageAndGetUrl(
                  'observation_photos', // *** BUCKET NAME USED HERE ***
                  user.id, localPhotoUri, filePathPrefix
              );
          }
          // 2. Insert observation data
          console.log("AppContext: Inserting observation with tags:", observationDataToInsert.tags);
          const { data, error } = await supabase.from('observations').insert({ batch_id: batchId, user_id: user.id, observation_date: new Date().toISOString(), notes: observationDataToInsert.notes, height: observationDataToInsert.height, phenology_stage: observationDataToInsert.phenology_stage, photo_url: uploadedPhotoUrl, tags: observationDataToInsert.tags ?? [], }).select().single();
          if (error) throw error;
          // 3. Update Local State
          if (data) {
              const newObs = { id: data.id, batch_id: data.batch_id, user_id: data.user_id, date: data.observation_date, notes: data.notes, height: data.height, phenology_stage: data.phenology_stage, photoUri: data.photo_url, createdAt: data.created_at, tags: data.tags ?? [], };
              setBatches(prevBatches => prevBatches.map(b => b.id === batchId ? { ...b, observations: [newObs, ...(b.observations || [])].sort((a,b) => new Date(b.date) - new Date(a.date)) } : b ));
              addedObservationId = data.id;
              console.log("AppContext: Observation added locally and to DB. ID:", addedObservationId);
              // 4. Update Streak & Check Achievements
              await updateStreakAndCheckAchievements(true);
          } else { console.warn("AppContext: Observation inserted but no data returned?"); }
      } catch (error) { console.error("AppContext: Error adding observation:", error); Alert.alert('Save Error', `Failed to add observation: ${error.message}`); addedObservationId = null; }
      finally { setIsCheckingAchievements(false); }
      return addedObservationId;
  };

   // --- addKnowledgeBaseEntry Mutation (Added) ---
  const addKnowledgeBaseEntry = async (newEntryDataWithLocalUri) => {
        if (!user) { Alert.alert("Error", "Authentication required."); return false; }
        let uploadedImageUrl = null;
        // Separate local URI from data to be inserted into the DB table
        const { localImageUri, ...entryDataToInsert } = newEntryDataWithLocalUri;

        console.log("AppContext: Adding knowledge base entry...", entryDataToInsert.name);
        try {
            // 1. Upload image if provided
            if (localImageUri) {
                uploadedImageUrl = await uploadImageAndGetUrl(
                    'kb_images', // *** BUCKET NAME FOR KB IMAGES ***
                    user.id, // Assuming user specific folder structure is desired, adjust if needed
                    localImageUri,
                    'kb_cover_' // Optional file prefix
                 );
                 // Optional: Decide if upload failure should prevent entry creation
                 // if (!uploadedImageUrl) { throw new Error("KB entry image upload failed."); }
            }

            // 2. Prepare data for DB insertion (map JS keys to your actual Supabase column names)
            // Ensure data types match (e.g., if tips is text[] in DB, entryDataToInsert.tips should be an array)
            const dbEntryData = {
                name: entryDataToInsert.name,
                description: entryDataToInsert.description,
                difficulty: entryDataToInsert.difficulty,
                min_harvest_days: entryDataToInsert.min_harvest_days, // Already number or null from Zod
                max_harvest_days: entryDataToInsert.max_harvest_days, // Already number or null from Zod
                image_url: uploadedImageUrl, // URL from storage or null
                // Map other optional fields, defaulting to null if empty/not provided
                germination_time: entryDataToInsert.germination_time || null,
                ideal_temp: entryDataToInsert.ideal_temp || null,
                lighting: entryDataToInsert.lighting || null,
                watering: entryDataToInsert.watering || null,
                harvest: entryDataToInsert.harvest || null,
                tips: entryDataToInsert.tips, // Pass array if form processed it, or handle here if tips is text[]
                common_problems: entryDataToInsert.common_problems, // Pass array if form processed it, or handle here if common_problems is text[]
                nutritional_info: entryDataToInsert.nutritional_info || null,
                taste_profile: entryDataToInsert.taste_profile || null,
                type: entryDataToInsert.type || null,
                icon_name: entryDataToInsert.icon_name || 'seed-outline', // Default icon
                // user_id: user.id // Add if required by RLS or for tracking
            };


            // 3. Insert data into knowledge_base_entries table
            console.log("AppContext: Inserting into knowledge_base_entries:", dbEntryData);
            const { data, error } = await supabase
                .from('knowledge_base_entries')
                .insert(dbEntryData)
                .select() // Select the newly inserted row
                .single(); // Expect only one row back

            if (error) {
                console.error("AppContext: Supabase insert error (KB entry):", error);
                // Check for specific errors like unique constraint violation if 'name' should be unique
                if (error.code === '23505') { Alert.alert('Save Error', `An entry named "${dbEntryData.name}" already exists.`); }
                else if (error.code === '42501') { Alert.alert('Save Error', `Permission denied. Check RLS policy for inserting into knowledge_base_entries.`);}
                else { throw error; } // Re-throw other DB errors
                return false; // Indicate failure on known errors too
            }

            // 4. Refresh local knowledge base state on success
            if (data) {
                console.log("AppContext: Knowledge Base entry added successfully, ID:", data.id);
                await fetchKnowledgeBase(); // Re-fetch the entire list
                return true; // Indicate success
            } else {
                console.warn("AppContext: KB entry inserted but no data returned?");
                return false;
            }
        } catch (error) {
            // Catch errors from upload or insert
            console.error("AppContext: Error adding knowledge base entry:", error);
            // Avoid duplicate alerts if already handled specific DB errors
            if (!error.code || (error.code !== '23505' && error.code !== '42501')) {
                Alert.alert('Save Error', `Failed to add knowledge base entry: ${error.message}`);
            }
            return false; // Indicate failure
        }
  };


  // --- Context Value Object ---
  const value = {
    session, user, batches, isLoadingData, addBatch, addObservation, knowledgeBaseEntries,
    fetchLatestSensorData,
    getBatchById: useCallback((batchId) => batches.find(batch => batch.id === batchId), [batches]),
    fetchObservationsForBatch,
    streakData,
    earnedAchievements,
    isCheckingAchievements,
    addKnowledgeBaseEntry, // <-- Expose the new function
    refreshData: useCallback(() => { // Full refresh function
         if (user) {
             console.log("AppContext: Refreshing core data..."); setIsLoadingData(true);
             Promise.all([ fetchBatches(), fetchKnowledgeBase(), fetchEarnedAchievements(), initializeStreakFromProfile() ])
             .catch(err => { console.error("AppContext: Error during core data refresh:", err); Alert.alert("Refresh Error", "Failed to refresh application data."); })
             .finally(() => setIsLoadingData(false));
         } else { setIsLoadingData(false); }
     }, [user, fetchBatches, fetchKnowledgeBase, fetchEarnedAchievements, initializeStreakFromProfile]),
  };

  // --- Render Provider ---
  return (<AppContext.Provider value={value}>{children}</AppContext.Provider>);
};

// --- Custom Hook ---
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) { throw new Error('useAppContext must be used within an AppProvider'); }
    return context;
};