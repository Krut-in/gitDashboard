/**
 * Date Utilities
 * 
 * Utility functions for parsing, formatting, and calculating differences between dates.
 * All dates are handled in UTC to ensure consistency across timezones.
 */

/**
 * Parse a date string to UTC Date object
 * Returns null if parsing fails
 */
export function parseUTC(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    return date;
  } catch {
    return null;
  }
}

/**
 * Calculate the difference between two dates in days
 * Returns the absolute number of days between the dates
 */
export function daysDifference(date1: Date | null, date2: Date | null): number {
  if (!date1 || !date2) return 0;
  
  const diffMs = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format a date to ISO 8601 string (UTC)
 */
export function formatISO(date: Date | null): string {
  if (!date) return '';
  return date.toISOString();
}

/**
 * Format a date to human-readable string
 */
export function formatHuman(date: Date | null): string {
  if (!date) return 'Unknown';
  
  return date.toLocaleString('en-US', {
    timeZone: 'UTC',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Get the minimum date from an array of dates
 */
export function minDate(dates: (Date | null)[]): Date | null {
  const validDates = dates.filter((d): d is Date => d !== null);
  if (validDates.length === 0) return null;
  
  return new Date(Math.min(...validDates.map(d => d.getTime())));
}

/**
 * Get the maximum date from an array of dates
 */
export function maxDate(dates: (Date | null)[]): Date | null {
  const validDates = dates.filter((d): d is Date => d !== null);
  if (validDates.length === 0) return null;
  
  return new Date(Math.max(...validDates.map(d => d.getTime())));
}

/**
 * Check if a date is valid
 */
export function isValidDate(date: any): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}
