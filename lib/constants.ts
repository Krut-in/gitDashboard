/**
 * Application Constants
 * 
 * Centralized color scheme and configuration constants for the application.
 * Colors are defined using Tailwind CSS classes for consistency.
 */

/**
 * Metric color scheme for charts and visualizations
 * Uses bright, vibrant colors for better visual impact
 * Commits: Purple, Additions: Emerald Green, Deletions: Red, Net Lines: Sky Blue
 */
export const METRIC_COLORS = {
  commits: {
    primary: 'purple-600',
    light: 'purple-100',
    dark: 'purple-800',
    hex: '#9333ea',
    rgb: 'rgb(147, 51, 234)',
    rgba: (alpha: number) => `rgba(147, 51, 234, ${alpha})`,
  },
  additions: {
    primary: 'emerald-500',
    light: 'emerald-100',
    dark: 'emerald-700',
    hex: '#10b981',
    rgb: 'rgb(16, 185, 129)',
    rgba: (alpha: number) => `rgba(16, 185, 129, ${alpha})`,
  },
  deletions: {
    primary: 'red-500',
    light: 'red-100',
    dark: 'red-700',
    hex: '#ef4444',
    rgb: 'rgb(239, 68, 68)',
    rgba: (alpha: number) => `rgba(239, 68, 68, ${alpha})`,
  },
  netLines: {
    primary: 'sky-500',
    light: 'sky-100',
    dark: 'sky-700',
    hex: '#0ea5e9',
    rgb: 'rgb(14, 165, 233)',
    rgba: (alpha: number) => `rgba(14, 165, 233, ${alpha})`,
  },
} as const;

/**
 * Data limits for performance and pagination
 */
export const DATA_LIMITS = {
  MAX_COMMITS: 10000,
  MAX_YEARS: 5,
  DEFAULT_PAGE_SIZE: 100,
  MAX_CONCURRENT_WORKERS: 8,
  MAX_CONCURRENT_REQUESTS: 3, // For API request queuing
} as const;

/**
 * Time range options for timeline views
 */
export const TIME_RANGES = {
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year',
} as const;

export type TimeRange = typeof TIME_RANGES[keyof typeof TIME_RANGES];

/**
 * Metric types for toggles and displays
 */
export const METRICS = {
  COMMITS: 'commits',
  ADDITIONS: 'additions',
  DELETIONS: 'deletions',
  NET_LINES: 'netLines',
} as const;

export type MetricType = typeof METRICS[keyof typeof METRICS];

/**
 * Default time range for initial views (1 week)
 */
export const DEFAULT_TIME_RANGE: TimeRange = TIME_RANGES.WEEK;

/**
 * Inactive user threshold (days since last commit)
 */
export const INACTIVE_THRESHOLD_DAYS = 30;

/**
 * GitHub-style heatmap constants
 */
export const HEATMAP_CONFIG = {
  CELL_SIZE: 12,
  CELL_GAP: 2,
  MONTHS_TO_SHOW: 6,
  DAYS_PER_WEEK: 7,
} as const;

/**
 * Color intensity thresholds for Gantt chart
 */
export const INTENSITY_THRESHOLDS = {
  COMMITS: 1,
  LINES: 50,
} as const;

/**
 * GitHub API limits and pagination settings
 */
export const GITHUB_API_LIMITS = {
  MAX_COMMITS_PER_REQUEST: 5000,
  COMMITS_PER_PAGE: 100,
  RATE_LIMIT_WARNING_THRESHOLD: 100,
  REQUEST_DELAY_MS: 100,
} as const;

