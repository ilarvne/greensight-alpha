// utils/helpers.js
import { format, parseISO, differenceInDays, isToday, isYesterday } from 'date-fns';

export const formatDate = (dateString, formatString = 'MMM d, yyyy') => {
  if (!dateString) return '';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : dateString;
    return format(date, formatString);
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return 'Invalid Date';
  }
};

export const getDaysSinceSown = (sowDateString) => {
    if (!sowDateString) return 0;
    try {
        const sowDate = parseISO(sowDateString);
        return differenceInDays(new Date(), sowDate);
    } catch (error) {
        console.error("Error calculating days since sown:", sowDateString, error);
        return 0;
    }
};

export const isDateToday = (dateString) => {
    if (!dateString) return false;
    try {
        return isToday(parseISO(dateString));
    } catch {
        return false;
    }
};

export const isDateYesterday = (dateString) => {
    if (!dateString) return false;
    try {
        return isYesterday(parseISO(dateString));
    } catch {
        return false;
    }
};

// Basic UUID generator
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};