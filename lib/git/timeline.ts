/**
 * Git Timeline Data Extraction
 * 
 * Extracts per-day, per-user contribution data from git log.
 * Uses --no-merges flag to ensure accurate attribution.
 * Supports date range filtering and pagination.
 * 
 * UPDATED: Now supports both local git and GitHub API methods.
 */

import { Octokit } from "@octokit/rest";
import { runGit, ensureGitRepo } from "./runGit";
import { DATA_LIMITS, GITHUB_API_LIMITS } from "../constants";
import { fetchCommitsForBranch, type CommitData } from "../github-api-commits";
import type { DailyMetric, UserTimelineData, RepositoryTimeline } from "../types";

export interface TimelineOptions {
  excludeMerges?: boolean;
  since?: string; // ISO date or relative (e.g., "5 years ago")
  until?: string;
  branch?: string;
  maxCommits?: number;
  onProgress?: (message: string, percent: number) => void;
}

interface LocalCommitData {
  sha: string;
  authorName: string;
  authorEmail: string;
  date: string; // ISO string
  additions: number;
  deletions: number;
}

/**
 * Parse git log output with --numstat format
 * Format: hash TAB name TAB email TAB date TAB subject
 * Followed by numstat lines: additions TAB deletions TAB filename
 */
function parseGitLogTimeline(output: string): LocalCommitData[] {
  const commits: LocalCommitData[] = [];
  const lines = output.split('\n');
  
  let currentCommit: {
    sha: string;
    authorName: string;
    authorEmail: string;
    date: string;
  } | null = null;
  let additions = 0;
  let deletions = 0;

  for (const line of lines) {
    if (!line.trim()) {
      // Empty line marks end of commit data
      if (currentCommit) {
        commits.push({
          ...currentCommit,
          additions,
          deletions,
        });
        currentCommit = null;
        additions = 0;
        deletions = 0;
      }
      continue;
    }

    // Check if this is a commit header line (contains tabs but not numstat format)
    if (line.includes('\t') && !line.match(/^\d+\t\d+\t/)) {
      // Save previous commit if exists
      if (currentCommit) {
        commits.push({
          ...currentCommit,
          additions,
          deletions,
        });
        additions = 0;
        deletions = 0;
      }

      const parts = line.split('\t');
      if (parts.length >= 4) {
        const [sha, name, email, date] = parts;
        currentCommit = {
          sha: sha.trim(),
          authorName: name.trim(),
          authorEmail: email.toLowerCase().trim(),
          date: date.trim(),
        };
      }
    } else if (line.match(/^\d+\t\d+\t/) && currentCommit) {
      // numstat line: additions, deletions, filename
      const [addStr, delStr] = line.split('\t');
      const add = parseInt(addStr, 10);
      const del = parseInt(delStr, 10);
      
      if (!isNaN(add) && !isNaN(del)) {
        additions += add;
        deletions += del;
      }
    }
  }

  // Don't forget the last commit
  if (currentCommit) {
    commits.push({
      ...currentCommit,
      additions,
      deletions,
    });
  }

  return commits;
}

/**
 * Calculate date range limits (last 5 years or custom)
 */
function calculateDateRange(options: TimelineOptions): { since?: string; until?: string } {
  const result: { since?: string; until?: string } = {};
  
  if (options.since) {
    result.since = options.since;
  } else {
    // Default to last 5 years
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - DATA_LIMITS.MAX_YEARS);
    result.since = fiveYearsAgo.toISOString().split('T')[0];
  }
  
  if (options.until) {
    result.until = options.until;
  }
  
  return result;
}

/**
 * Group commits by user and date
 */
function groupByUserAndDate(commits: (LocalCommitData | CommitData)[]): Map<string, Map<string, DailyMetric>> {
  const userDateMap = new Map<string, Map<string, DailyMetric>>();

  for (const commit of commits) {
    const userId = commit.authorEmail || commit.authorName;
    const date = commit.date.split('T')[0]; // Extract YYYY-MM-DD

    if (!userDateMap.has(userId)) {
      userDateMap.set(userId, new Map());
    }

    const dateMap = userDateMap.get(userId)!;
    
    if (!dateMap.has(date)) {
      dateMap.set(date, {
        date,
        userId,
        userName: commit.authorName,
        commits: 0,
        additions: 0,
        deletions: 0,
        netLines: 0,
      });
    }

    const metric = dateMap.get(date)!;
    metric.commits++;
    metric.additions += commit.additions;
    metric.deletions += commit.deletions;
    metric.netLines += (commit.additions - commit.deletions);
  }

  return userDateMap;
}

/**
 * Convert grouped data to UserTimelineData
 */
function convertToUserTimeline(
  userDateMap: Map<string, Map<string, DailyMetric>>,
  avatarMap: Map<string, string>
): UserTimelineData[] {
  const users: UserTimelineData[] = [];

  for (const [userId, dateMap] of Array.from(userDateMap.entries())) {
    const dailyMetrics: DailyMetric[] = Array.from(dateMap.values()).sort((a, b) => 
      a.date.localeCompare(b.date)
    );

    if (dailyMetrics.length === 0) continue;

    const firstCommitDate: string = dailyMetrics[0].date;
    const lastCommitDate: string = dailyMetrics[dailyMetrics.length - 1].date;
    
    const totalCommits: number = dailyMetrics.reduce((sum, m) => sum + m.commits, 0);
    const totalAdditions: number = dailyMetrics.reduce((sum, m) => sum + m.additions, 0);
    const totalDeletions: number = dailyMetrics.reduce((sum, m) => sum + m.deletions, 0);
    const totalNetLines: number = dailyMetrics.reduce((sum, m) => sum + m.netLines, 0);

    users.push({
      userId,
      userName: dailyMetrics[0].userName,
      email: userId.includes('@') ? userId : undefined,
      avatarUrl: avatarMap.get(userId),
      firstCommitDate,
      lastCommitDate,
      dailyMetrics,
      weeklyMetrics: [], // Will be computed by aggregation utilities
      totalCommits,
      totalAdditions,
      totalDeletions,
      totalNetLines,
    });
  }

  // Sort by first commit date
  return users.sort((a, b) => 
    a.firstCommitDate.localeCompare(b.firstCommitDate)
  );
}

/**
 * Extract timeline data from git repository
 * 
 * @param repoPath - Absolute path to git repository
 * @param options - Timeline extraction options
 * @returns Repository timeline with per-user daily metrics
 */
export async function extractTimeline(
  repoPath: string,
  options: TimelineOptions = {}
): Promise<RepositoryTimeline> {
  await ensureGitRepo(repoPath);

  const dateRange = calculateDateRange(options);
  
  const args = [
    "log",
    "--use-mailmap",
    "--numstat",
    "--format=%H%x09%aN%x09%aE%x09%aI%x09%s",
    "--date=iso-strict",
  ];

  // CRITICAL: Exclude merge commits for accurate attribution
  if (options.excludeMerges !== false) {
    args.push("--no-merges");
  }

  if (dateRange.since) {
    args.push(`--since=${dateRange.since}`);
  }
  if (dateRange.until) {
    args.push(`--until=${dateRange.until}`);
  }
  if (options.branch) {
    args.push(options.branch);
  }

  // Limit to max commits for performance
  const maxCommits = options.maxCommits || DATA_LIMITS.MAX_COMMITS;
  args.push(`--max-count=${maxCommits}`);

  const { stdout } = await runGit(args, { cwd: repoPath });
  
  if (!stdout.trim()) {
    // No commits in range
    return {
      repoFirstCommit: new Date().toISOString(),
      repoLastCommit: new Date().toISOString(),
      users: [],
      totalCommits: 0,
      totalAdditions: 0,
      totalDeletions: 0,
      totalNetLines: 0,
    };
  }

  const commits = parseGitLogTimeline(stdout);
  const userDateMap = groupByUserAndDate(commits);
  
  // For avatar URLs, we'll need to fetch them separately or use GitHub API
  // For now, create empty map (will be populated by API layer)
  const avatarMap = new Map<string, string>();
  
  const users = convertToUserTimeline(userDateMap, avatarMap);

  // Calculate repository-level totals
  const allDates = commits.map(c => c.date).sort();
  const repoFirstCommit = allDates[0] || new Date().toISOString();
  const repoLastCommit = allDates[allDates.length - 1] || new Date().toISOString();
  
  const totalCommits = commits.length;
  const totalAdditions = commits.reduce((sum, c) => sum + c.additions, 0);
  const totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0);
  const totalNetLines = totalAdditions - totalDeletions;

  return {
    repoFirstCommit,
    repoLastCommit,
    users,
    totalCommits,
    totalAdditions,
    totalDeletions,
    totalNetLines,
  };
}

/**
 * Extract timeline data from GitHub API
 * 
 * @param octokit - Authenticated Octokit instance
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param branch - Branch name
 * @param options - Timeline extraction options
 * @param preFetchedCommits - Optional pre-fetched commits to avoid redundant API calls
 * @returns Repository timeline with per-user daily metrics
 */
export async function extractTimelineFromGitHub(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
  options: TimelineOptions = {},
  preFetchedCommits?: CommitData[]
): Promise<RepositoryTimeline> {
  let commits: CommitData[];

  if (preFetchedCommits && preFetchedCommits.length > 0) {
    // Use pre-fetched commits for efficiency
    commits = preFetchedCommits;
  } else {
    // Fetch commits from GitHub API with merge filtering
    const dateRange = calculateDateRange(options);
    commits = await fetchCommitsForBranch(octokit, owner, repo, branch, {
      since: dateRange.since,
      until: dateRange.until,
      maxCommits: options.maxCommits || GITHUB_API_LIMITS.MAX_COMMITS_PER_REQUEST,
      excludeMerges: options.excludeMerges !== false,
      onProgress: options.onProgress,
    });
  }

  if (commits.length === 0) {
    // No commits in range
    return {
      repoFirstCommit: new Date().toISOString(),
      repoLastCommit: new Date().toISOString(),
      users: [],
      totalCommits: 0,
      totalAdditions: 0,
      totalDeletions: 0,
      totalNetLines: 0,
    };
  }

  // Group commits by user and date
  const userDateMap = groupByUserAndDate(commits);
  
  // For avatar URLs, we can use the GitHub commit author info
  // Build a map of email -> avatar URL from commit data
  const avatarMap = new Map<string, string>();
  for (const commit of commits) {
    // GitHub API commit data may include author avatar
    // We'll populate this in the convertToUserTimeline function
  }
  
  const users = convertToUserTimeline(userDateMap, avatarMap);

  // Calculate repository-level totals
  const allDates = commits.map(c => c.date).sort();
  const repoFirstCommit = allDates[0] || new Date().toISOString();
  const repoLastCommit = allDates[allDates.length - 1] || new Date().toISOString();
  
  const totalCommits = commits.length;
  const totalAdditions = commits.reduce((sum, c) => sum + c.additions, 0);
  const totalDeletions = commits.reduce((sum, c) => sum + c.deletions, 0);
  const totalNetLines = totalAdditions - totalDeletions;

  return {
    repoFirstCommit,
    repoLastCommit,
    users,
    totalCommits,
    totalAdditions,
    totalDeletions,
    totalNetLines,
  };
}

/**
 * Get repository date range (first and last commit)
 */
export async function getRepositoryDateRange(
  repoPath: string,
  branch?: string
): Promise<{ firstCommit: string; lastCommit: string }> {
  await ensureGitRepo(repoPath);

  const args = ["log", "--format=%aI", "--date=iso-strict"];
  if (branch) {
    args.push(branch);
  }

  const { stdout } = await runGit(args, { cwd: repoPath });
  const dates = stdout.trim().split('\n').filter(Boolean);

  if (dates.length === 0) {
    const now = new Date().toISOString();
    return { firstCommit: now, lastCommit: now };
  }

  // Git log returns newest first
  return {
    firstCommit: dates[dates.length - 1],
    lastCommit: dates[0],
  };
}

