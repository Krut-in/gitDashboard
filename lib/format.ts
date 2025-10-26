/**
 * Number and Date Formatting Utilities
 * 
 * Helper functions for formatting numbers, dates, and other display values.
 * Provides consistent formatting across the application with locale support.
 */

/**
 * Format a number with thousand separators
 * Example: 1234567 -> "1,234,567"
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

/**
 * Format a number with sign (+ or -)
 * Example: 123 -> "+123", -45 -> "-45"
 */
export function formatSignedNumber(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${formatNumber(value)}`;
}

/**
 * Format a percentage
 * Example: 0.1234 -> "12.34%"
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format bytes to human-readable size
 * Example: 1536 -> "1.5 KB"
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format a date to short format
 * Example: "2024-01-15T10:30:00Z" -> "Jan 15, 2024"
 */
export function formatDateShort(date: string | Date | null): string {
  if (!date) return 'Unknown';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a date to long format
 * Example: "2024-01-15T10:30:00Z" -> "January 15, 2024 at 10:30 AM"
 */
export function formatDateLong(date: string | Date | null): string {
  if (!date) return 'Unknown';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format a relative time string
 * Example: "2 days ago", "3 hours ago", "just now"
 */
export function formatRelativeTime(date: string | Date | null): string {
  if (!date) return 'Unknown';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  if (diffWeek < 4) return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`;
  if (diffMonth < 12) return `${diffMonth} month${diffMonth > 1 ? 's' : ''} ago`;
  return `${diffYear} year${diffYear > 1 ? 's' : ''} ago`;
}

/**
 * Format duration in milliseconds to human-readable string
 * Example: 65000 -> "1m 5s"
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Truncate text with ellipsis
 * Example: "Long text here" -> "Long text..."
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format commit SHA (short version)
 * Example: "abc123def456..." -> "abc123d"
 */
export function formatSHA(sha: string, length: number = 7): string {
  return sha.substring(0, length);
}

/**
 * Get color for a value in a range (for heatmaps)
 * Returns a Tailwind color class
 */
export function getHeatmapColor(value: number, max: number): string {
  if (max === 0) return 'bg-gray-100';
  
  const ratio = value / max;
  if (ratio === 0) return 'bg-gray-100';
  if (ratio < 0.2) return 'bg-green-200';
  if (ratio < 0.4) return 'bg-green-300';
  if (ratio < 0.6) return 'bg-green-400';
  if (ratio < 0.8) return 'bg-green-500';
  return 'bg-green-600';
}

/**
 * Calculate activity status based on last commit date
 */
export function getActivityStatus(lastCommitDate: string | null): {
  status: 'active' | 'recent' | 'inactive' | 'unknown';
  label: string;
  color: string;
} {
  if (!lastCommitDate) {
    return { status: 'unknown', label: 'Unknown', color: 'text-gray-500' };
  }

  const now = new Date();
  const last = new Date(lastCommitDate);
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays <= 7) {
    return { status: 'active', label: 'Active', color: 'text-green-600' };
  }
  if (diffDays <= 30) {
    return { status: 'recent', label: 'Recent', color: 'text-blue-600' };
  }
  return { status: 'inactive', label: 'Inactive', color: 'text-orange-600' };
}
