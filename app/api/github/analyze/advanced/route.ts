/**
 * Advanced Analysis API Endpoint (Non-Streaming)
 * 
 * @module api/github/analyze/advanced
 * @description Provides comprehensive repository analysis including:
 * - Complete timeline data for all contributors
 * - Individual user contribution metrics for heatmaps
 * - Extracted insights (temporal, work, language, collaboration patterns)
 * 
 * @features
 * - Uses GitHub REST API (no local git commands required)
 * - 24-hour caching for performance optimization
 * - Efficient single-pass commit fetching (reduces API calls)
 * - Language detection from file extensions
 * - Rate limit checking and handling
 * 
 * @performance
 * - Cached responses: < 100ms (served from Next.js cache)
 * - Fresh analysis: 5-30 seconds depending on repository size
 * - API calls: 1 + ceil(commits/100) GitHub API requests
 * 
 * @author GitHub Contribution Dashboard Team
 * @since 1.0.0
 */

import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from 'next/cache';
import { getSession } from "@/lib/auth";
import { createGitHubClient, checkRateLimit } from "@/lib/github";
import { extractTimelineFromGitHub } from "@/lib/git/timeline";
import { extractUserMetricsFromCommits } from "@/lib/git/user-metrics";
import { aggregateAllUsersToWeekly } from "@/lib/aggregation";
import { extractInsights } from "@/lib/insights";
import { GITHUB_API_LIMITS } from "@/lib/constants";
import { fetchCommitsForBranch } from "@/lib/github-api-commits";
import type { AdvancedAnalysisResponse } from "@/lib/types";

export const maxDuration = 300; // 5 minutes for large repositories

interface RequestBody {
  owner: string;
  repo: string;
  branch: string;
  since?: string;
  until?: string;
}

/**
 * POST /api/github/analyze/advanced
 * 
 * Extracts comprehensive timeline and user contribution data from GitHub API
 * 
 * Request body:
 * - owner: Repository owner
 * - repo: Repository name
 * - branch: Branch name
 * - since: Optional start date (defaults to 5 years ago)
 * - until: Optional end date (defaults to now)
 */
export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { owner, repo, branch, since, until } = body;

    // Validate required parameters
    if (!owner || !repo || !branch) {
      return NextResponse.json(
        { error: "owner, repo, and branch are required" },
        { status: 400 }
      );
    }

    // Get authenticated session
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in." },
        { status: 401 }
      );
    }

    const octokit = createGitHubClient(session.accessToken);

    // Check rate limits before processing
    const { remaining } = await checkRateLimit(octokit);
    if (remaining < GITHUB_API_LIMITS.RATE_LIMIT_WARNING_THRESHOLD) {
      return NextResponse.json(
        { 
          error: `GitHub API rate limit low (${remaining} requests remaining). Please try again later.`,
          code: 'RATE_LIMIT_LOW',
        },
        { status: 429 }
      );
    }

    // Use cached analysis function (24-hour cache)
    const getCachedAnalysis = unstable_cache(
      async () => performAnalysis(octokit, owner, repo, branch, since, until),
      ['advanced-analysis', owner, repo, branch, since || 'default', until || 'default'],
      { 
        revalidate: 86400, // 24 hours
        tags: [`analysis-${owner}-${repo}-${branch}`],
      }
    );

    const result = await getCachedAnalysis();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Advanced analysis error:", error);

    // Return appropriate error response
    const message = error.message || "Failed to perform advanced analysis";
    const status = error.status || 500;
    const code = error.code || 'ANALYSIS_ERROR';

    return NextResponse.json(
      { error: message, code, details: process.env.NODE_ENV === 'development' ? error.stack : undefined },
      { status }
    );
  }
}

/**
 * Perform the actual analysis (cacheable function)
 * 
 * OPTIMIZATION: Fetches commits once and reuses for all user metrics extraction.
 * This reduces GitHub API calls significantly for repositories with multiple contributors.
 */
async function performAnalysis(
  octokit: any,
  owner: string,
  repo: string,
  branch: string,
  since?: string,
  until?: string
): Promise<AdvancedAnalysisResponse> {
  // Fetch commits once for efficiency (avoids redundant API calls)
  const commits = await fetchCommitsForBranch(octokit, owner, repo, branch, {
    since,
    until,
    maxCommits: GITHUB_API_LIMITS.MAX_COMMITS_PER_REQUEST,
    excludeMerges: true,
  });

  // Extract timeline data using pre-fetched commits (no redundant API call)
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

  // Aggregate weekly metrics for all users
  const usersWithWeekly = aggregateAllUsersToWeekly(timeline.users);
  timeline.users = usersWithWeekly;

  // Prepare user list for extracting individual metrics
  const userList = timeline.users.map(user => ({
    name: user.userName,
    email: user.email || user.userId,
    avatarUrl: user.avatarUrl,
  }));

  // Extract detailed user contribution data for heatmaps
  // IMPORTANT: Uses pre-fetched commits for efficiency (no redundant API calls)
  const userContributions = userList.map(user =>
    extractUserMetricsFromCommits(
      commits,
      user.name,
      user.email,
      user.avatarUrl
    )
  );

  // Transform commits to the format expected by extractInsights
  const commitDetails = commits.map(c => ({
    sha: c.sha,
    author: c.authorName,
    date: c.date,
    message: '', // Message not needed for insights
    additions: c.additions,
    deletions: c.deletions,
    files: c.files,
  }));

  // Build file contributors map for collaboration insights
  const fileContributors = new Map<string, Set<string>>();
  for (const commit of commits) {
    for (const file of commit.files) {
      if (!fileContributors.has(file)) {
        fileContributors.set(file, new Set());
      }
      fileContributors.get(file)!.add(commit.authorName);
    }
  }

  // Extract comprehensive insights with language analysis
  const insights = extractInsights(timeline.users, commitDetails, fileContributors);

  // Build response
  return {
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
}

/**
 * GET /api/github/analyze/advanced
 * 
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json({
    endpoint: "/api/github/analyze/advanced",
    method: "POST",
    description: "Extract comprehensive timeline and user contribution data using GitHub API",
    parameters: {
      owner: {
        type: "string",
        required: true,
        description: "Repository owner (username or organization)",
      },
      repo: {
        type: "string",
        required: true,
        description: "Repository name",
      },
      branch: {
        type: "string",
        required: true,
        description: "Branch name to analyze",
      },
      since: {
        type: "string",
        required: false,
        description: "Start date (ISO format, defaults to 5 years ago)",
      },
      until: {
        type: "string",
        required: false,
        description: "End date (ISO format, defaults to now)",
      },
    },
    response: {
      timeline: "Repository timeline with per-user daily metrics",
      userContributions: "Detailed user contribution data for heatmaps",
      insights: "Extracted insights and patterns",
      metadata: "Analysis metadata (commits analyzed, date range, etc.)",
    },
    notes: [
      "Uses GitHub REST API for all data fetching",
      "Automatically excludes merge commits (commit.parents.length >= 2)",
      "Limited to 5,000 commits per request",
      "Results are cached for 24 hours",
      "Requires GitHub authentication",
      "May take several minutes for large repositories",
    ],
    streaming: {
      endpoint: "/api/github/analyze/advanced/stream",
      description: "Server-Sent Events endpoint for real-time progress updates",
    },
  });
}

