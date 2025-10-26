/**
 * GitHub Repositories API Route
 * 
 * GET /api/github/repos
 * Returns paginated list of repositories for the authenticated user.
 * Includes both public and private repositories based on OAuth scopes.
 * 
 * Query parameters:
 * - page: Page number (default: 1)
 * - per_page: Items per page (default: 30, max: 100)
 * - sort: Sort field (default: updated)
 * - direction: Sort direction (default: desc)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createGitHubClient, handleGitHubError } from '@/lib/github';
import { toErrorResponse } from '@/lib/errors';
import { Repository } from '@/lib/types';

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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = Math.min(
      parseInt(searchParams.get('per_page') || '30', 10),
      100
    );
    const sort = searchParams.get('sort') || 'updated';
    const direction = searchParams.get('direction') || 'desc';

    // Create GitHub client
    const octokit = createGitHubClient(session.accessToken);

    // Fetch repositories
    const { data, headers } = await octokit.repos.listForAuthenticatedUser({
      page,
      per_page: perPage,
      sort: sort as any,
      direction: direction as any,
      affiliation: 'owner,collaborator,organization_member',
    });

    // Map to simplified repository structure
    const repositories: Repository[] = data.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
      open_issues_count: repo.open_issues_count,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      private: repo.private,
    }));

    // Parse pagination from Link header
    const linkHeader = headers.link || '';
    const hasNext = linkHeader.includes('rel="next"');
    const hasPrev = page > 1;

    // Pass through rate limit headers
    return NextResponse.json(
      {
        repositories,
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
