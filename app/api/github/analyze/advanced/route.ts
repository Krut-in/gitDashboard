/**
 * Advanced Analysis API Endpoint
 * 
 * Provides detailed timeline data, user contributions, and insights.
 * Uses git log --no-merges and git blame for accurate attribution.
 */

import { NextRequest, NextResponse } from "next/server";
import { extractTimeline } from "@/lib/git/timeline";
import { extractAllUserMetrics } from "@/lib/git/user-metrics";
import { aggregateAllUsersToWeekly } from "@/lib/aggregation";
import { extractBasicInsights } from "@/lib/insights";
import type { AdvancedAnalysisResponse } from "@/lib/types";

export const maxDuration = 300; // 5 minutes for large repositories

interface RequestBody {
  repoPath: string;
  branch?: string;
  since?: string;
  until?: string;
}

/**
 * POST /api/github/analyze/advanced
 * 
 * Extracts comprehensive timeline and user contribution data from local repository
 * 
 * Request body:
 * - repoPath: Absolute path to git repository
 * - branch: Optional branch name (defaults to current branch)
 * - since: Optional start date (defaults to 5 years ago)
 * - until: Optional end date (defaults to now)
 */
export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();

    if (!body.repoPath) {
      return NextResponse.json(
        { error: "repoPath is required" },
        { status: 400 }
      );
    }

    // Extract timeline data (with --no-merges)
    const timeline = await extractTimeline(body.repoPath, {
      excludeMerges: true,
      since: body.since,
      until: body.until,
      branch: body.branch,
    });

    // Aggregate weekly metrics for all users
    const usersWithWeekly = aggregateAllUsersToWeekly(timeline.users);
    
    // Update timeline with weekly data
    timeline.users = usersWithWeekly;

    // Prepare user list for extracting individual metrics
    const userList = timeline.users.map(user => ({
      name: user.userName,
      email: user.email || user.userId,
      avatarUrl: user.avatarUrl,
    }));

    // Extract detailed user contribution data for heatmaps
    const userContributions = await extractAllUserMetrics(
      body.repoPath,
      userList,
      {
        since: body.since,
        until: body.until,
        branch: body.branch,
      }
    );

    // Extract insights from timeline data
    const insights = extractBasicInsights(timeline.users);

    // Build response
    const response: AdvancedAnalysisResponse = {
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

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("Advanced analysis error:", error);

    // Return appropriate error response
    const message = error.message || "Failed to perform advanced analysis";
    const status = error.message?.includes("Not a valid git repository")
      ? 400
      : 500;

    return NextResponse.json(
      { error: message, details: error.stack },
      { status }
    );
  }
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
    description: "Extract comprehensive timeline and user contribution data",
    parameters: {
      repoPath: {
        type: "string",
        required: true,
        description: "Absolute path to git repository",
      },
      branch: {
        type: "string",
        required: false,
        description: "Branch name (defaults to current branch)",
      },
      since: {
        type: "string",
        required: false,
        description: "Start date (ISO format or relative like '5 years ago')",
      },
      until: {
        type: "string",
        required: false,
        description: "End date (ISO format)",
      },
    },
    response: {
      timeline: "Repository timeline with per-user daily metrics",
      userContributions: "Detailed user contribution data for heatmaps",
      insights: "Extracted insights and patterns",
      metadata: "Analysis metadata (commits analyzed, date range, etc.)",
    },
    notes: [
      "Uses git log --no-merges for accurate attribution",
      "Limited to last 5 years OR 10,000 commits (whichever comes first)",
      "May take several minutes for large repositories",
    ],
  });
}

