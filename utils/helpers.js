// utils/helpers.js
import { format, parseISO, differenceInDays, isToday, isYesterday, isValid } from 'date-fns';

/**
 * Formats a date input (Date object or ISO string) into a readable string.
 * @param {Date | string} dateInput The date to format.
 * @param {string} [formatString='MMM d, yyyy'] The desired date-fns format string. <<<--- CHECK THIS DEFAULT VALUE in your local file too!
 * @returns {string} Formatted date string or 'Invalid Date'.
 */
export const formatDate = (dateInput, formatString = 'MMM d, yyyy') => {
  // *** START DEBUG CHECK ***
  // Explicitly check the format string for an unescaped 'n' BEFORE formatting.
  // This regex looks for 'n' that is NOT preceded or followed by a single quote.
  if (/(?<!')n(?!')/.test(formatString)) {
      // Throw a custom error immediately if a bad 'n' is found.
      throw new Error(`BAD FORMAT STRING DETECTED in formatDate: Format string "${formatString}" contains unescaped 'n'. Check the component calling this function.`);
  }
  // *** END DEBUG CHECK ***

  if (!dateInput) return '';
  try {
    const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput;
    if (!isValid(date)) {
        console.warn("formatDate received invalid date input:", dateInput);
        return 'Invalid Date';
    }
    // If the check above passed, proceed with formatting
    return format(date, formatString);
  } catch (error) {
    // Log original error too, just in case
    console.error(
        `Error formatting date (original catch): Input='${dateInput}', Format='${formatString}'`,
        error
    );
    return 'Invalid Date';
  }
};

// --- Other helper functions ---

export const getDaysSinceSown = (sowDateInput) => {
  if (!sowDateInput) return 0;
  try {
    const sowDate = typeof sowDateInput === 'string' ? parseISO(sowDateInput) : sowDateInput;
    if (!isValid(sowDate)) { console.warn("getDaysSinceSown invalid date:", sowDateInput); return 0; }
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
    const diff = differenceInDays(startOfToday, sowDate);
    return Math.max(0, diff);
  } catch (error) { console.error("Error calculating days since sown:", sowDateInput, error); return 0; }
};

export const isDateToday = (dateInput) => {
  if (!dateInput) return false;
  try { const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput; return isValid(date) && isToday(date); }
  catch { return false; }
};

export const isDateYesterday = (dateInput) => {
   if (!dateInput) return false;
   try { const date = typeof dateInput === 'string' ? parseISO(dateInput) : dateInput; return isValid(date) && isYesterday(date); }
   catch { return false; }
};

export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
};