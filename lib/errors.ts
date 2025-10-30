/**
 * Error Handling Utilities
 * 
 * Provides centralized error handling for the application.
 * Defines custom error types and helper functions to safely handle errors.
 * Never exposes sensitive information or crashes the app on errors.
 * 
 * Error Hierarchy:
 * - AppError: Base application error with code and status
 * - GitHubAPIError: Specialized error for GitHub API operations
 * 
 * All GitHub API-specific error handling is consolidated here to eliminate
 * code duplication and ensure consistent error responses across the application.
 * 
 * @module lib/errors
 * @author GitHub Contribution Dashboard Team
 * @since 1.0.0
 * 
 * @example
 * ```typescript
 * try {
 *   await fetchData();
 * } catch (error) {
 *   const errorResponse = toErrorResponse(error);
 *   return NextResponse.json(errorResponse, { status: errorResponse.status });
 * }
 * ```
 */

import { ErrorResponse } from './types';

/**
 * Custom application error class
 * Use this for expected errors that should be handled gracefully
 * 
 * @example
 * ```typescript
 * throw new AppError('Invalid input', 'VALIDATION_ERROR', 400);
 * ```
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly status: number;

  /**
   * Create a new application error
   * 
   * @param message - Human-readable error message
   * @param code - Machine-readable error code (e.g., 'UNAUTHORIZED')
   * @param status - HTTP status code (default: 500)
   */
  constructor(message: string, code: string = 'UNKNOWN_ERROR', status: number = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Specialized error for GitHub API operations
 * Extends AppError with GitHub-specific context
 * 
 * @example
 * ```typescript
 * throw new GitHubAPIError('Rate limit exceeded', 403, 'RATE_LIMIT_EXCEEDED');
 * ```
 */
export class GitHubAPIError extends AppError {
  /**
   * Create a new GitHub API error
   * 
   * @param message - Human-readable error message
   * @param status - HTTP status code
   * @param code - Machine-readable error code
   */
  constructor(message: string, status: number, code: string) {
    super(message, code, status);
    this.name = 'GitHubAPIError';
  }
}

/**
 * Convert unknown error to user-friendly error response
 * Sanitizes errors to prevent sensitive information leakage
 * 
 * @param error - Error object (can be any type)
 * @returns Sanitized error response object
 * 
 * @example
 * ```typescript
 * catch (error) {
 *   const errorResponse = toErrorResponse(error);
 *   console.error(errorResponse);
 * }
 * ```
 */
export function toErrorResponse(error: unknown): ErrorResponse {
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      status: error.status,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message || 'An unexpected error occurred',
      code: 'INTERNAL_ERROR',
      status: 500,
    };
  }

  return {
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    status: 500,
  };
}

/**
 * Check if error is an authentication error
 * 
 * @param error - Error object to check
 * @returns True if authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.code === 'UNAUTHORIZED' || error.status === 401;
  }
  return false;
}

/**
 * Create an authentication error
 * 
 * @param message - Error message (default: 'Authentication required')
 * @returns AppError with 401 status
 */
export function createAuthError(message: string = 'Authentication required'): AppError {
  return new AppError(message, 'UNAUTHORIZED', 401);
}

/**
 * Create a not found error
 * 
 * @param resource - Name of the resource that wasn't found
 * @returns AppError with 404 status
 */
export function createNotFoundError(resource: string): AppError {
  return new AppError(`${resource} not found`, 'NOT_FOUND', 404);
}

/**
 * Create a rate limit error
 * 
 * @returns AppError with 429 status
 */
export function createRateLimitError(): AppError {
  return new AppError(
    'GitHub API rate limit exceeded. Please try again later.',
    'RATE_LIMIT_EXCEEDED',
    429
  );
}

/**
 * Create a validation error
 * 
 * @param message - Validation error message
 * @returns AppError with 400 status
 */
export function createValidationError(message: string): AppError {
  return new AppError(message, 'VALIDATION_ERROR', 400);
}

/**
 * Create a forbidden error
 * 
 * @param message - Error message (default: 'Access forbidden')
 * @returns AppError with 403 status
 */
export function createForbiddenError(message: string = 'Access forbidden'): AppError {
  return new AppError(message, 'FORBIDDEN', 403);
}

/**
 * Safe error logger - logs errors without exposing sensitive data
 * Only logs in development mode for security
 * 
 * @param error - Error object to log
 * @param context - Optional context string for the error
 * 
 * @example
 * ```typescript
 * try {
 *   await fetchData();
 * } catch (error) {
 *   logError(error, 'fetchData');
 *   throw error;
 * }
 * ```
 */
export function logError(error: unknown, context?: string): void {
  const errorResponse = toErrorResponse(error);
  
  // Only log in development for security
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, {
      message: errorResponse.message,
      code: errorResponse.code,
      status: errorResponse.status,
      stack: error instanceof Error ? error.stack : undefined,
    });
  } else {
    // In production, log minimal information
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, {
      code: errorResponse.code,
      status: errorResponse.status,
    });
  }
}

/**
 * Handle errors during commit fetching operations
 * Converts various error types into GitHubAPIError with appropriate status codes
 * Consolidates all GitHub API error handling logic
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
 *   handleGitHubAPIError(error);
 * }
 * ```
 */
export function handleGitHubAPIError(error: unknown): never {
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
    apiError.message || 'Failed to fetch data from GitHub API',
    apiError.status || 500,
    'GITHUB_API_ERROR'
  );
}
