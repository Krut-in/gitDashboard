/**
 * Commit Data Converter
 * 
 * Centralized utility for converting between different commit data formats.
 * Eliminates code duplication across API routes.
 * 
 * @module lib/commit-converter
 * @description Converts simplified CommitData format to full GitHubCommit format
 * required by the analysis engine. This ensures consistent data transformation
 * across all API endpoints.
 * 
 * @author GitHub Contribution Dashboard Team
 * @since 1.0.0
 */

import type { CommitData } from './github-api-commits';
import type { GitHubCommit } from './analysis';

/**
 * Convert CommitData array to GitHubCommit format for analysis
 * 
 * Maps the simplified CommitData structure from the GitHub API to the
 * comprehensive GitHubCommit format required by the analysis engine.
 * 
 * @param commits - Array of simplified commit data from GitHub API
 * @returns Array of commits in GitHubCommit format ready for analysis
 * 
 * @example
 * ```typescript
 * const commits = await fetchCommitsForBranch(octokit, owner, repo, branch);
 * const githubCommits = convertToGitHubCommits(commits);
 * const analysis = analyzeCommits(githubCommits);
 * ```
 */
export function convertToGitHubCommits(commits: CommitData[]): GitHubCommit[] {
  return commits.map(commit => ({
    sha: commit.sha,
    commit: {
      author: {
        name: commit.authorName,
        email: commit.authorEmail,
        date: commit.date,
      },
      message: commit.message || '',
    },
    author: null, // GitHub user data not included in CommitData
    stats: {
      additions: commit.additions,
      deletions: commit.deletions,
      total: commit.additions + commit.deletions,
    },
    files: commit.files.map(filename => ({
      filename,
      additions: 0, // File-level stats not available in simplified format
      deletions: 0,
      changes: 0,
    })),
    parents: [], // Assume single parent (non-merge commits excluded upstream)
  }));
}
