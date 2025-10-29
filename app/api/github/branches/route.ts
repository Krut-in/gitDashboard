/**
 * GitHub Branches API Route
 * 
 * GET /api/github/branches
 * Returns list of branches for a specified repository.
 * 
 * Query parameters:
 * - owner: Repository owner (required)
 * - repo: Repository name (required)
 * - page: Page number (default: 1)
 * - per_page: Items per page (default: 30, max: 100)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createGitHubClient } from '@/lib/github';
import { toErrorResponse } from '@/lib/errors';
import { Branch } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const owner = searchParams.get('owner');
    const repo = searchParams.get('repo');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = Math.min(
      parseInt(searchParams.get('per_page') || '30', 10),
      100
    );

    // Validate required parameters
    if (!owner || !repo) {
      return NextResponse.json(
        { error: 'Missing required parameters: owner and repo' },
        { status: 400 }
      );
    }

    // Create GitHub client
    const octokit = createGitHubClient(session.accessToken);

    // Fetch branches
    const { data, headers } = await octokit.repos.listBranches({
      owner,
      repo,
      page,
      per_page: perPage,
    });

    // Map to simplified branch structure
    const branches: Branch[] = data.map(branch => ({
      name: branch.name,
      commit: {
        sha: branch.commit.sha,
        url: branch.commit.url,
      },
      protected: branch.protected,
    }));

    // Parse pagination from Link header
    const linkHeader = headers.link || '';
    const hasNext = linkHeader.includes('rel="next"');
    const hasPrev = page > 1;

    return NextResponse.json(
      {
        branches,
        pagination: {
          page,
          perPage,
          hasNext,
          hasPrev,
        },
      },
      {
        headers: {
          'X-RateLimit-Limit': headers['x-ratelimit-limit'] || '',
          'X-RateLimit-Remaining': headers['x-ratelimit-remaining'] || '',
          'X-RateLimit-Reset': headers['x-ratelimit-reset'] || '',
        },
      }
    );
  } catch (error) {
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(
      { error: errorResponse.message },
      { status: errorResponse.status || 500 }
    );
  }
}
