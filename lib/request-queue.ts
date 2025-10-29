/**
 * Request Queue Utility
 * 
 * Manages concurrent API requests with a maximum limit to prevent rate limiting.
 * Provides automatic queuing and sequential processing when the limit is reached.
 * 
 * @example
 * ```typescript
 * const queue = new RequestQueue(3);
 * const result = await queue.add(() => fetchData());
 * ```
 */

import { DATA_LIMITS } from './constants';

/**
 * Queue for managing concurrent API requests
 * Limits the number of simultaneous requests to prevent rate limiting
 */
export class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;
  private readonly maxConcurrent: number;

  /**
   * Create a new request queue
   * 
   * @param maxConcurrent - Maximum number of concurrent requests (default: 3)
   */
  constructor(maxConcurrent: number = DATA_LIMITS.MAX_CONCURRENT_REQUESTS) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Add a request to the queue
   * 
   * @param fn - Async function to execute
   * @returns Promise that resolves with the function's result
   * 
   * @example
   * ```typescript
   * const result = await queue.add(async () => {
   *   const response = await fetch('/api/data');
   *   return response.json();
   * });
   * ```
   */
  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  /**
   * Process queued requests up to the maximum concurrent limit
   * @private
   */
  private async process(): Promise<void> {
    if (this.running >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    this.running++;
    const fn = this.queue.shift();
    
    if (fn) {
      try {
        await fn();
      } finally {
        this.running--;
        this.process();
      }
    }
  }

  /**
   * Get the current queue length
   * @returns Number of pending requests
   */
  get pending(): number {
    return this.queue.length;
  }

  /**
   * Get the number of currently running requests
   * @returns Number of active requests
   */
  get active(): number {
    return this.running;
  }

  /**
   * Clear all pending requests
   */
  clear(): void {
    this.queue = [];
  }
}
