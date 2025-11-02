/**
 * Branch Analysis Streaming API Endpoint
 * 
 * POST /api/github/analyze/stream
 * Server-Sent Events endpoint for streaming analysis progress.
 * Provides real-time updates during long-running analysis operations.
 * Excludes merge commits for cleaner contributor stats.
 * 
 * Request body:
 * - owner: Repository owner (required)
 * - repo: Repository name (required)
 * - branch: Branch name (required)
 * - since: Optional start date filter
 * - until: Optional end date filter
 * - filterBots: Boolean to filter bot commits (default: true)
 * 
 * SSE Event format:
 * data: {"type":"progress","percent":50,"message":"Processing..."}
 * data: {"type":"complete","result":{...}}
 * data: {"type":"error","message":"Error occurred"}
 */

import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { createGitHubClient, checkRateLimit } from '@/lib/github';
import { fetchCommitsForBranch } from '@/lib/github-api-commits';
import { analyzeCommits } from '@/lib/analysis';
import { createProgressStream, sendProgress, sendComplete, sendError } from '@/lib/progress-tracker';
import { convertToGitHubCommits } from '@/lib/commit-converter';
import { GITHUB_API_LIMITS } from '@/lib/constants';
import type { AnalysisResponse } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes for large repositories

interface RequestBody {
  owner: string;
  repo: string;
  branch: string;
  since?: string;
  until?: string;
  filterBots?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { owner, repo, branch, since, until, filterBots = true } = body;

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
    const { remaining } = await checkRateLimit(octokit);
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

        // Fetch commits with progress updates and EXCLUDE merge commits
        const commits = await fetchCommitsForBranch(
          octokit,
          owner,
          repo,
          branch,
          {
            since,
            until,
            maxCommits: 5000,
            excludeMerges: true, // ✅ EXCLUDE MERGE COMMITS
            onProgress: async (message, percent) => {
              // Map commit fetching progress to 0-70%
              await sendProgress(writer, message, percent * 0.7);
            },
          }
        );

        await sendProgress(writer, 'Analyzing contributions...', 75);

        // Convert CommitData to GitHubCommit format
        const githubCommits = convertToGitHubCommits(commits);

        // Analyze commits (filter bots if requested)
        const analysis = analyzeCommits(githubCommits, { 
          includeBots: !filterBots 
        });

        await sendProgress(writer, 'Generating exports...', 90);

        // Generate CSV and text exports - using simple serialization
        const contributorsCSV = analysis.contributors
          .map(c => `${c.name},${c.email || 'N/A'},${c.commitCount},${c.additions},${c.deletions}`)
          .join('\n');
        
        const commitMessagesText = analysis.commitMessages
          .map(cm => `${cm.date} - ${cm.author}: ${cm.message}`)
          .join('\n');
        
        const commitTimesText = analysis.commitTimes
          .map(ct => `${ct.date},${ct.sha},${ct.author}`)
          .join('\n');

        const exports = {
          contributorsCSV: 'Name,Email,Commits,Additions,Deletions\n' + contributorsCSV,
          commitMessagesText,
          commitTimesText,
          filesByAuthorText: '', // Not tracked in basic analysis
          mergesText: '', // Merges excluded
        };

        await sendProgress(writer, 'Finalizing results...', 95);

        // Build final response
        const result: AnalysisResponse = {
          contributors: analysis.contributors,
          commitMessages: analysis.commitMessages,
          commitTimes: analysis.commitTimes,
          filesByAuthor: analysis.filesByAuthor || [],
          merges: analysis.merges || [],
          warnings: analysis.warnings || [],
          metadata: {
            totalCommits: analysis.metadata.totalCommits,
            analyzedCommits: analysis.metadata.analyzedCommits,
            totalContributors: analysis.metadata.totalContributors,
            dateRange: analysis.metadata.dateRange,
          },
          exports,
        };

        await sendProgress(writer, 'Complete!', 100);

        // Send complete event with data
        await sendComplete(writer, result);

      } catch (error: any) {
        console.error('Analysis error:', error);
        await sendError(writer, error instanceof Error ? error.message : 'Unknown error occurred');
      }
    })();

    // Return the readable stream
    return new Response(progressStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Request error:', error);
    
    const encoder = new TextEncoder();
    const errorStream = new ReadableStream({
      start(controller) {
        const errorData = JSON.stringify({
          type: 'error',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          code: 'REQUEST_ERROR',
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
