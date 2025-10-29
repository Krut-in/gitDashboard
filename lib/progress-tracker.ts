/**
 * Progress Tracking Utility for SSE Streaming
 * 
 * Provides Server-Sent Events (SSE) streaming for real-time progress updates.
 * Used during long-running GitHub API operations like commit fetching.
 */

export interface ProgressUpdate {
  type: 'progress';
  message: string;
  percent: number;
}

export interface CompleteUpdate {
  type: 'complete';
  result: any;
  hasMore?: boolean;
  nextOffset?: number;
}

export interface ErrorUpdate {
  type: 'error';
  message: string;
  code?: string;
}

type StreamUpdate = ProgressUpdate | CompleteUpdate | ErrorUpdate;

/**
 * Create a TransformStream for Server-Sent Events
 * Returns a stream that can be used to send progress updates to the client
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
  writer: WritableStreamDefaultWriter<ProgressUpdate>,
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
  writer: WritableStreamDefaultWriter<CompleteUpdate>,
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
  writer: WritableStreamDefaultWriter<ErrorUpdate>,
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

