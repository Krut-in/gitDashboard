/**
 * GitHub API Error Handling Utilities
 * 
 * Provides consistent error handling specifically for GitHub API operations.
 * Handles rate limits, authentication, repository access, and network errors.
 * 
 * All functions in this module use the unified error system from errors.ts
 * and throw GitHubAPIError instances with appropriate status codes.
 * 
 * @example
 * ```typescript
 * try {
 *   const commits = await fetchCommits();
 * } catch (error) {
 *   handleCommitFetchError(error); // Throws GitHubAPIError
 * }
 * ```
 */

import { GitHubAPIError } from './errors';

/**
 * Handle errors during commit fetching operations
 * Converts various error types into GitHubAPIError with appropriate status codes
 * 
 * @param error - Error object from GitHub API or fetch operation
 * @throws {GitHubAPIError} Standardized error with status code and error code
 * @returns never - Always throws
 * 
 * @example
 * ```typescript
 * try {
 *   const response = await octokit.repos.listCommits({...});
 * } catch (error) {
 *   handleCommitFetchError(error);
 * }
 * ```
 */
export function handleCommitFetchError(error: unknown): never {
  if (error instanceof GitHubAPIError) {
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
 * Throws a specialized error when a repository has no commits
 * 
 * @param owner - Repository owner username or organization
 * @param repo - Repository name
 * @throws {GitHubAPIError} With 404 status and EMPTY_REPOSITORY code
 * @returns never - Always throws
 * 
 * @example
 * ```typescript
 * if (commits.length === 0) {
 *   handleEmptyRepository('owner', 'repo');
 * }
 * ```
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
 * Throws when a specified branch doesn't exist in the repository
 * 
 * @param branch - Branch name that wasn't found
 * @throws {GitHubAPIError} With 404 status and INVALID_BRANCH code
 * @returns never - Always throws
 * 
 * @example
 * ```typescript
 * try {
 *   await octokit.repos.getBranch({ owner, repo, branch });
 * } catch (error) {
 *   handleInvalidBranch(branch);
 * }
 * ```
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
 * Throws when filtering excludes all commits (e.g., excludeMerges=true but only merge commits exist)
 * 
 * @throws {GitHubAPIError} With 404 status and NO_VALID_COMMITS code
 * @returns never - Always throws
 * 
 * @example
 * ```typescript
 * const nonMergeCommits = commits.filter(c => c.parents.length < 2);
 * if (nonMergeCommits.length === 0) {
 *   handleOnlyMergeCommits();
 * }
 * ```
 */
export function handleOnlyMergeCommits(): never {
  throw new GitHubAPIError(
    'No non-merge commits found in the specified date range',
    404,
    'NO_VALID_COMMITS'
  );
}
