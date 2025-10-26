/**
 * GitHub Analysis Stream API Route
 * 
 * GET /api/github/analyze/stream
 * Server-Sent Events endpoint for streaming analysis progress.
 * Provides real-time updates during long-running analysis operations.
 * 
 * Query parameters:
 * - owner: Repository owner (required)
 * - repo: Repository name (required)
 * - branch: Branch name (required)
 * 
 * SSE Event format:
 * data: {"type":"progress","percent":50,"message":"Processing...","currentPage":5,"totalPages":10}
 */

import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { createGitHubClient, checkRateLimit } from '@/lib/github';
import { ProgressEmitter, formatSSE, createKeepAlive } from '@/lib/progress';

const COMMITS_PER_PAGE = 100;
const KEEP_ALIVE_INTERVAL = 15000; // 15 seconds

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getSession();
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const branch = searchParams.get('branch');

    // Validate required parameters
    if (!owner || !repo || !branch) {
      return new Response('Missing required parameters', { status: 400 });
    }

    // Create GitHub client
    const octokit = createGitHubClient(session.accessToken);

    // Create readable stream for SSE
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const progress = new ProgressEmitter();
        let keepAliveTimer: NodeJS.Timeout | null = null;

        // Send progress events to client
        progress.on((event) => {
          try {
            controller.enqueue(encoder.encode(formatSSE(event)));
          } catch (error) {
            console.error('Error sending SSE event:', error);
          }
        });

        // Keep-alive to prevent connection timeout
        keepAliveTimer = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(createKeepAlive()));
          } catch (error) {
            console.error('Error sending keep-alive:', error);
          }
        }, KEEP_ALIVE_INTERVAL);

        try {
          progress.progress(0, 'Starting analysis...');

          // Estimate total pages
          let totalPages = 1;
          let page = 1;
          let processedCommits = 0;

          while (true) {
            // Check rate limit
            const { remaining } = await checkRateLimit(octokit);
            if (remaining < 50) {
              progress.error('Approaching rate limit. Please try again later.');
              break;
            }

            progress.progress(
              Math.min(95, (page / (totalPages + 1)) * 100),
              `Fetching commits page ${page}...`,
              {
                currentPage: page,
                totalPages,
                processedCommits,
              }
            );

            try {
              const { data } = await octokit.repos.listCommits({
                owner,
                repo,
                sha: branch,
                page,
                per_page: COMMITS_PER_PAGE,
              });

              if (data.length === 0) {
                break;
              }

              processedCommits += data.length;

              // Update total pages estimate
              if (data.length === COMMITS_PER_PAGE) {
                totalPages = page + 1;
              }

              page++;

              // Limit to 100 pages
              if (page > 100) {
                progress.progress(
                  95,
                  'Reached page limit, finalizing...',
                  {
                    currentPage: page,
                    totalPages,
                    processedCommits,
                  }
                );
                break;
              }
            } catch (error: any) {
              if (error.status === 409) {
                // Empty repository
                progress.progress(100, 'No commits found');
                break;
              }
              throw error;
            }
          }

          progress.complete(`Analysis complete. Processed ${processedCommits} commits.`);
        } catch (error: any) {
          console.error('Stream analysis error:', error);
          progress.error(error.message || 'Analysis failed');
        } finally {
          if (keepAliveTimer) {
            clearInterval(keepAliveTimer);
          }
          progress.cleanup();
          
          // Close the stream after a short delay
          setTimeout(() => {
            try {
              controller.close();
            } catch (error) {
              console.error('Error closing controller:', error);
            }
          }, 1000);
        }
      },

      cancel() {
        console.log('Client disconnected from SSE stream');
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable buffering for Nginx
      },
    });
  } catch (error: any) {
    console.error('SSE setup error:', error);
    return new Response(error.message || 'Internal Server Error', {
      status: 500,
    });
  }
}
