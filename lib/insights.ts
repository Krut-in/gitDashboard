/**
 * Insights Extraction from Commit Data
 * 
 * Analyzes commit patterns to extract meaningful insights for managers.
 * Includes temporal patterns, collaboration patterns, and code quality indicators.
 */

import type { Insights, UserTimelineData } from "./types";

interface CommitDetails {
  sha: string;
  author: string;
  date: string;
  message: string;
  additions: number;
  deletions: number;
  files: string[];
}

/**
 * Extract day of week from ISO date string
 */
function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr).getDay();
}

/**
 * Extract hour from ISO date string
 */
function getHour(dateStr: string): number {
  return new Date(dateStr).getHours();
}

/**
 * Check if date is weekend
 */
function isWeekend(dateStr: string): boolean {
  const day = getDayOfWeek(dateStr);
  return day === 0 || day === 6;
}

/**
 * Parse commit type from conventional commit message
 */
function parseCommitType(message: string): string {
  const match = message.match(/^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?:/i);
  return match ? match[1].toLowerCase() : 'other';
}

/**
 * Find most active day based on commit count
 */
function findMostActiveDay(users: UserTimelineData[]): { day: string; commits: number } {
  const dayCount = new Map<string, number>();
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  for (const user of users) {
    for (const metric of user.dailyMetrics) {
      const dayOfWeek = getDayOfWeek(metric.date);
      const dayName = dayNames[dayOfWeek];
      dayCount.set(dayName, (dayCount.get(dayName) || 0) + metric.commits);
    }
  }

  let mostActiveDay = 'Monday';
  let maxCommits = 0;

  for (const [day, commits] of Array.from(dayCount.entries())) {
    if (commits > maxCommits) {
      maxCommits = commits;
      mostActiveDay = day;
    }
  }

  return { day: mostActiveDay, commits: maxCommits };
}

/**
 * Find most active hour based on commit timestamps
 */
function findMostActiveHour(commits: CommitDetails[]): { hour: number; commits: number } {
  const hourCount = new Map<number, number>();

  for (const commit of commits) {
    const hour = getHour(commit.date);
    hourCount.set(hour, (hourCount.get(hour) || 0) + 1);
  }

  let mostActiveHour = 9;
  let maxCommits = 0;

  for (const [hour, commits] of Array.from(hourCount.entries())) {
    if (commits > maxCommits) {
      maxCommits = commits;
      mostActiveHour = hour;
    }
  }

  return { hour: mostActiveHour, commits: maxCommits };
}

/**
 * Find quietest period (longest gap without commits)
 */
function findQuietestPeriod(users: UserTimelineData[]): { start: string; end: string } | null {
  const allDates: string[] = [];

  for (const user of users) {
    for (const metric of user.dailyMetrics) {
      allDates.push(metric.date);
    }
  }

  if (allDates.length === 0) return null;

  const uniqueDates = Array.from(new Set(allDates)).sort();
  
  let maxGapStart = '';
  let maxGapEnd = '';
  let maxGapDays = 0;

  for (let i = 0; i < uniqueDates.length - 1; i++) {
    const current = new Date(uniqueDates[i]);
    const next = new Date(uniqueDates[i + 1]);
    const gapDays = Math.floor((next.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));

    if (gapDays > maxGapDays) {
      maxGapDays = gapDays;
      maxGapStart = uniqueDates[i];
      maxGapEnd = uniqueDates[i + 1];
    }
  }

  if (maxGapDays <= 1) return null;

  return { start: maxGapStart, end: maxGapEnd };
}

/**
 * Find solo contributors (users who don't share files with others)
 */
function findSoloContributors(
  users: UserTimelineData[],
  fileContributors: Map<string, Set<string>>
): string[] {
  const soloContributors: string[] = [];

  for (const user of users) {
    let hasSharedFiles = false;

    for (const contributors of Array.from(fileContributors.values())) {
      if (contributors.has(user.userName) && contributors.size > 1) {
        hasSharedFiles = true;
        break;
      }
    }

    if (!hasSharedFiles && user.totalCommits > 0) {
      soloContributors.push(user.userName);
    }
  }

  return soloContributors;
}

/**
 * Calculate weekday vs weekend commit distribution
 */
function calculateWeekdayVsWeekend(users: UserTimelineData[]): { weekday: number; weekend: number } {
  let weekdayCommits = 0;
  let weekendCommits = 0;

  for (const user of users) {
    for (const metric of user.dailyMetrics) {
      if (isWeekend(metric.date)) {
        weekendCommits += metric.commits;
      } else {
        weekdayCommits += metric.commits;
      }
    }
  }

  return { weekday: weekdayCommits, weekend: weekendCommits };
}

/**
 * Calculate morning vs evening commit distribution
 */
function calculateMorningVsEvening(commits: CommitDetails[]): { morning: number; evening: number } {
  let morningCommits = 0;
  let eveningCommits = 0;

  for (const commit of commits) {
    const hour = getHour(commit.date);
    if (hour >= 6 && hour < 18) {
      morningCommits++;
    } else {
      eveningCommits++;
    }
  }

  return { morning: morningCommits, evening: eveningCommits };
}

/**
 * Parse commit types from commit messages
 */
function analyzeCommitTypes(commits: CommitDetails[]): { type: string; count: number }[] {
  const typeCount = new Map<string, number>();

  for (const commit of commits) {
    const type = parseCommitType(commit.message);
    typeCount.set(type, (typeCount.get(type) || 0) + 1);
  }

  return Array.from(typeCount.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 types
}

/**
 * Calculate average commit message length
 */
function calculateAvgMessageLength(commits: CommitDetails[]): number {
  if (commits.length === 0) return 0;

  const totalLength = commits.reduce((sum, commit) => {
    // Get first line of commit message
    const firstLine = commit.message.split('\n')[0];
    return sum + firstLine.length;
  }, 0);

  return Math.round(totalLength / commits.length);
}

/**
 * Find largest commit by changes
 */
function findLargestCommit(commits: CommitDetails[]): { sha: string; author: string; additions: number; deletions: number } | null {
  if (commits.length === 0) return null;

  let largest = commits[0];
  let maxChanges = commits[0].additions + commits[0].deletions;

  for (const commit of commits) {
    const changes = commit.additions + commit.deletions;
    if (changes > maxChanges) {
      maxChanges = changes;
      largest = commit;
    }
  }

  return {
    sha: largest.sha,
    author: largest.author,
    additions: largest.additions,
    deletions: largest.deletions,
  };
}

/**
 * Extract comprehensive insights from timeline data and commit details
 * 
 * @param users - User timeline data
 * @param commits - Detailed commit information
 * @param fileContributors - Map of files to contributors
 * @returns Insights object with patterns and metrics
 */
export function extractInsights(
  users: UserTimelineData[],
  commits: CommitDetails[],
  fileContributors: Map<string, Set<string>> = new Map()
): Insights {
  return {
    // Temporal patterns
    mostActiveDay: findMostActiveDay(users),
    mostActiveHour: findMostActiveHour(commits),
    quietestPeriod: findQuietestPeriod(users),
    
    // Collaboration patterns
    mostFrequentCollaborators: [], // Will be implemented with file-level data
    soloContributors: findSoloContributors(users, fileContributors),
    
    // Code patterns
    largestCommit: findLargestCommit(commits),
    mostEditedFiles: [], // Will be implemented with file-level data
    
    // Commit message patterns
    commonCommitTypes: analyzeCommitTypes(commits),
    avgCommitMessageLength: calculateAvgMessageLength(commits),
    
    // Work patterns
    weekdayVsWeekend: calculateWeekdayVsWeekend(users),
    morningVsEvening: calculateMorningVsEvening(commits),
  };
}

/**
 * Extract insights from simplified user timeline data only
 * (when detailed commit info is not available)
 */
export function extractBasicInsights(users: UserTimelineData[]): Insights {
  return {
    // Temporal patterns
    mostActiveDay: findMostActiveDay(users),
    mostActiveHour: { hour: 10, commits: 0 }, // Default value
    quietestPeriod: findQuietestPeriod(users),
    
    // Collaboration patterns
    mostFrequentCollaborators: [],
    soloContributors: [],
    
    // Code patterns
    largestCommit: null,
    mostEditedFiles: [],
    
    // Commit message patterns
    commonCommitTypes: [],
    avgCommitMessageLength: 0,
    
    // Work patterns
    weekdayVsWeekend: calculateWeekdayVsWeekend(users),
    morningVsEvening: { morning: 0, evening: 0 },
  };
}

