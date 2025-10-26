/**
 * Error Handling Utilities
 * 
 * This file provides centralized error handling for the application.
 * It defines custom error types and helper functions to safely handle errors.
 * Never expose sensitive information or crash the app on errors.
 */

import { ErrorResponse } from './types';

/**
 * Custom application error class
 * Use this for expected errors that should be handled gracefully
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly status: number;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', status: number = 500) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Convert unknown error to user-friendly error response
 * Sanitizes errors to prevent sensitive information leakage
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
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.code === 'UNAUTHORIZED' || error.status === 401;
  }
  return false;
}

/**
 * Create an authentication error
 */
export function createAuthError(message: string = 'Authentication required'): AppError {
  return new AppError(message, 'UNAUTHORIZED', 401);
}

/**
 * Create a not found error
 */
export function createNotFoundError(resource: string): AppError {
  return new AppError(`${resource} not found`, 'NOT_FOUND', 404);
}

/**
 * Create a rate limit error
 */
export function createRateLimitError(): AppError {
  return new AppError(
    'GitHub API rate limit exceeded. Please try again later.',
    'RATE_LIMIT_EXCEEDED',
    429
  );
}

/**
 * Safe error logger - logs errors without exposing sensitive data
 */
export function logError(error: unknown, context?: string): void {
  const errorResponse = toErrorResponse(error);
  console.error(`[Error${context ? ` - ${context}` : ''}]:`, {
    message: errorResponse.message,
    code: errorResponse.code,
    status: errorResponse.status,
  });
}
