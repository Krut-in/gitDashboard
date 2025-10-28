/**
 * Shared TypeScript Types
 * 
 * This file contains type definitions used throughout the application.
 * These types ensure type safety and provide autocompletion in the IDE.
 */

/**
 * User information from GitHub OAuth
 */
export interface GitHubUser {
  name: string;
  email: string;
  image: string;
  username: string;
  avatarUrl: string;
}

/**
 * Complete user session including access token
 * Used for authenticated API calls to GitHub
 */
export interface UserSession {
  user: GitHubUser;
  accessToken: string;
}

/**
 * GitHub repository data
 */
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  private: boolean;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  message: string;
  code?: string;
  status?: number;
}

/**
 * GitHub branch data
 */
export interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

/**
 * Analysis request parameters
 */
export interface AnalysisRequest {
  owner: string;
  repo: string;
  branch: string;
}

/**
 * Analysis metadata
 */
export interface AnalysisMetadata {
  totalCommits: number;
  analyzedCommits: number;
  totalContributors: number;
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

/**
 * Contributor statistics from analysis
 */
export interface Contributor {
  name: string;
  email: string | null;
  githubLogin: string | null;
  githubId: number | null;
  avatarUrl: string | null;
  commitCount: number;
  additions: number;
  deletions: number;
  netLines: number;
  firstCommitDate: string | null;
  lastCommitDate: string | null;
  activeDays: number;
  isMergeCommitter: boolean;
}

/**
 * Commit time data for visualizations
 */
export interface CommitTime {
  date: string;
  timestamp: number;
  author: string;
}

/**
 * Supplementary analysis data
 */
export interface SupplementaryData {
  totalCommits: number;
  analyzedCommits: number;
  dateRange: {
    start: string | null;
    end: string | null;
  };
  commitTimes: CommitTime[];
}

/**
 * Complete analysis result with all data and exports
 */
export interface AnalysisResult {
  contributors: Contributor[];
  supplementary: SupplementaryData;
  exportCSV: string;
  commitsCSV: string;
  warnings: string[];
}

/**
 * Complete analysis response with CSV/text exports (API response format)
 */
export interface AnalysisResponse {
  contributors: any[];
  commitMessages: any[];
  commitTimes: any[];
  filesByAuthor: any[];
  merges: any[];
  warnings: string[];
  metadata: AnalysisMetadata;
  exports: {
    contributorsCSV: string;
    commitMessagesText: string;
    commitTimesText: string;
    filesByAuthorText: string;
    mergesText: string;
  };
}

/**
 * Daily metric data for a single user on a specific date
 */
export interface DailyMetric {
  date: string; // ISO date string (YYYY-MM-DD)
  userId: string;
  userName: string;
  commits: number;
  additions: number;
  deletions: number;
  netLines: number;
}

/**
 * Aggregated weekly metric data
 */
export interface WeeklyMetric {
  weekStart: string; // ISO date string for Monday of the week
  weekLabel: string; // e.g., "Week of May 5, 2024"
  commits: number;
  additions: number;
  deletions: number;
  netLines: number;
}

/**
 * Complete timeline data for a single user
 */
export interface UserTimelineData {
  userId: string;
  userName: string;
  email?: string;
  avatarUrl?: string;
  firstCommitDate: string;
  lastCommitDate: string;
  dailyMetrics: DailyMetric[];
  weeklyMetrics: WeeklyMetric[];
  totalCommits: number;
  totalAdditions: number;
  totalDeletions: number;
  totalNetLines: number;
}

/**
 * Repository timeline data for all users
 */
export interface RepositoryTimeline {
  repoFirstCommit: string;
  repoLastCommit: string;
  users: UserTimelineData[];
  totalCommits: number;
  totalAdditions: number;
  totalDeletions: number;
  totalNetLines: number;
}

/**
 * Aggregated timeline data by time period
 */
export interface AggregatedTimeline {
  date: string; // Start date of the period
  label: string; // Human-readable label
  commits: number;
  additions: number;
  deletions: number;
  netLines: number;
  topContributor?: string;
}

/**
 * User contribution data for heatmap visualization
 */
export interface UserContribution {
  userId: string;
  userName: string;
  email?: string;
  avatarUrl?: string;
  lifetimeStats: {
    commits: number;
    additions: number;
    deletions: number;
    netLines: number;
    firstCommit: string;
    lastCommit: string;
  };
  dailyCommits: { date: string; count: number }[];
  dailyAdditions: { date: string; count: number }[];
  dailyDeletions: { date: string; count: number }[];
  dailyNetLines: { date: string; count: number }[];
  weeklyStats: { week: string; commits: number; netLines: number }[];
}

/**
 * Insights extracted from commit data
 */
export interface Insights {
  // Temporal patterns
  mostActiveDay: { day: string; commits: number };
  mostActiveHour: { hour: number; commits: number };
  quietestPeriod: { start: string; end: string } | null;
  
  // Collaboration patterns
  mostFrequentCollaborators: { user1: string; user2: string; sharedFiles: number }[];
  soloContributors: string[];
  
  // Code patterns
  largestCommit: { sha: string; author: string; additions: number; deletions: number } | null;
  mostEditedFiles: { filename: string; edits: number; contributors: number }[];
  
  // Commit message patterns
  commonCommitTypes: { type: string; count: number }[];
  avgCommitMessageLength: number;
  
  // Work patterns
  weekdayVsWeekend: { weekday: number; weekend: number };
  morningVsEvening: { morning: number; evening: number };
}

/**
 * Advanced analysis response
 */
export interface AdvancedAnalysisResponse {
  timeline: RepositoryTimeline;
  userContributions: UserContribution[];
  insights: Insights;
  metadata: {
    analyzedCommits: number;
    dateRange: {
      start: string;
      end: string;
    };
    generatedAt: string;
  };
}
