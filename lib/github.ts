/**
 * GitHub API Client Factory
 * 
 * Creates authenticated Octokit instances using the user's session access token.
 * Validates token scopes and provides typed error handling for GitHub API operations.
 * All API calls should use the client created by this factory.
 */

import { Octokit } from '@octokit/rest';
import { AppError, createAuthError, createRateLimitError } from './errors';

/**
 * Required GitHub OAuth scopes for this application
 */
const REQUIRED_SCOPES = ['repo', 'read:user', 'user:email'];

/**
 * Create an authenticated Octokit client with the user's access token
 * Validates token and returns a configured client ready for API calls
 */
export function createGitHubClient(accessToken: string): Octokit {
  if (!accessToken) {
    throw createAuthError('GitHub access token is required');
  }

  return new Octokit({
    auth: accessToken,
    userAgent: 'github-contribution-dashboard/1.0.0',
    timeZone: 'UTC',
  });
}

/**
 * Validate that the access token has the required scopes
 * Returns true if valid, throws AppError if not
 */
export async function validateTokenScopes(octokit: Octokit): Promise<boolean> {
  try {
    const { headers } = await octokit.request('HEAD /user');
    const scopes = headers['x-oauth-scopes']?.split(',').map(s => s.trim()) || [];
    
    const missingScopes = REQUIRED_SCOPES.filter(
      required => !scopes.includes(required)
    );

    if (missingScopes.length > 0) {
      throw new AppError(
        `Missing required OAuth scopes: ${missingScopes.join(', ')}`,
        'INSUFFICIENT_SCOPES',
        403
      );
    }

    return true;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw createAuthError('Failed to validate token scopes');
  }
}

/**
 * Check if we're approaching GitHub API rate limits
 * Returns { shouldWait: boolean, resetTime: Date | null }
 */
export async function checkRateLimit(
  octokit: Octokit
): Promise<{ shouldWait: boolean; resetTime: Date | null; remaining: number }> {
  try {
    const { data } = await octokit.rateLimit.get();
    const { remaining, reset } = data.rate;
    
    // Warn if less than 100 requests remaining
    const shouldWait = remaining < 100;
    const resetTime = new Date(reset * 1000);

    return {
      shouldWait,
      resetTime: shouldWait ? resetTime : null,
      remaining,
    };
  } catch (error) {
    // If rate limit check fails, assume we should be cautious
    return {
      shouldWait: false,
      resetTime: null,
      remaining: 5000,
    };
  }
}

/**
 * Handle GitHub API errors and convert to AppError
 */
export function handleGitHubError(error: unknown): never {
  if (error instanceof Error) {
    const githubError = error as any;
    
    if (githubError.status === 401) {
      throw createAuthError('GitHub authentication failed');
    }
    
    if (githubError.status === 403) {
      if (githubError.message?.includes('rate limit')) {
        throw createRateLimitError();
      }
      throw new AppError('Access forbidden', 'FORBIDDEN', 403);
    }
    
    if (githubError.status === 404) {
      throw new AppError('Resource not found', 'NOT_FOUND', 404);
    }

    if (githubError.status === 422) {
      throw new AppError(
        githubError.message || 'Invalid request parameters',
        'VALIDATION_ERROR',
        422
      );
    }

    throw new AppError(
      githubError.message || 'GitHub API error',
      'GITHUB_API_ERROR',
      githubError.status || 500
    );
  }

  throw new AppError('Unknown GitHub API error', 'UNKNOWN_ERROR', 500);
}

/**
 * Rate limit safe request wrapper
 * Checks rate limit before making request and handles errors
 */
export async function rateLimitSafeRequest<T>(
  octokit: Octokit,
  requestFn: () => Promise<T>
): Promise<T> {
  try {
    const { shouldWait, resetTime, remaining } = await checkRateLimit(octokit);
    
    if (shouldWait && resetTime) {
      const waitTime = Math.max(0, resetTime.getTime() - Date.now());
      if (waitTime > 0 && waitTime < 60000) {
        // Wait up to 1 minute
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else if (remaining < 10) {
        throw createRateLimitError();
      }
    }

    return await requestFn();
  } catch (error) {
    return handleGitHubError(error);
  }
}
