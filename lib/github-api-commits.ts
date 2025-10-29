/**
 * GitHub API Commit Fetching Utilities
 * 
 * Handles paginated commit fetching from GitHub REST API.
 * Filters merge commits and extracts detailed statistics.
 * Replaces local git log and git blame commands.
 */

import { Octokit } from '@octokit/rest';
import { handleCommitFetchError, handleEmptyRepository, handleOnlyMergeCommits } from './api-errors';
import { calculateProgress } from './progress-tracker';

export interface CommitData {
  sha: string;
  authorName: string;
  authorEmail: string;
  date: string; // ISO string
  additions: number;
  deletions: number;
}

export interface FetchCommitsOptions {
  since?: string; // ISO date or Date object
  until?: string; // ISO date or Date object
  maxCommits?: number; // Maximum commits to fetch (default: 5000)
  excludeMerges?: boolean; // Filter out merge commits (default: true)
  onProgress?: (message: string, percent: number) => void;
}

const COMMITS_PER_PAGE = 100;
const DEFAULT_MAX_COMMITS = 5000;

/**
 * Fetch commits for a specific branch with pagination and merge filtering
 * 
 * @param octokit - Authenticated Octokit instance
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param branch - Branch name (or SHA)
 * @param options - Fetch options including date range and callbacks
 * @returns Array of commit data with stats
 */
export async function fetchCommitsForBranch(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch: string,
  options: FetchCommitsOptions = {}
): Promise<CommitData[]> {
  const {
    since,
    until,
    maxCommits = DEFAULT_MAX_COMMITS,
    excludeMerges = true,
    onProgress,
  } = options;

  const commits: CommitData[] = [];
  let page = 1;
  let hasMore = true;
  let totalFetched = 0;

  try {
    while (hasMore && commits.length < maxCommits) {
      if (onProgress) {
        const estimatedTotal = Math.min(maxCommits, totalFetched + COMMITS_PER_PAGE);
        const percent = calculateProgress(commits.length, estimatedTotal, 0.8);
        onProgress(`Fetching commits (page ${page})...`, percent);
      }

      // Fetch commits page
      const response = await octokit.repos.listCommits({
        owner,
        repo,
        sha: branch,
        per_page: COMMITS_PER_PAGE,
        page,
        ...(since && { since: new Date(since).toISOString() }),
        ...(until && { until: new Date(until).toISOString() }),
      });

      if (response.data.length === 0) {
        hasMore = false;
        break;
      }

      totalFetched += response.data.length;

      // Process commits
      for (const commit of response.data) {
        // Stop if we've reached the maximum
        if (commits.length >= maxCommits) {
          hasMore = false;
          break;
        }

        // Filter merge commits if requested
        if (excludeMerges && commit.parents.length >= 2) {
          continue; // Skip merge commits
        }

        // GitHub API list commits doesn't include stats, need to fetch details
        // To optimize, we'll fetch in batch or use the stats if available
        const additions = (commit.commit as any).stats?.additions || 0;
        const deletions = (commit.commit as any).stats?.deletions || 0;

        commits.push({
          sha: commit.sha,
          authorName: commit.commit.author?.name || 'Unknown',
          authorEmail: (commit.commit.author?.email || '').toLowerCase(),
          date: commit.commit.author?.date || new Date().toISOString(),
          additions,
          deletions,
        });
      }

      // Check if there are more pages
      hasMore = response.data.length === COMMITS_PER_PAGE && commits.length < maxCommits;
      page++;

      // Rate limiting: add small delay between pages
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Fetch detailed stats for commits that don't have them
    const commitsNeedingStats = commits.filter(c => c.additions === 0 && c.deletions === 0);
    
    if (commitsNeedingStats.length > 0 && commitsNeedingStats.length < 100) {
      if (onProgress) {
        onProgress('Fetching detailed commit statistics...', 85);
      }
      
      await fetchDetailedStats(octokit, owner, repo, commitsNeedingStats, onProgress);
    }

    if (commits.length === 0 && totalFetched === 0) {
      handleEmptyRepository(owner, repo);
    }

    if (commits.length === 0 && totalFetched > 0) {
      handleOnlyMergeCommits();
    }

    if (onProgress) {
      onProgress('Commit fetching complete', 100);
    }

    return commits;
  } catch (error) {
    return handleCommitFetchError(error);
  }
}

/**
 * Fetch detailed statistics for commits that don't have them
 * Updates the commit objects in place
 */
async function fetchDetailedStats(
  octokit: Octokit,
  owner: string,
  repo: string,
  commits: CommitData[],
  onProgress?: (message: string, percent: number) => void
): Promise<void> {
  const batchSize = 10; // Process in batches to avoid rate limiting
  
  for (let i = 0; i < commits.length; i += batchSize) {
    const batch = commits.slice(i, i + batchSize);
    
    await Promise.all(
      batch.map(async (commit) => {
        try {
          const { data } = await octokit.repos.getCommit({
            owner,
            repo,
            ref: commit.sha,
          });

          commit.additions = data.stats?.additions || 0;
          commit.deletions = data.stats?.deletions || 0;
        } catch (error) {
          console.error(`Failed to fetch stats for commit ${commit.sha}:`, error);
          // Keep zeros if fetch fails
        }
      })
    );

    if (onProgress) {
      const percent = 85 + calculateProgress(i + batch.length, commits.length, 0.15);
      onProgress(`Fetching detailed stats (${i + batch.length}/${commits.length})...`, percent);
    }

    // Small delay between batches
    if (i + batchSize < commits.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
}

/**
 * Fetch detailed commit statistics for a specific commit
 * 
 * @param octokit - Authenticated Octokit instance
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param sha - Commit SHA
 * @returns Commit data with detailed stats
 */
export async function fetchCommitStats(
  octokit: Octokit,
  owner: string,
  repo: string,
  sha: string
): Promise<{ additions: number; deletions: number; files: Array<{ filename: string; additions: number; deletions: number }> }> {
  try {
    const { data } = await octokit.repos.getCommit({
      owner,
      repo,
      ref: sha,
    });

    return {
      additions: data.stats?.additions || 0,
      deletions: data.stats?.deletions || 0,
      files: (data.files || []).map(file => ({
        filename: file.filename,
        additions: file.additions,
        deletions: file.deletions,
      })),
    };
  } catch (error) {
    return handleCommitFetchError(error);
  }
}

/**
 * Fetch commit history for a specific file
 * Used for per-file attribution (replaces git blame)
 * 
 * @param octokit - Authenticated Octokit instance
 * @param owner - Repository owner
 * @param repo - Repository name
 * @param path - File path relative to repository root
 * @param branch - Branch name
 * @param options - Fetch options
 * @returns Array of commits that modified the file
 */
export async function fetchCommitsForFile(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string,
  branch: string,
  options: Pick<FetchCommitsOptions, 'since' | 'until' | 'maxCommits'> = {}
): Promise<CommitData[]> {
  const {
    since,
    until,
    maxCommits = 1000, // Lower limit for file-specific queries
  } = options;

  const commits: CommitData[] = [];
  let page = 1;
  let hasMore = true;

  try {
    while (hasMore && commits.length < maxCommits) {
      const response = await octokit.repos.listCommits({
        owner,
        repo,
        sha: branch,
        path,
        per_page: COMMITS_PER_PAGE,
        page,
        ...(since && { since: new Date(since).toISOString() }),
        ...(until && { until: new Date(until).toISOString() }),
      });

      if (response.data.length === 0) {
        break;
      }

      for (const commit of response.data) {
        if (commits.length >= maxCommits) {
          hasMore = false;
          break;
        }

        // Skip merge commits for file attribution
        if (commit.parents.length >= 2) {
          continue;
        }

        // For file-specific commits, we need detailed stats
        const detailedCommit = await octokit.repos.getCommit({
          owner,
          repo,
          ref: commit.sha,
        });

        // Find stats for this specific file
        const fileStats = detailedCommit.data.files?.find(f => f.filename === path);

        commits.push({
          sha: commit.sha,
          authorName: commit.commit.author?.name || 'Unknown',
          authorEmail: (commit.commit.author?.email || '').toLowerCase(),
          date: commit.commit.author?.date || new Date().toISOString(),
          additions: fileStats?.additions || 0,
          deletions: fileStats?.deletions || 0,
        });
      }

      hasMore = response.data.length === COMMITS_PER_PAGE && commits.length < maxCommits;
      page++;

      // Rate limiting
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }

    return commits;
  } catch (error) {
    return handleCommitFetchError(error);
  }
}

/**
 * Get user's avatar URL from GitHub API
 * 
 * @param octokit - Authenticated Octokit instance
 * @param username - GitHub username
 * @returns Avatar URL or undefined
 */
export async function getUserAvatar(
  octokit: Octokit,
  username: string
): Promise<string | undefined> {
  try {
    const { data } = await octokit.users.getByUsername({ username });
    return data.avatar_url;
  } catch (error) {
    console.error(`Failed to fetch avatar for ${username}:`, error);
    return undefined;
  }
}

