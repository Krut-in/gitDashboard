/**
 * Individual User Metrics Extraction
 * 
 * Extracts detailed contribution metrics for individual users.
 * Used for GitHub-style heatmaps and weekly bar charts.
 * 
 * UPDATED: Now supports both local git and GitHub API methods.
 */

import { Octokit } from "@octokit/rest";
import { runGit, ensureGitRepo } from "./runGit";
import { fetchCommitsForBranch } from "../github-api-commits";
import type { UserContribution } from "../types";

export interface UserMetricsOptions {
  since?: string;
  until?: string;
  branch?: string;
}

interface DailyData {
  date: string;
  commits: number;
  additions: number;
  deletions: number;
  netLines: number;
}

/**
 * Parse git log for a specific user
 */
async function getUserCommitData(
  repoPath: string,
  userEmail: string,
  options: UserMetricsOptions
): Promise<DailyData[]> {
  const args = [
    "log",
    `--author=${userEmail}`,
    "--no-merges", // Exclude merge commits
    "--use-mailmap",
    "--numstat",
    "--format=%aI%x09%H",
    "--date=iso-strict",
  ];

  if (options.since) args.push(`--since=${options.since}`);
  if (options.until) args.push(`--until=${options.until}`);
  if (options.branch) args.push(options.branch);

  const { stdout } = await runGit(args, { cwd: repoPath });
  
  if (!stdout.trim()) {
    return [];
  }

  const dailyMap = new Map<string, DailyData>();
  const lines = stdout.split('\n');
  let currentDate: string | null = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    // Check for commit header (date TAB hash)
    if (line.includes('\t') && !line.match(/^\d+\t\d+\t/)) {
      const [dateStr] = line.split('\t');
      currentDate = dateStr.split('T')[0]; // Extract YYYY-MM-DD
      
      if (!dailyMap.has(currentDate)) {
        dailyMap.set(currentDate, {
          date: currentDate,
          commits: 0,
          additions: 0,
          deletions: 0,
          netLines: 0,
        });
      }
      
      dailyMap.get(currentDate)!.commits++;
    } else if (line.match(/^\d+\t\d+\t/) && currentDate) {
      // numstat line
      const [addStr, delStr] = line.split('\t');
      const add = parseInt(addStr, 10);
      const del = parseInt(delStr, 10);
      
      if (!isNaN(add) && !isNaN(del)) {
        const data = dailyMap.get(currentDate)!;
        data.additions += add;
        data.deletions += del;
        data.netLines += (add - del);
      }
    }
  }

  return Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate weekly statistics from daily data
 */
function calculateWeeklyStats(
  dailyData: DailyData[]
): { week: string; commits: number; netLines: number }[] {
  const weekMap = new Map<string, { commits: number; netLines: number }>();

  for (const day of dailyData) {
    const date = new Date(day.date);
    
    // Find Monday of the week
    const dayOfWeek = date.getDay();
    const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek; // Adjust to Monday
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    
    const weekKey = monday.toISOString().split('T')[0];
    
    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, { commits: 0, netLines: 0 });
    }
    
    const week = weekMap.get(weekKey)!;
    week.commits += day.commits;
    week.netLines += day.netLines;
  }

  return Array.from(weekMap.entries())
    .map(([week, stats]) => ({ week, ...stats }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

/**
 * Extract comprehensive metrics for a single user
 * 
 * @param repoPath - Absolute path to git repository
 * @param userName - User's name
 * @param userEmail - User's email
 * @param avatarUrl - Optional avatar URL
 * @param options - Extraction options
 * @returns Complete user contribution data
 */
export async function extractUserMetrics(
  repoPath: string,
  userName: string,
  userEmail: string,
  avatarUrl?: string,
  options: UserMetricsOptions = {}
): Promise<UserContribution> {
  await ensureGitRepo(repoPath);

  const dailyData = await getUserCommitData(repoPath, userEmail, options);
  
  if (dailyData.length === 0) {
    // User has no commits in the specified range
    return {
      userId: userEmail,
      userName,
      email: userEmail,
      avatarUrl,
      lifetimeStats: {
        commits: 0,
        additions: 0,
        deletions: 0,
        netLines: 0,
        firstCommit: new Date().toISOString(),
        lastCommit: new Date().toISOString(),
      },
      dailyCommits: [],
      dailyAdditions: [],
      dailyDeletions: [],
      dailyNetLines: [],
      weeklyStats: [],
    };
  }

  // Calculate lifetime stats
  const totalCommits = dailyData.reduce((sum, d) => sum + d.commits, 0);
  const totalAdditions = dailyData.reduce((sum, d) => sum + d.additions, 0);
  const totalDeletions = dailyData.reduce((sum, d) => sum + d.deletions, 0);
  const totalNetLines = dailyData.reduce((sum, d) => sum + d.netLines, 0);
  const firstCommit = dailyData[0].date;
  const lastCommit = dailyData[dailyData.length - 1].date;

  // Calculate weekly stats
  const weeklyStats = calculateWeeklyStats(dailyData);

  // Prepare daily metrics by type
  const dailyCommits = dailyData.map(d => ({ date: d.date, count: d.commits }));
  const dailyAdditions = dailyData.map(d => ({ date: d.date, count: d.additions }));
  const dailyDeletions = dailyData.map(d => ({ date: d.date, count: d.deletions }));
  const dailyNetLines = dailyData.map(d => ({ date: d.date, count: d.netLines }));

  return {
    userId: userEmail,
    userName,
    email: userEmail,
    avatarUrl,
    lifetimeStats: {
      commits: totalCommits,
      additions: totalAdditions,
      deletions: totalDeletions,
      netLines: totalNetLines,
      firstCommit,
      lastCommit,
    },
    dailyCommits,
    dailyAdditions,
    dailyDeletions,
    dailyNetLines,
    weeklyStats,
  };
}

/**
 * Extract comprehensive metrics for a single user from GitHub API
 * 
 * @param octokit - Authenticated Octokit instance
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param branch - Branch name
 * @param userName - User's name
 * @param userEmail - User's email
 * @param avatarUrl - Optional avatar URL
 * @param options - Extraction options
 * @returns Complete user contribution data
 */
export async function extractUserMetricsFromGitHub(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
  userName: string,
  userEmail: string,
  avatarUrl?: string,
  options: UserMetricsOptions = {}
): Promise<UserContribution> {
  // Fetch all commits for the branch
  const allCommits = await fetchCommitsForBranch(octokit, owner, repo, branch, {
    since: options.since,
    until: options.until,
    maxCommits: 10000, // Higher limit for user metrics
    excludeMerges: true,
  });

  // Filter commits by this specific user (by email)
  const userCommits = allCommits.filter(
    commit => commit.authorEmail.toLowerCase() === userEmail.toLowerCase()
  );

  if (userCommits.length === 0) {
    // User has no commits in the specified range
    return {
      userId: userEmail,
      userName,
      email: userEmail,
      avatarUrl,
      lifetimeStats: {
        commits: 0,
        additions: 0,
        deletions: 0,
        netLines: 0,
        firstCommit: new Date().toISOString(),
        lastCommit: new Date().toISOString(),
      },
      dailyCommits: [],
      dailyAdditions: [],
      dailyDeletions: [],
      dailyNetLines: [],
      weeklyStats: [],
    };
  }

  // Group commits by date
  const dailyMap = new Map<string, DailyData>();
  
  for (const commit of userCommits) {
    const date = commit.date.split('T')[0]; // Extract YYYY-MM-DD
    
    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        date,
        commits: 0,
        additions: 0,
        deletions: 0,
        netLines: 0,
      });
    }
    
    const data = dailyMap.get(date)!;
    data.commits++;
    data.additions += commit.additions;
    data.deletions += commit.deletions;
    data.netLines += (commit.additions - commit.deletions);
  }

  const dailyData = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Calculate lifetime stats
  const totalCommits = dailyData.reduce((sum, d) => sum + d.commits, 0);
  const totalAdditions = dailyData.reduce((sum, d) => sum + d.additions, 0);
  const totalDeletions = dailyData.reduce((sum, d) => sum + d.deletions, 0);
  const totalNetLines = dailyData.reduce((sum, d) => sum + d.netLines, 0);
  const firstCommit = dailyData[0].date;
  const lastCommit = dailyData[dailyData.length - 1].date;

  // Calculate weekly stats
  const weeklyStats = calculateWeeklyStats(dailyData);

  // Prepare daily metrics by type
  const dailyCommits = dailyData.map(d => ({ date: d.date, count: d.commits }));
  const dailyAdditions = dailyData.map(d => ({ date: d.date, count: d.additions }));
  const dailyDeletions = dailyData.map(d => ({ date: d.date, count: d.deletions }));
  const dailyNetLines = dailyData.map(d => ({ date: d.date, count: d.netLines }));

  return {
    userId: userEmail,
    userName,
    email: userEmail,
    avatarUrl,
    lifetimeStats: {
      commits: totalCommits,
      additions: totalAdditions,
      deletions: totalDeletions,
      netLines: totalNetLines,
      firstCommit,
      lastCommit,
    },
    dailyCommits,
    dailyAdditions,
    dailyDeletions,
    dailyNetLines,
    weeklyStats,
  };
}

/**
 * Extract metrics for all users in repository
 * 
 * @param repoPath - Absolute path to git repository
 * @param users - Array of user info (name, email, avatarUrl)
 * @param options - Extraction options
 * @returns Array of user contributions
 */
export async function extractAllUserMetrics(
  repoPath: string,
  users: { name: string; email: string; avatarUrl?: string }[],
  options: UserMetricsOptions = {}
): Promise<UserContribution[]> {
  await ensureGitRepo(repoPath);

  const userMetrics: UserContribution[] = [];

  for (const user of users) {
    try {
      const metrics = await extractUserMetrics(
        repoPath,
        user.name,
        user.email,
        user.avatarUrl,
        options
      );
      userMetrics.push(metrics);
    } catch (error) {
      console.error(`Failed to extract metrics for ${user.name}:`, error);
      // Continue with other users
    }
  }

  // Sort by first commit date
  return userMetrics.sort((a, b) => 
    a.lifetimeStats.firstCommit.localeCompare(b.lifetimeStats.firstCommit)
  );
}

