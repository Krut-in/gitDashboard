/**
 * Safe Fetch Wrapper
 * 
 * This file provides a type-safe wrapper around the fetch API.
 * It handles errors gracefully and provides better error messages.
 * Use this instead of raw fetch for all API calls.
 */

import { AppError, logError } from './errors';

export interface FetchOptions extends RequestInit {
  timeout?: number;
}

/**
 * Safe fetch with error handling and timeouts
 * Returns typed data or throws AppError
 */
export async function safeFetch<T>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { timeout = 10000, ...fetchOptions } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
        throw new AppError('Authentication failed', 'UNAUTHORIZED', 401);
      }
      if (response.status === 403) {
        throw new AppError('Access forbidden', 'FORBIDDEN', 403);
      }
      if (response.status === 404) {
        throw new AppError('Resource not found', 'NOT_FOUND', 404);
      }
      if (response.status === 429) {
        throw new AppError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 429);
      }

      throw new AppError(
        `HTTP error: ${response.statusText}`,
        'HTTP_ERROR',
        response.status
      );
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof AppError) {
      throw error;
    }

    if ((error as Error).name === 'AbortError') {
      throw new AppError('Request timeout', 'TIMEOUT', 408);
    }

    logError(error, 'safeFetch');
    throw new AppError('Network request failed', 'NETWORK_ERROR', 500);
  }
}

/**
 * Safe fetch with automatic retries for transient errors
 */
export async function safeFetchWithRetry<T>(
  url: string,
  options: FetchOptions = {},
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await safeFetch<T>(url, options);
    } catch (error) {
      lastError = error as Error;

      // Don't retry on auth errors or client errors
      if (
        error instanceof AppError &&
        (error.status === 401 || error.status === 403 || error.status === 404)
      ) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }

  throw lastError || new AppError('Request failed after retries', 'RETRY_FAILED', 500);
}
