/**
 * Progress Event Emitter
 * 
 * Simple event emitter for tracking and broadcasting progress updates.
 * Used for Server-Sent Events (SSE) to stream analysis progress to clients.
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
 */
export class ProgressEmitter {
  private listeners: ProgressListener[] = [];
  private isComplete = false;

  /**
   * Add a listener for progress events
   */
  on(listener: ProgressListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a listener
   */
  off(listener: ProgressListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Emit a progress event to all listeners
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
 * Format a progress event as an SSE message
 */
export function formatSSE(event: ProgressEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Create an SSE keep-alive comment
 */
export function createKeepAlive(): string {
  return `: keep-alive ${Date.now()}\n\n`;
}
