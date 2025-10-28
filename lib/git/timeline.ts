/**
 * Git Timeline Data Extraction
 * 
 * Extracts per-day, per-user contribution data from git log.
 * Uses --no-merges flag to ensure accurate attribution.
 * Supports date range filtering and pagination.
 */

import { runGit, ensureGitRepo } from "./runGit";
import { DATA_LIMITS } from "../constants";
import type { DailyMetric, UserTimelineData, RepositoryTimeline } from "../types";

export interface TimelineOptions {
  excludeMerges?: boolean;
  since?: string; // ISO date or relative (e.g., "5 years ago")
  until?: string;
  branch?: string;
  maxCommits?: number;
}

interface CommitData {
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
function parseGitLogTimeline(output: string): CommitData[] {
  const commits: CommitData[] = [];
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
function groupByUserAndDate(commits: CommitData[]): Map<string, Map<string, DailyMetric>> {
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

  for (const [userId, dateMap] of userDateMap.entries()) {
    const dailyMetrics = Array.from(dateMap.values()).sort((a, b) => 
      a.date.localeCompare(b.date)
    );

    if (dailyMetrics.length === 0) continue;

    const firstCommitDate = dailyMetrics[0].date;
    const lastCommitDate = dailyMetrics[dailyMetrics.length - 1].date;
    
    const totalCommits = dailyMetrics.reduce((sum, m) => sum + m.commits, 0);
    const totalAdditions = dailyMetrics.reduce((sum, m) => sum + m.additions, 0);
    const totalDeletions = dailyMetrics.reduce((sum, m) => sum + m.deletions, 0);
    const totalNetLines = dailyMetrics.reduce((sum, m) => sum + m.netLines, 0);

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

