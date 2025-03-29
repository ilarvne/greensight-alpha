// hooks/usePersistentState.js
import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

function usePersistentState(key, initialValue) {
  const [state, setState] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(true);

  // Load state from AsyncStorage on mount
  useEffect(() => {
    let isMounted = true;
    const loadState = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(key);
        if (storedValue !== null) {
          if (isMounted) setState(JSON.parse(storedValue));
        } else {
           if (isMounted) setState(initialValue); // Set initial if nothing stored
        }
      } catch (error) {
        console.error(`Error loading state for key "${key}" from AsyncStorage:`, error);
        if (isMounted) setState(initialValue); // Fallback to initial value on error
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadState();

    return () => {
      isMounted = false;
    };
  }, [key]); // Only re-run if key changes (shouldn't happen often)

  // Save state to AsyncStorage whenever it changes
  const setPersistentState = useCallback(async (newValue) => {
    try {
       const valueToStore = typeof newValue === 'function'
        ? newValue(state) // Allow function updates like useState
        : newValue;

      setState(valueToStore); // Update local state immediately
      await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error saving state for key "${key}" to AsyncStorage:`, error);
    }
  }, [key, state]); // Include state in dependencies for function updates

  return [state, setPersistentState, isLoading];
}

export default usePersistentState;