/**
 * Advanced Analysis Streaming API Endpoint
 * 
 * Provides real-time progress updates using Server-Sent Events (SSE).
 * Fetches commits from GitHub API with streaming progress indicators.
 */

import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { createGitHubClient, checkRateLimit } from "@/lib/github";
import { extractTimelineFromGitHub } from "@/lib/git/timeline";
import { extractUserMetricsFromCommits } from "@/lib/git/user-metrics";
import { aggregateAllUsersToWeekly } from "@/lib/aggregation";
import { extractBasicInsights } from "@/lib/insights";
import { createProgressStream, sendProgress, sendComplete, sendError } from "@/lib/progress-tracker";
import { GITHUB_API_LIMITS } from "@/lib/constants";
import { fetchCommitsForBranch } from "@/lib/github-api-commits";
import type { AdvancedAnalysisResponse } from "@/lib/types";

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for large repositories

interface RequestBody {
  owner: string;
  repo: string;
  branch: string;
  since?: string;
  until?: string;
  offset?: number;
}

/**
 * POST /api/github/analyze/advanced/stream
 * 
 * Streams advanced analysis with real-time progress updates
 * Uses Server-Sent Events (SSE) to report progress to the client
 */
export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { owner, repo, branch, since, until, offset = 0 } = body;

    // Validate required parameters
    if (!owner || !repo || !branch) {
      const encoder = new TextEncoder();
      const errorStream = new ReadableStream({
        start(controller) {
          const errorData = JSON.stringify({
            type: 'error',
            message: 'owner, repo, and branch are required',
            code: 'MISSING_PARAMS',
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        },
      });
      return new Response(errorStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Get authenticated session
    const session = await getSession();
    if (!session) {
      const encoder = new TextEncoder();
      const errorStream = new ReadableStream({
        start(controller) {
          const errorData = JSON.stringify({
            type: 'error',
            message: 'Authentication required',
            code: 'UNAUTHORIZED',
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        },
      });
      return new Response(errorStream, {
        status: 401,
        headers: {
          'Content-Type': 'text/event-stream',
        },
      });
    }

    const octokit = createGitHubClient(session.accessToken);

    // Check rate limits
    const { remaining, resetTime } = await checkRateLimit(octokit);
    if (remaining < GITHUB_API_LIMITS.RATE_LIMIT_WARNING_THRESHOLD) {
      const encoder = new TextEncoder();
      const errorStream = new ReadableStream({
        start(controller) {
          const errorData = JSON.stringify({
            type: 'error',
            message: `GitHub API rate limit low (${remaining} remaining). Please try again later.`,
            code: 'RATE_LIMIT_LOW',
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
          controller.close();
        },
      });
      return new Response(errorStream, {
        status: 429,
        headers: {
          'Content-Type': 'text/event-stream',
        },
      });
    }

    // Create progress stream
    const progressStream = createProgressStream();
    const writer = progressStream.writable.getWriter();

    // Process analysis in the background
    (async () => {
      try {
        await sendProgress(writer, 'Starting analysis...', 0);

        // Fetch commits once for efficiency (avoids redundant API calls)
        const commits = await fetchCommitsForBranch(
          octokit,
          owner,
          repo,
          branch,
          {
            since,
            until,
            maxCommits: GITHUB_API_LIMITS.MAX_COMMITS_PER_REQUEST,
            excludeMerges: true,
            onProgress: async (message, percent) => {
              // Map commit fetching progress to 0-80%
              await sendProgress(writer, message, percent * 0.8);
            },
          }
        );

        await sendProgress(writer, 'Processing timeline data...', 82);

        // Extract timeline using pre-fetched commits (no redundant API call)
        const timeline = await extractTimelineFromGitHub(
          octokit,
          owner,
          repo,
          branch,
          {
            excludeMerges: true,
            since,
            until,
            maxCommits: GITHUB_API_LIMITS.MAX_COMMITS_PER_REQUEST,
          },
          commits // Pass pre-fetched commits
        );

        await sendProgress(writer, 'Aggregating weekly metrics...', 85);

        // Aggregate weekly metrics
        const usersWithWeekly = aggregateAllUsersToWeekly(timeline.users);
        timeline.users = usersWithWeekly;

        await sendProgress(writer, 'Extracting user contributions...', 90);

        // Extract user contributions
        const userList = timeline.users.map(user => ({
          name: user.userName,
          email: user.email || user.userId,
          avatarUrl: user.avatarUrl,
        }));

        // OPTIMIZATION: Use pre-fetched commits for all users (no redundant API calls)
        const userContributions = userList.map(user =>
          extractUserMetricsFromCommits(
            commits,
            user.name,
            user.email,
            user.avatarUrl
          )
        );

        await sendProgress(writer, 'Generating insights...', 95);

        // Extract insights
        const insights = extractBasicInsights(timeline.users);

        // Build final response
        const result: AdvancedAnalysisResponse = {
          timeline,
          userContributions,
          insights,
          metadata: {
            analyzedCommits: timeline.totalCommits,
            dateRange: {
              start: timeline.repoFirstCommit,
              end: timeline.repoLastCommit,
            },
            generatedAt: new Date().toISOString(),
          },
        };

        // Determine if there are more commits to load
        const hasMore = timeline.totalCommits >= GITHUB_API_LIMITS.MAX_COMMITS_PER_REQUEST;
        const nextOffset = offset + timeline.totalCommits;

        await sendComplete(writer, result, hasMore, nextOffset);
      } catch (error: any) {
        console.error('Advanced analysis streaming error:', error);
        await sendError(
          writer,
          error.message || 'Failed to perform advanced analysis',
          error.code || 'ANALYSIS_ERROR'
        );
      } finally {
        writer.close();
      }
    })();

    return new Response(progressStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable buffering for nginx
      },
    });
  } catch (error: any) {
    console.error('Stream initialization error:', error);
    
    const encoder = new TextEncoder();
    const errorStream = new ReadableStream({
      start(controller) {
        const errorData = JSON.stringify({
          type: 'error',
          message: error.message || 'Failed to initialize stream',
          code: 'STREAM_ERROR',
        });
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        controller.close();
      },
    });

    return new Response(errorStream, {
      status: 500,
      headers: {
        'Content-Type': 'text/event-stream',
      },
    });
  }
}

