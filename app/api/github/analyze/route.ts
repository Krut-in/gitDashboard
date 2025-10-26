/**
 * GitHub Analysis API Route
 * 
 * POST /api/github/analyze
 * Analyzes contribution statistics for a repository branch.
 * Returns detailed contributor metrics and supplementary reports.
 * 
 * Request body:
 * - owner: Repository owner (required)
 * - repo: Repository name (required)
 * - branch: Branch name (required)
 * - includeBots: Include bot commits (optional, default: false)
 * 
 * Features:
 * - Efficient pagination with concurrency control
 * - Rate limit awareness and backoff
 * - Partial results on errors
 * - CSV and text export generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createGitHubClient, checkRateLimit } from '@/lib/github';
import { toErrorResponse } from '@/lib/errors';
import { 
  analyzeCommits,
  serializeContributorsCSV,
  serializeCommitMessages,
  serializeCommitTimes,
  serializeFilesByAuthor,
  serializeMerges,
  GitHubCommit,
} from '@/lib/analysis';
import { AnalysisRequest, AnalysisResponse } from '@/lib/types';

const MAX_CONCURRENT_REQUESTS = 3;
const COMMITS_PER_PAGE = 100;

/**
 * Queue for managing concurrent API requests
 */
class RequestQueue {
  private queue: Array<() => Promise<any>> = [];
  private running = 0;

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.running >= MAX_CONCURRENT_REQUESTS || this.queue.length === 0) {
      return;
    }

    this.running++;
    const fn = this.queue.shift();
    
    if (fn) {
      try {
        await fn();
      } finally {
        this.running--;
        this.process();
      }
    }
  }
}

/**
 * Fetch all commits for a branch with pagination
 */
async function fetchAllCommits(
  octokit: any,
  owner: string,
  repo: string,
  branch: string
): Promise<GitHubCommit[]> {
  const commits: GitHubCommit[] = [];
  const queue = new RequestQueue();
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const currentPage = page;
    
    const pageCommits = await queue.add(async () => {
      // Check rate limit before each request
      const { shouldWait, resetTime, remaining } = await checkRateLimit(octokit);
      
      if (remaining < 50) {
        throw new Error('Approaching rate limit. Please try again later.');
      }

      if (shouldWait && resetTime) {
        const waitTime = Math.min(
          60000, // Max 1 minute
          resetTime.getTime() - Date.now()
        );
        if (waitTime > 0) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }

      try {
        const { data } = await octokit.repos.listCommits({
          owner,
          repo,
          sha: branch,
          page: currentPage,
          per_page: COMMITS_PER_PAGE,
        });

        return data;
      } catch (error: any) {
        if (error.status === 409) {
          // Empty repository
          return [];
        }
        throw error;
      }
    });

    if (pageCommits.length === 0) {
      hasMore = false;
    } else {
      commits.push(...pageCommits);
      hasMore = pageCommits.length === COMMITS_PER_PAGE;
      page++;
    }

    // Limit total pages to prevent excessive API usage
    if (page > 100) {
      console.warn('Reached page limit, stopping pagination');
      hasMore = false;
    }
  }

  return commits;
}

/**
 * Hydrate commit stats (additions/deletions) for commits missing this data
 */
async function hydrateCommitStats(
  octokit: any,
  owner: string,
  repo: string,
  commits: GitHubCommit[]
): Promise<GitHubCommit[]> {
  const queue = new RequestQueue();
  const hydrated: GitHubCommit[] = [];

  for (const commit of commits) {
    // Skip if stats already present
    if (commit.stats) {
      hydrated.push(commit);
      continue;
    }

    // Fetch individual commit with stats
    const detailedCommit = await queue.add(async () => {
      try {
        const { data } = await octokit.repos.getCommit({
          owner,
          repo,
          ref: commit.sha,
        });
        return data;
      } catch (error) {
        // If fetch fails, return original commit with zero stats
        return {
          ...commit,
          stats: { additions: 0, deletions: 0, total: 0 },
        };
      }
    });

    hydrated.push(detailedCommit);

    // Limit hydration to first 1000 commits to avoid excessive API usage
    if (hydrated.length >= 1000) {
      console.warn('Reached hydration limit, using partial data');
      hydrated.push(...commits.slice(hydrated.length).map(c => ({
        ...c,
        stats: c.stats || { additions: 0, deletions: 0, total: 0 },
      })));
      break;
    }
  }

  return hydrated;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json() as AnalysisRequest & { includeBots?: boolean };
    const { owner, repo, branch, includeBots = false } = body;

    // Validate required parameters
    if (!owner || !repo || !branch) {
      return NextResponse.json(
        { error: 'Missing required parameters: owner, repo, and branch' },
        { status: 400 }
      );
    }

    // Create GitHub client
    const octokit = createGitHubClient(session.accessToken);

    // Fetch all commits
    const commits = await fetchAllCommits(octokit, owner, repo, branch);

    if (commits.length === 0) {
      return NextResponse.json({
        contributors: [],
        commitMessages: [],
        commitTimes: [],
        filesByAuthor: [],
        merges: [],
        warnings: ['No commits found in this branch'],
        metadata: {
          totalCommits: 0,
          analyzedCommits: 0,
          totalContributors: 0,
          dateRange: { start: null, end: null },
        },
        exports: {
          contributorsCSV: '',
          commitMessagesText: '',
          commitTimesText: '',
          filesByAuthorText: '',
          mergesText: '',
        },
      });
    }

    // Hydrate missing stats
    const hydratedCommits = await hydrateCommitStats(octokit, owner, repo, commits);

    // Analyze commits
    const analysis = analyzeCommits(hydratedCommits, { includeBots });

    // Generate exports
    const exports = {
      contributorsCSV: serializeContributorsCSV(analysis.contributors),
      commitMessagesText: serializeCommitMessages(analysis.commitMessages),
      commitTimesText: serializeCommitTimes(analysis.commitTimes),
      filesByAuthorText: serializeFilesByAuthor(analysis.filesByAuthor),
      mergesText: serializeMerges(analysis.merges),
    };

    const response: AnalysisResponse = {
      ...analysis,
      exports,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Analysis error:', error);
    const errorResponse = toErrorResponse(error);
    return NextResponse.json(
      { error: errorResponse.message },
      { status: errorResponse.status || 500 }
    );
  }
}
