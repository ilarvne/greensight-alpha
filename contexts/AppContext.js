// contexts/AppContext.js
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext'; // Use the Auth context to get session/user
import { isDateYesterday, generateId } from '../utils/helpers'; // Keep helpers if needed

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const { session } = useAuth(); // Get session from AuthContext
  const [batches, setBatches] = useState([]);
  const [streakData, setStreakData] = useState({ streak: 0, lastObservationDate: null }); // Keep local streak for now
  const [isLoading, setIsLoading] = useState(true); // Loading state for fetching app data

  // Function to fetch batches for the logged-in user
  const fetchBatches = useCallback(async () => {
    // Ensure session and user exist before fetching
    if (!session?.user) {
        console.log("fetchBatches called without session, returning.");
        setBatches([]); // Clear batches if no user
        setIsLoading(false);
        return;
    }
    console.log("fetchBatches called for user:", session.user.id);
    setIsLoading(true);
    try {
      const { data, error, status } = await supabase
        .from('batches')
        .select(`
            id, name, sow_date, comments, created_at,
            observations ( id, observation_date, notes, height, photo_url, created_at )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false }) // Order batches newest first
        // Ordering observations here might be complex; sort client-side for reliability
        // .order('observation_date', { referencedTable: 'observations', ascending: false });

      // Handle potential errors (like RLS blocking access if policies are wrong)
      if (error && status !== 406) { // 406 means empty table, not necessarily an error
          console.error("Supabase fetch error:", error);
          throw error;
      }

      if (data) {
          // Map database fields to app fields and sort observations client-side
         const processedBatches = data.map(batch => ({
             id: batch.id,
             user_id: batch.user_id, // Keep user_id if needed elsewhere
             name: batch.name,
             sowDate: batch.sow_date, // Map sow_date -> sowDate
             comments: batch.comments,
             createdAt: batch.created_at,
             observations: (batch.observations || []) // Ensure observations is an array
                .map(obs => ({
                    id: obs.id,
                    batch_id: obs.batch_id,
                    user_id: obs.user_id,
                    date: obs.observation_date, // Map observation_date -> date
                    notes: obs.notes,
                    height: obs.height,
                    photoUri: obs.photo_url, // Map photo_url -> photoUri (for now)
                    createdAt: obs.created_at,
                }))
                // Sort observations newest first
                .sort((a, b) => new Date(b.date) - new Date(a.date)),
         }));
         console.log(`Workspaceed ${processedBatches.length} batches.`);
         setBatches(processedBatches);
      } else {
          setBatches([]); // Set to empty array if no data returned
      }
    } catch (error) {
      console.error("Error fetching batches:", error);
      Alert.alert('Fetch Error', `Could not fetch your batches: ${error.message}`);
      setBatches([]); // Clear batches on error
    } finally {
      setIsLoading(false); // Ensure loading stops
    }
  }, [session]); // Re-fetch if session changes

  // Fetch initial data when the provider mounts and session is available
  useEffect(() => {
    if (session?.user) {
      fetchBatches();
      // TODO: Implement fetching/calculating streak data from Supabase (e.g., from user profile)
      // For now, streak remains local and resets on logout/reinstall
      console.log("Session available, fetching initial data.");
    } else {
      // Clear data and stop loading if user logs out or session is lost
      console.log("No session, clearing data.");
      setBatches([]);
      setStreakData({ streak: 0, lastObservationDate: null }); // Reset local streak
      setIsLoading(false); // Ensure loading is false if no session
    }
  }, [session, fetchBatches]); // Run when session changes

  // Function to add a new batch to Supabase
  const addBatch = async (newBatchData) => {
    if (!session?.user) {
        Alert.alert("Error", "You must be logged in to add a batch.");
        return; // Or throw new Error("User not logged in.");
    }
    // Optional: Add specific loading state for this action
    try {
      console.log("Adding batch:", newBatchData);
      const { data, error } = await supabase
        .from('batches')
        .insert({
          user_id: session.user.id,
          name: newBatchData.name,
          sow_date: newBatchData.sowDate, // Ensure sowDate is ISO string
          comments: newBatchData.comments,
          // created_at and updated_at have defaults in DB
        })
        .select() // Select the newly inserted row
        .single(); // Expect only one row back

      if (error) throw error;

      if (data) {
        // Add the new batch (with empty observations) to the local state for immediate UI update
        const newBatchForState = {
            id: data.id,
            user_id: data.user_id,
            name: data.name,
            sowDate: data.sow_date,
            comments: data.comments,
            createdAt: data.created_at,
            observations: [] // Start with empty observations
        };
        // Prepend and re-sort (although prepending keeps newest first if list was already sorted)
        setBatches(prevBatches => [newBatchForState, ...prevBatches]);
        console.log("Batch added successfully:", data.id);
      }
    } catch (error) {
      console.error("Error adding batch:", error);
      Alert.alert('Save Error', `Failed to add batch: ${error.message}`);
      // Optionally re-throw error if caller needs to handle it
    } finally {
       // Optional: Turn off specific loading state
    }
  };

  // Function to add an observation to Supabase
  const addObservation = async (batchId, observationData) => {
       if (!session?.user) {
           Alert.alert("Error", "You must be logged in to add an observation.");
           return;
       }
        try {
            // **IMPORTANT:** Handling photo uploads requires more work.
            // This example saves the local `photoUri`.
            // A real implementation needs:
            // 1. Function to upload the file from `observationData.photoUri` to Supabase Storage.
            // 2. Get the public URL returned from storage.
            // 3. Save *that URL* to the `photo_url` column below.
            let photoUrlToSave = observationData.photoUri; // Placeholder
            // if (observationData.photoUri) {
            //    photoUrlToSave = await uploadPhotoAndGetUrl(observationData.photoUri); // Implement this
            // }

            console.log("Adding observation for batch:", batchId, observationData);
            const { data, error } = await supabase
                .from('observations')
                .insert({
                    batch_id: batchId,
                    user_id: session.user.id,
                    observation_date: new Date().toISOString(), // Use current time
                    notes: observationData.notes,
                    height: observationData.height,
                    photo_url: photoUrlToSave // Save URL from storage, or local URI for now
                })
                .select()
                .single();

            if (error) throw error;

            if (data) {
                // Update the local state for immediate UI feedback
                const newObservationForState = {
                    id: data.id,
                    batch_id: data.batch_id,
                    user_id: data.user_id,
                    date: data.observation_date,
                    notes: data.notes,
                    height: data.height,
                    photoUri: data.photo_url, // Map url back to uri
                    createdAt: data.created_at,
                };
                setBatches(prevBatches =>
                    prevBatches.map(batch =>
                        batch.id === batchId
                            ? { ...batch, observations: [newObservationForState, ...batch.observations] // Prepend new observation
                                .sort((a, b) => new Date(b.date) - new Date(a.date)) } // Ensure sort order
                            : batch
                    )
                );
                 console.log("Observation added successfully:", data.id);
                 // TODO: Update streak logic - needs to be tied to user profile data in Supabase
                 // For now, local streak update remains:
                 updateStreak(); // Call local streak update
            }

        } catch (error) {
            console.error("Error adding observation:", error);
            Alert.alert('Save Error', `Failed to add observation: ${error.message}`);
        }
    };

  // --- Streak Logic (Still Local - Needs Refactor for Supabase) ---
  // NOTE: This streak data is NOT persistent across devices or sessions without DB integration.
  const updateStreak = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const lastObsDateStr = streakData.lastObservationDate ? streakData.lastObservationDate.split('T')[0] : null;
    if (lastObsDateStr === todayStr) return;
    let newStreak = 1;
    if (lastObsDateStr && isDateYesterday(streakData.lastObservationDate)) {
      newStreak = streakData.streak + 1;
    }
    console.log(`Updating local streak to ${newStreak}`);
    setStreakData({
      streak: newStreak,
      lastObservationDate: new Date().toISOString(),
    });
    // TODO: In a full implementation, save lastObservationDate to the user's profile in Supabase here.
  };
  // TODO: Load streakData.lastObservationDate from user profile on login/fetch.


  // Context Value
  const value = {
    batches,
    isLoading, // Use this for loading states in screens
    addBatch,
    addObservation,
    getBatchById: (batchId) => batches.find(batch => batch.id === batchId), // Still useful client-side
    streakData, // Provide local streak data
    // updateStreak, // If needed externally, though usually called internally by addObservation
    // No longer need requestNotificationPermissions or scheduleDailyReminder here if moved to Settings/handled differently
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
     if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};