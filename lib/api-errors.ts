/**
 * GitHub API Error Handling Utilities
 * 
 * Provides consistent error handling for GitHub API operations.
 * Handles rate limits, authentication, and network errors.
 */

import { AppError } from './errors';

export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string
  ) {
    super(message);
    this.name = 'GitHubAPIError';
  }
}

/**
 * Handle errors during commit fetching operations
 */
export function handleCommitFetchError(error: unknown): never {
  if (error instanceof GitHubAPIError) {
    throw error;
  }

  if (error instanceof AppError) {
    throw error;
  }

  const apiError = error as any;

  // Rate limit exceeded
  if (apiError.status === 403 && apiError.message?.includes('rate limit')) {
    throw new GitHubAPIError(
      'GitHub API rate limit exceeded. Please try again later.',
      403,
      'RATE_LIMIT_EXCEEDED'
    );
  }

  // Repository not found
  if (apiError.status === 404) {
    throw new GitHubAPIError(
      'Repository or branch not found. Please check the repository name and branch.',
      404,
      'NOT_FOUND'
    );
  }

  // No access to repository
  if (apiError.status === 403) {
    throw new GitHubAPIError(
      'Access denied. You may not have permission to access this repository.',
      403,
      'FORBIDDEN'
    );
  }

  // Authentication failed
  if (apiError.status === 401) {
    throw new GitHubAPIError(
      'GitHub authentication failed. Please sign in again.',
      401,
      'UNAUTHORIZED'
    );
  }

  // Invalid request
  if (apiError.status === 422) {
    throw new GitHubAPIError(
      apiError.message || 'Invalid request parameters',
      422,
      'VALIDATION_ERROR'
    );
  }

  // Network or timeout error
  if (apiError.name === 'AbortError' || apiError.code === 'ETIMEDOUT') {
    throw new GitHubAPIError(
      'Request timed out. The repository might be too large or the connection is slow.',
      408,
      'TIMEOUT'
    );
  }

  // Generic error
  throw new GitHubAPIError(
    apiError.message || 'Failed to fetch commit data from GitHub API',
    apiError.status || 500,
    'GITHUB_API_ERROR'
  );
}

/**
 * Handle empty repository edge case
 */
export function handleEmptyRepository(owner: string, repo: string): never {
  throw new GitHubAPIError(
    `Repository ${owner}/${repo} has no commits`,
    404,
    'EMPTY_REPOSITORY'
  );
}

/**
 * Handle invalid branch edge case
 */
export function handleInvalidBranch(branch: string): never {
  throw new GitHubAPIError(
    `Branch '${branch}' not found in repository`,
    404,
    'INVALID_BRANCH'
  );
}

/**
 * Handle repositories with only merge commits
 */
export function handleOnlyMergeCommits(): never {
  throw new GitHubAPIError(
    'No non-merge commits found in the specified date range',
    404,
    'NO_VALID_COMMITS'
  );
}

