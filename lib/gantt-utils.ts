/**
 * Gantt Chart Utility Functions
 * 
 * Utilities for rendering Gantt-style contribution timelines:
 * - Color intensity calculations
 * - Date range calculations
 * - User ordering and filtering
 */

import { INTENSITY_THRESHOLDS, METRIC_COLORS, type MetricType } from "./constants";
import type { DailyMetric, UserTimelineData } from "./types";

/**
 * Calculate color intensity for a metric value
 * Uses logarithmic scaling to handle wide ranges of values
 * 
 * @param value - Metric value (commits, additions, deletions, netLines)
 * @param metric - Type of metric
 * @returns Intensity value between 0.0 and 1.0
 */
export function getColorIntensity(value: number, metric: MetricType): number {
  if (value === 0) return 0;
  
  const threshold =
    metric === "commits"
      ? INTENSITY_THRESHOLDS.COMMITS
      : INTENSITY_THRESHOLDS.LINES;
  
  // Logarithmic scaling: log(value + 1) / log(threshold + 1)
  const intensity = Math.min(Math.log(value + 1) / Math.log(threshold * 10 + 1), 1.0);
  
  return intensity;
}

/**
 * Get color with intensity applied
 * 
 * @param metric - Type of metric
 * @param intensity - Intensity value between 0.0 and 1.0
 * @returns RGBA color string
 */
export function getMetricColor(metric: MetricType, intensity: number): string {
  const colors = {
    commits: METRIC_COLORS.commits,
    additions: METRIC_COLORS.additions,
    deletions: METRIC_COLORS.deletions,
    netLines: METRIC_COLORS.netLines,
  };
  
  const color = colors[metric];
  
  if (intensity === 0) {
    return "rgba(255, 255, 255, 1)"; // White for no activity
  }
  
  // Apply intensity to alpha channel
  const minAlpha = 0.2; // Minimum visibility
  const alpha = minAlpha + (1.0 - minAlpha) * intensity;
  
  return color.rgba(alpha);
}

/**
 * Extract metric value from daily metric based on type
 */
export function getMetricValue(metric: DailyMetric, type: MetricType): number {
  switch (type) {
    case "commits":
      return metric.commits;
    case "additions":
      return metric.additions;
    case "deletions":
      return metric.deletions;
    case "netLines":
      return metric.netLines;
    default:
      return 0;
  }
}

/**
 * Generate date range array for a given period
 * 
 * @param startDate - Start date (ISO string)
 * @param endDate - End date (ISO string)
 * @param intervalDays - Interval in days (default: 1 for daily)
 * @returns Array of date strings
 */
export function generateDateRange(
  startDate: string,
  endDate: string,
  intervalDays: number = 1
): string[] {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  let current = new Date(start);
  
  while (current <= end) {
    dates.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + intervalDays);
  }
  
  return dates;
}

/**
 * Sort users by first commit date (ascending)
 * Users who joined earlier appear at the top
 */
export function sortUsersByJoinDate(users: UserTimelineData[]): UserTimelineData[] {
  return [...users].sort((a, b) =>
    a.firstCommitDate.localeCompare(b.firstCommitDate)
  );
}

/**
 * Check if user is inactive (no commits in last N days)
 * 
 * @param user - User timeline data
 * @param thresholdDays - Number of days to consider inactive (default: 30)
 * @returns true if user is inactive
 */
export function isUserInactive(
  user: UserTimelineData,
  thresholdDays: number = 30
): boolean {
  const lastCommitDate = new Date(user.lastCommitDate);
  const now = new Date();
  const daysSinceLastCommit = Math.floor(
    (now.getTime() - lastCommitDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  return daysSinceLastCommit > thresholdDays;
}

/**
 * Create a map of date -> metric value for efficient lookups
 * 
 * @param dailyMetrics - Array of daily metrics
 * @param metricType - Type of metric to extract
 * @returns Map of date string to metric value
 */
export function createDateValueMap(
  dailyMetrics: DailyMetric[],
  metricType: MetricType
): Map<string, number> {
  const map = new Map<string, number>();
  
  for (const metric of dailyMetrics) {
    const value = getMetricValue(metric, metricType);
    map.set(metric.date, value);
  }
  
  return map;
}

/**
 * Calculate cell dimensions for Gantt chart
 * 
 * @param totalDays - Total number of days to display
 * @param containerWidth - Width of container in pixels
 * @returns Cell width and height in pixels
 */
export function calculateCellDimensions(
  totalDays: number,
  containerWidth: number
): { cellWidth: number; cellHeight: number } {
  // Aim for reasonable cell size
  const minCellWidth = 8;
  const maxCellWidth = 20;
  const cellHeight = 24;
  
  const calculatedWidth = Math.max(
    minCellWidth,
    Math.min(maxCellWidth, Math.floor(containerWidth / totalDays))
  );
  
  return {
    cellWidth: calculatedWidth,
    cellHeight,
  };
}

/**
 * Format date for display in tooltip
 * 
 * @param dateStr - ISO date string
 * @returns Formatted date (e.g., "Jan 15, 2024")
 */
export function formatDateForTooltip(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Calculate visible date range based on current scroll position
 * Useful for virtualization
 * 
 * @param allDates - All dates in the timeline
 * @param scrollLeft - Current scroll position
 * @param cellWidth - Width of each cell
 * @param viewportWidth - Width of viewport
 * @returns Start and end indices of visible dates
 */
export function getVisibleDateRange(
  allDates: string[],
  scrollLeft: number,
  cellWidth: number,
  viewportWidth: number
): { startIndex: number; endIndex: number } {
  const startIndex = Math.max(0, Math.floor(scrollLeft / cellWidth) - 10);
  const endIndex = Math.min(
    allDates.length,
    Math.ceil((scrollLeft + viewportWidth) / cellWidth) + 10
  );
  
  return { startIndex, endIndex };
}

