/**
 * Utility functions to convert PostgreSQL time/date formats to JavaScript/TypeScript compatible formats
 */

/**
 * Converts PostgreSQL TIME format (HH:MM:SS or HH:MM:SS.mmm) to HH:MM format for HTML time input
 * @param pgTime - PostgreSQL time string (e.g., "14:30:00" or "14:30:00.123")
 * @returns Time string in HH:MM format (e.g., "14:30") or empty string if invalid
 * 
 * @example
 * formatTimeForInput("14:30:00") // "14:30"
 * formatTimeForInput("09:15:30.456") // "09:15"
 */
export function formatTimeForInput(pgTime: string | null | undefined): string {
  if (!pgTime) return "";
  
  // Extract HH:MM from formats like "HH:MM:SS" or "HH:MM:SS.mmm"
  const match = pgTime.match(/^(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : "";
}

/**
 * Converts PostgreSQL DATE format (YYYY-MM-DD) to JavaScript Date object
 * @param pgDate - PostgreSQL date string (e.g., "2025-11-17")
 * @returns Date object or null if invalid
 * 
 * @example
 * formatDateForInput("2025-11-17") // "2025-11-17"
 */
export function formatDateForInput(pgDate: string | null | undefined): string {
  if (!pgDate) return "";
  
  // PostgreSQL DATE format is already YYYY-MM-DD which is compatible with HTML date input
  const match = pgDate.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
}

/**
 * Converts PostgreSQL TIMESTAMP format to JavaScript Date object
 * @param pgTimestamp - PostgreSQL timestamp string
 * @returns Date object or null if invalid
 * 
 * @example
 * formatTimestampToDate("2025-11-17 14:30:00") // Date object
 * formatTimestampToDate("2025-11-17T14:30:00Z") // Date object
 */
export function formatTimestampToDate(pgTimestamp: string | null | undefined): Date | null {
  if (!pgTimestamp) return null;
  
  try {
    const date = new Date(pgTimestamp);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Formats a PostgreSQL TIME for display in local format
 * @param pgTime - PostgreSQL time string (e.g., "14:30:00")
 * @param locale - Locale string (default: 'de-DE')
 * @returns Formatted time string (e.g., "14:30")
 * 
 * @example
 * formatTimeForDisplay("14:30:00") // "14:30"
 * formatTimeForDisplay("14:30:00", "en-US") // "2:30 PM"
 */
export function formatTimeForDisplay(pgTime: string | null | undefined, locale: string = 'de-DE'): string {
  if (!pgTime) return "";
  
  const timeStr = formatTimeForInput(pgTime);
  if (!timeStr) return "";
  
  // Create a date object with today's date and the provided time
  const [hours, minutes] = timeStr.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
  
  return date.toLocaleTimeString(locale, { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
}

/**
 * Formats a PostgreSQL DATE for display in local format
 * @param pgDate - PostgreSQL date string (e.g., "2025-11-17")
 * @param locale - Locale string (default: 'de-DE')
 * @returns Formatted date string
 * 
 * @example
 * formatDateForDisplay("2025-11-17") // "17.11.2025"
 * formatDateForDisplay("2025-11-17", "en-US") // "11/17/2025"
 */
export function formatDateForDisplay(pgDate: string | null | undefined, locale: string = 'de-DE'): string {
  if (!pgDate) return "";
  
  const date = new Date(pgDate);
  if (isNaN(date.getTime())) return "";
  
  return date.toLocaleDateString(locale);
}

/**
 * Formats a PostgreSQL TIMESTAMP for display in local format
 * @param pgTimestamp - PostgreSQL timestamp string
 * @param locale - Locale string (default: 'de-DE')
 * @returns Formatted date and time string
 * 
 * @example
 * formatTimestampForDisplay("2025-11-17 14:30:00") // "17.11.2025, 14:30"
 */
export function formatTimestampForDisplay(
  pgTimestamp: string | null | undefined, 
  locale: string = 'de-DE'
): string {
  if (!pgTimestamp) return "";
  
  const date = formatTimestampToDate(pgTimestamp);
  if (!date) return "";
  
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Combines a date and time string into a PostgreSQL-compatible timestamp
 * @param date - Date string in YYYY-MM-DD format
 * @param time - Time string in HH:MM format
 * @returns ISO timestamp string or empty string if invalid
 * 
 * @example
 * combineDateTime("2025-11-17", "14:30") // "2025-11-17T14:30:00.000Z"
 */
export function combineDateTime(date: string, time: string): string {
  if (!date || !time) return "";
  
  try {
    const dateTimeStr = `${date}T${time}:00`;
    const dateObj = new Date(dateTimeStr);
    return isNaN(dateObj.getTime()) ? "" : dateObj.toISOString();
  } catch {
    return "";
  }
}
