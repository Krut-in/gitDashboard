/**
 * Heatmap Utility Functions
 * 
 * Utilities for GitHub-style contribution heatmaps:
 * - Date to grid position mapping
 * - Color intensity calculations
 * - 6-month window management
 */

import { HEATMAP_CONFIG } from "./constants";

/**
 * Get the week number (0-based) for a date within a year
 */
export function getWeekOfYear(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor(
    (date.getTime() - firstDayOfYear.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.floor(dayOfYear / 7);
}

/**
 * Get day of week (0 = Sunday, 6 = Saturday)
 */
export function getDayOfWeek(date: Date): number {
  return date.getDay();
}

/**
 * Generate a 6-month date grid for heatmap
 * Returns array of weeks, each containing 7 days
 * 
 * @param endDate - End date (defaults to today)
 * @returns Array of weeks with dates
 */
export function generate6MonthGrid(endDate: Date = new Date()): Date[][] {
  const weeks: Date[][] = [];
  const monthsToShow = HEATMAP_CONFIG.MONTHS_TO_SHOW;
  
  // Start from 6 months ago
  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - monthsToShow);
  
  // Find the Sunday before start date
  const firstSunday = new Date(startDate);
  const dayOfWeek = firstSunday.getDay();
  firstSunday.setDate(firstSunday.getDate() - dayOfWeek);
  
  // Generate weeks
  let currentDate = new Date(firstSunday);
  
  while (currentDate <= endDate) {
    const week: Date[] = [];
    
    for (let day = 0; day < 7; day++) {
      week.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    weeks.push(week);
  }
  
  return weeks;
}

/**
 * Calculate color intensity for heatmap cell
 * 
 * @param value - Count value (commits, lines, etc.)
 * @param maxValue - Maximum value in the dataset
 * @returns Intensity level (0-4)
 */
export function getHeatmapIntensity(value: number, maxValue: number): number {
  if (value === 0) return 0;
  if (maxValue === 0) return 0;
  
  const ratio = value / maxValue;
  
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

/**
 * Get color class for heatmap intensity
 * Using Sunset Code theme colors: teal (primary activity), orange, amber, sky
 * 
 * @param intensity - Intensity level (0-4) where 0 is no activity and 4 is maximum activity
 * @param colorScheme - Color scheme name matching the Sunset Code theme
 * @returns Tailwind CSS class name for the heatmap cell
 * 
 * @example
 * getHeatmapColorClass(0, "teal") // Returns "bg-gray-100" (no activity)
 * getHeatmapColorClass(4, "teal") // Returns "bg-teal-800" (maximum activity)
 */
export function getHeatmapColorClass(
  intensity: number,
  colorScheme: "green" | "orange" | "red" | "amber" | "teal" | "sky"
): string {
  // Validate intensity range
  const validIntensity = Math.max(0, Math.min(4, Math.floor(intensity)));
  
  const schemes = {
    // For backward compatibility, "green" maps to teal (Sunset Code theme)
    green: ["bg-gray-100", "bg-teal-200", "bg-teal-400", "bg-teal-600", "bg-teal-800"],
    teal: ["bg-gray-100", "bg-teal-200", "bg-teal-400", "bg-teal-600", "bg-teal-800"],
    sky: ["bg-gray-100", "bg-sky-200", "bg-sky-400", "bg-sky-600", "bg-sky-800"],
    orange: ["bg-gray-100", "bg-orange-200", "bg-orange-400", "bg-orange-600", "bg-orange-800"],
    red: ["bg-gray-100", "bg-red-200", "bg-red-400", "bg-red-600", "bg-red-800"],
    amber: ["bg-gray-100", "bg-amber-200", "bg-amber-400", "bg-amber-600", "bg-amber-800"],
  };
  
  // Fallback to gray if scheme is invalid
  const scheme = schemes[colorScheme];
  if (!scheme) {
    console.warn(`Invalid color scheme: ${colorScheme}. Falling back to gray.`);
    return "bg-gray-100";
  }
  
  return scheme[validIntensity];
}

/**
 * Extract month labels for heatmap
 * 
 * @param weeks - Array of weeks
 * @returns Array of month labels with positions
 */
export function getMonthLabels(weeks: Date[][]): { label: string; weekIndex: number }[] {
  const labels: { label: string; weekIndex: number }[] = [];
  let lastMonth = -1;
  
  weeks.forEach((week, weekIndex) => {
    const firstDay = week[0];
    const month = firstDay.getMonth();
    
    if (month !== lastMonth) {
      labels.push({
        label: firstDay.toLocaleDateString("en-US", { month: "short" }),
        weekIndex,
      });
      lastMonth = month;
    }
  });
  
  return labels;
}

/**
 * Create a map of date -> value for efficient lookups
 * 
 * @param dailyData - Array of { date, count }
 * @returns Map of date string to count
 */
export function createDateMap(
  dailyData: { date: string; count: number }[]
): Map<string, number> {
  const map = new Map<string, number>();
  
  for (const item of dailyData) {
    map.set(item.date, item.count);
  }
  
  return map;
}

/**
 * Get value for a specific date from map
 * 
 * @param dateMap - Map of dates to values
 * @param date - Date to lookup
 * @returns Value or 0 if not found
 */
export function getDateValue(dateMap: Map<string, number>, date: Date): number {
  const dateStr = date.toISOString().split("T")[0];
  return dateMap.get(dateStr) || 0;
}

/**
 * Calculate max value in dataset for normalization
 * 
 * @param dailyData - Array of { date, count }
 * @returns Maximum count value
 */
export function getMaxValue(dailyData: { date: string; count: number }[]): number {
  if (dailyData.length === 0) return 0;
  return Math.max(...dailyData.map((d) => d.count));
}

/**
 * Navigate to previous/next 6-month period
 * 
 * @param currentEndDate - Current end date
 * @param direction - "prev" or "next"
 * @returns New end date
 */
export function navigate6MonthWindow(
  currentEndDate: Date,
  direction: "prev" | "next"
): Date {
  const newDate = new Date(currentEndDate);
  const months = direction === "prev" ? -6 : 6;
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
}

/**
 * Check if navigation is possible
 * 
 * @param currentEndDate - Current end date
 * @param direction - "prev" or "next"
 * @param firstCommitDate - User's first commit date
 * @param lastCommitDate - User's last commit date
 * @returns true if navigation is possible
 */
export function canNavigate(
  currentEndDate: Date,
  direction: "prev" | "next",
  firstCommitDate: string,
  lastCommitDate: string
): boolean {
  const first = new Date(firstCommitDate);
  const last = new Date(lastCommitDate);
  
  if (direction === "prev") {
    const sixMonthsBefore = new Date(currentEndDate);
    sixMonthsBefore.setMonth(sixMonthsBefore.getMonth() - 6);
    return sixMonthsBefore >= first;
  } else {
    return currentEndDate < last;
  }
}

