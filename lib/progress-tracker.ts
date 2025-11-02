/**
 * Progress Tracking Utility for SSE Streaming
 * 
 * Provides Server-Sent Events (SSE) streaming for real-time progress updates.
 * Used during long-running GitHub API operations like commit fetching.
 * 
 * Includes both event emitter pattern and SSE formatting utilities.
 */

/**
 * Progress update event
 */
export interface ProgressUpdate {
  type: 'progress';
  message: string;
  percent: number;
}

/**
 * Completion event with optional result data
 */
export interface CompleteUpdate {
  type: 'complete';
  result: any;
  hasMore?: boolean;
  nextOffset?: number;
}

/**
 * Error event with optional error code
 */
export interface ErrorUpdate {
  type: 'error';
  message: string;
  code?: string;
}

/**
 * Union type for all stream update events
 */
type StreamUpdate = ProgressUpdate | CompleteUpdate | ErrorUpdate;

/**
 * Progress event with extended metadata
 */
export interface ProgressEvent {
  type: 'progress' | 'complete' | 'error';
  percent: number;
  message: string;
  currentPage?: number;
  totalPages?: number;
  processedCommits?: number;
  totalCommits?: number;
}

type ProgressListener = (event: ProgressEvent) => void;

/**
 * Progress emitter for streaming analysis updates
 * 
 * @example
 * ```typescript
 * const progress = new ProgressEmitter();
 * progress.on((event) => console.log(event));
 * progress.progress(50, 'Processing...');
 * progress.complete('Done!');
 * ```
 */
export class ProgressEmitter {
  private listeners: ProgressListener[] = [];
  private isComplete = false;

  /**
   * Add a listener for progress events
   * 
   * @param listener - Callback function to handle progress events
   */
  on(listener: ProgressListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a listener
   * 
   * @param listener - Callback function to remove
   */
  off(listener: ProgressListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Emit a progress event to all listeners
   * 
   * @param event - Progress event to emit
   * @private
   */
  emit(event: ProgressEvent): void {
    if (this.isComplete && event.type !== 'complete' && event.type !== 'error') {
      return;
    }

    if (event.type === 'complete' || event.type === 'error') {
      this.isComplete = true;
    }

    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in progress listener:', error);
      }
    });
  }

  /**
   * Emit a progress update
   * 
   * @param percent - Progress percentage (0-100)
   * @param message - Human-readable progress message
   * @param details - Optional additional details
   */
  progress(percent: number, message: string, details?: Partial<ProgressEvent>): void {
    this.emit({
      type: 'progress',
      percent: Math.min(100, Math.max(0, percent)),
      message,
      ...details,
    });
  }

  /**
   * Emit a completion event
   * 
   * @param message - Completion message (default: 'Analysis complete')
   */
  complete(message: string = 'Analysis complete'): void {
    this.emit({
      type: 'complete',
      percent: 100,
      message,
    });
  }

  /**
   * Emit an error event
   * 
   * @param message - Error message
   */
  error(message: string): void {
    this.emit({
      type: 'error',
      percent: 0,
      message,
    });
  }

  /**
   * Remove all listeners and reset state
   */
  cleanup(): void {
    this.listeners = [];
    this.isComplete = false;
  }
}

/**
 * Create a TransformStream for Server-Sent Events
 * Returns a stream that can be used to send progress updates to the client
 * 
 * @returns TransformStream for SSE encoding
 * 
 * @example
 * ```typescript
 * const stream = createProgressStream();
 * const writer = stream.writable.getWriter();
 * await sendProgress(writer, 'Processing...', 50);
 * ```
 */
export function createProgressStream() {
  const encoder = new TextEncoder();
  
  return new TransformStream({
    transform(chunk: StreamUpdate, controller) {
      const data = JSON.stringify(chunk);
      const message = `data: ${data}\n\n`;
      controller.enqueue(encoder.encode(message));
    },
  });
}

/**
 * Send a progress update through the stream
 * 
 * @param writer - WritableStreamDefaultWriter to send updates through
 * @param message - Human-readable progress message
 * @param percent - Progress percentage (0-100)
 */
export async function sendProgress(
  writer: WritableStreamDefaultWriter<StreamUpdate>,
  message: string,
  percent: number
): Promise<void> {
  try {
    await writer.write({
      type: 'progress',
      message,
      percent: Math.min(100, Math.max(0, percent)),
    });
  } catch (error) {
    console.error('Failed to send progress update:', error);
  }
}

/**
 * Send completion message with final result
 * 
 * @param writer - WritableStreamDefaultWriter to send through
 * @param result - Final analysis result data
 * @param hasMore - Whether there are more commits to load
 * @param nextOffset - Offset for next batch of commits
 */
export async function sendComplete(
  writer: WritableStreamDefaultWriter<StreamUpdate>,
  result: any,
  hasMore?: boolean,
  nextOffset?: number
): Promise<void> {
  try {
    await writer.write({
      type: 'complete',
      result,
      hasMore,
      nextOffset,
    });
  } catch (error) {
    console.error('Failed to send completion update:', error);
  }
}

/**
 * Send error message
 * 
 * @param writer - WritableStreamDefaultWriter to send through
 * @param message - Error message
 * @param code - Optional error code
 */
export async function sendError(
  writer: WritableStreamDefaultWriter<StreamUpdate>,
  message: string,
  code?: string
): Promise<void> {
  try {
    await writer.write({
      type: 'error',
      message,
      code,
    });
  } catch (error) {
    console.error('Failed to send error update:', error);
  }
}

/**
 * Helper to calculate progress percentage based on current state
 * 
 * @param current - Current item index
 * @param total - Total items
 * @param phase - Current phase (0-1, for multi-phase operations)
 * @returns Progress percentage (0-100)
 * 
 * @example
 * ```typescript
 * // Single phase: 50 of 100 items = 50%
 * const progress = calculateProgress(50, 100);
 * 
 * // Multi-phase: 50 of 100 items in phase 1 of 2 = 25%
 * const progress = calculateProgress(50, 100, 0.5);
 * ```
 */
export function calculateProgress(
  current: number,
  total: number,
  phase: number = 1
): number {
  if (total === 0) return 0;
  const phaseProgress = (current / total) * 100;
  return Math.round(phaseProgress * phase);
}

/**
 * Format a progress event as an SSE message
 * 
 * @param event - Progress event to format
 * @returns Formatted SSE message string
 */
export function formatSSE(event: ProgressEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Create an SSE keep-alive comment
 * Prevents connection timeouts during long operations
 * 
 * @returns Keep-alive SSE comment
 */
export function createKeepAlive(): string {
  return `: keep-alive ${Date.now()}\n\n`;
}
