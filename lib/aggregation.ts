/**
 * Data Aggregation Utilities
 * 
 * Client-side aggregation of timeline data from daily to weekly, monthly, and quarterly views.
 * Supports filtering by date range and metric type.
 */

import type { DailyMetric, AggregatedTimeline, UserTimelineData, WeeklyMetric } from "./types";
import { TIME_RANGES, type TimeRange } from "./constants";

/**
 * Get Monday of the week for a given date
 */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Get first day of month for a given date
 */
function getFirstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get first day of quarter for a given date
 */
function getFirstOfQuarter(date: Date): Date {
  const month = date.getMonth();
  const quarterMonth = Math.floor(month / 3) * 3;
  return new Date(date.getFullYear(), quarterMonth, 1);
}

/**
 * Get period key based on time range
 */
function getPeriodKey(date: Date, timeRange: TimeRange): string {
  switch (timeRange) {
    case TIME_RANGES.WEEK:
      return getMonday(date).toISOString().split('T')[0];
    case TIME_RANGES.MONTH:
      return getFirstOfMonth(date).toISOString().split('T')[0];
    case TIME_RANGES.QUARTER:
      return getFirstOfQuarter(date).toISOString().split('T')[0];
    case TIME_RANGES.YEAR:
      return `${date.getFullYear()}-01-01`;
    default:
      return date.toISOString().split('T')[0];
  }
}

/**
 * Get human-readable label for period
 */
function getPeriodLabel(periodKey: string, timeRange: TimeRange): string {
  const date = new Date(periodKey);
  
  switch (timeRange) {
    case TIME_RANGES.WEEK:
      return `Week of ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    case TIME_RANGES.MONTH:
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    case TIME_RANGES.QUARTER: {
      const quarter = Math.floor(date.getMonth() / 3) + 1;
      return `Q${quarter} ${date.getFullYear()}`;
    }
    case TIME_RANGES.YEAR:
      return date.getFullYear().toString();
    default:
      return date.toLocaleDateString();
  }
}

/**
 * Aggregate daily metrics to specified time range
 */
export function aggregateTimeline(
  dailyMetrics: DailyMetric[],
  timeRange: TimeRange
): AggregatedTimeline[] {
  const periodMap = new Map<string, {
    commits: number;
    additions: number;
    deletions: number;
    netLines: number;
    contributors: Map<string, number>;
  }>();

  for (const metric of dailyMetrics) {
    const date = new Date(metric.date);
    const periodKey = getPeriodKey(date, timeRange);

    if (!periodMap.has(periodKey)) {
      periodMap.set(periodKey, {
        commits: 0,
        additions: 0,
        deletions: 0,
        netLines: 0,
        contributors: new Map(),
      });
    }

    const period = periodMap.get(periodKey)!;
    period.commits += metric.commits;
    period.additions += metric.additions;
    period.deletions += metric.deletions;
    period.netLines += metric.netLines;

    // Track contributor commits
    const currentCount = period.contributors.get(metric.userName) || 0;
    period.contributors.set(metric.userName, currentCount + metric.commits);
  }

  // Convert to array and find top contributor per period
  const aggregated: AggregatedTimeline[] = [];
  
  for (const [periodKey, data] of Array.from(periodMap.entries()).sort((a, b) => 
    a[0].localeCompare(b[0])
  )) {
    // Find top contributor
    let topContributor: string | undefined;
    let maxCommits = 0;
    
    for (const [contributor, commits] of Array.from(data.contributors.entries())) {
      if (commits > maxCommits) {
        maxCommits = commits;
        topContributor = contributor;
      }
    }

    aggregated.push({
      date: periodKey,
      label: getPeriodLabel(periodKey, timeRange),
      commits: data.commits,
      additions: data.additions,
      deletions: data.deletions,
      netLines: data.netLines,
      topContributor,
    });
  }

  return aggregated;
}

/**
 * Filter timeline data by date range
 */
export function filterByDateRange(
  timeline: AggregatedTimeline[],
  startDate: string,
  endDate: string
): AggregatedTimeline[] {
  return timeline.filter(item => 
    item.date >= startDate && item.date <= endDate
  );
}

/**
 * Get recent time range based on quarters (default: last 3 months)
 */
export function getRecentTimeRange(
  months: number = 3
): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

/**
 * Aggregate user timeline data to weekly metrics
 */
export function aggregateUserToWeekly(user: UserTimelineData): UserTimelineData {
  const weekMap = new Map<string, WeeklyMetric>();

  for (const daily of user.dailyMetrics) {
    const date = new Date(daily.date);
    const monday = getMonday(date);
    const weekKey = monday.toISOString().split('T')[0];

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, {
        weekStart: weekKey,
        weekLabel: `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        commits: 0,
        additions: 0,
        deletions: 0,
        netLines: 0,
      });
    }

    const week = weekMap.get(weekKey)!;
    week.commits += daily.commits;
    week.additions += daily.additions;
    week.deletions += daily.deletions;
    week.netLines += daily.netLines;
  }

  const weeklyMetrics = Array.from(weekMap.values()).sort((a, b) => 
    a.weekStart.localeCompare(b.weekStart)
  );

  return {
    ...user,
    weeklyMetrics,
  };
}

/**
 * Aggregate all users to include weekly metrics
 */
export function aggregateAllUsersToWeekly(
  users: UserTimelineData[]
): UserTimelineData[] {
  return users.map(aggregateUserToWeekly);
}

/**
 * Get date range for a specific period before today
 */
export function getDateRangeForPeriod(
  timeRange: TimeRange,
  periodsBack: number = 0
): { startDate: string; endDate: string } {
  const endDate = new Date();
  const startDate = new Date();

  switch (timeRange) {
    case TIME_RANGES.WEEK:
      startDate.setDate(startDate.getDate() - (7 * (periodsBack + 1)));
      endDate.setDate(endDate.getDate() - (7 * periodsBack));
      break;
    case TIME_RANGES.MONTH:
      startDate.setMonth(startDate.getMonth() - (periodsBack + 1));
      endDate.setMonth(endDate.getMonth() - periodsBack);
      break;
    case TIME_RANGES.QUARTER:
      startDate.setMonth(startDate.getMonth() - (3 * (periodsBack + 1)));
      endDate.setMonth(endDate.getMonth() - (3 * periodsBack));
      break;
    case TIME_RANGES.YEAR:
      startDate.setFullYear(startDate.getFullYear() - (periodsBack + 1));
      endDate.setFullYear(endDate.getFullYear() - periodsBack);
      break;
  }

  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
  };
}

/**
 * Fill gaps in timeline data with zero values
 * Ensures continuous timeline even when there are days with no commits
 */
export function fillTimelineGaps(
  timeline: AggregatedTimeline[],
  startDate: string,
  endDate: string,
  timeRange: TimeRange
): AggregatedTimeline[] {
  if (timeline.length === 0) return [];

  const filled: AggregatedTimeline[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const existingMap = new Map(timeline.map(t => [t.date, t]));

  let current = new Date(start);

  while (current <= end) {
    const periodKey = getPeriodKey(current, timeRange);
    
    if (existingMap.has(periodKey)) {
      filled.push(existingMap.get(periodKey)!);
    } else {
      filled.push({
        date: periodKey,
        label: getPeriodLabel(periodKey, timeRange),
        commits: 0,
        additions: 0,
        deletions: 0,
        netLines: 0,
      });
    }

    // Move to next period
    switch (timeRange) {
      case TIME_RANGES.WEEK:
        current.setDate(current.getDate() + 7);
        break;
      case TIME_RANGES.MONTH:
        current.setMonth(current.getMonth() + 1);
        break;
      case TIME_RANGES.QUARTER:
        current.setMonth(current.getMonth() + 3);
        break;
      case TIME_RANGES.YEAR:
        current.setFullYear(current.getFullYear() + 1);
        break;
    }
  }

  return filled;
}

