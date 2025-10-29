/**
 * GitHub Analysis API Route
 * 
 * POST /api/github/analyze
 * Supports multiple analysis modes:
 * 1. blame - True line-level code ownership (requires repoPath)
 * 2. commits - Commit activity with --no-merges (requires repoPath)
 * 3. github-api - GitHub metadata only (PRs, issues)
 * 4. hybrid - All of the above combined
 * 5. (legacy) - Original GitHub API commit analysis
 * 
 * Request body:
 * - mode: Analysis mode (optional, defaults to legacy)
 * - repoPath: Local repository path (required for blame/commits/hybrid)
 * - owner: Repository owner (required for github-api)
 * - repo: Repository name (required for github-api)
 * - branch: Branch name (optional for legacy mode)
 * - includeBots: Include bot commits (optional, legacy mode)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createGitHubClient, checkRateLimit } from '@/lib/github';
import { toErrorResponse } from '@/lib/errors';
import { RequestQueue } from '@/lib/request-queue';
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
import { computeBlameAttribution } from '@/lib/git/blame';
import { computeCommitStats } from '@/lib/git/commits';
import { Octokit } from '@octokit/rest';
import type { AnalysisConfig } from '@/lib/analysis-modes';
import { GITHUB_API_LIMITS } from '@/lib/constants';

const COMMITS_PER_PAGE = GITHUB_API_LIMITS.COMMITS_PER_PAGE;

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
    // Parse request body
    const body = await request.json();
    const config = body as AnalysisConfig & AnalysisRequest & { includeBots?: boolean };

    // NEW: Handle blame mode (true line-level attribution)
    if (config.mode === 'blame') {
      if (!config.repoPath) {
        return NextResponse.json(
          { error: 'repoPath is required for blame mode' },
          { status: 400 }
        );
      }

      const result = await computeBlameAttribution(config.repoPath, {
        maxConcurrency: config.blameOptions?.maxConcurrency,
        respectIgnoreRevsFile: config.blameOptions?.respectIgnoreRevs ?? true,
        ignoreWhitespace: config.blameOptions?.ignoreWhitespace ?? true,
        detectMoves: config.blameOptions?.detectMoves ?? true,
        detectCopies: config.blameOptions?.detectCopies ?? true,
        useMailmap: config.blameOptions?.useMailmap ?? true,
      });

      return NextResponse.json({
        mode: 'blame',
        repoPath: config.repoPath,
        filesProcessed: result.filesProcessed,
        totalLines: result.totalLines,
        authors: result.authors,
      });
    }

    // NEW: Handle commits mode (git log --no-merges)
    if (config.mode === 'commits') {
      if (!config.repoPath) {
        return NextResponse.json(
          { error: 'repoPath is required for commits mode' },
          { status: 400 }
        );
      }

      const result = await computeCommitStats(config.repoPath, {
        excludeMerges: config.commitOptions?.excludeMerges ?? true,
        since: config.commitOptions?.since,
        until: config.commitOptions?.until,
        branch: config.commitOptions?.branch,
      });

      return NextResponse.json({
        mode: 'commits',
        repoPath: config.repoPath,
        authors: result.authors,
        timeline: result.timeline,
      });
    }

    // NEW: Handle github-api mode (metadata only)
    if (config.mode === 'github-api') {
      if (!config.githubOptions?.owner || !config.githubOptions?.repo) {
        return NextResponse.json(
          { error: 'owner and repo required for github-api mode' },
          { status: 400 }
        );
      }

      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const octokit = new Octokit({
        auth: config.githubOptions.token || session.accessToken,
      });

      const [prsData, issuesData, contributorsData] = await Promise.all([
        octokit.pulls.list({
          owner: config.githubOptions.owner,
          repo: config.githubOptions.repo,
          state: 'all',
          per_page: 100,
        }),
        octokit.issues.listForRepo({
          owner: config.githubOptions.owner,
          repo: config.githubOptions.repo,
          state: 'all',
          per_page: 100,
        }),
        octokit.repos.listContributors({
          owner: config.githubOptions.owner,
          repo: config.githubOptions.repo,
          per_page: 100,
        }),
      ]);

      return NextResponse.json({
        mode: 'github-api',
        pullRequests: prsData.data.length,
        issues: issuesData.data.length,
        contributors: contributorsData.data.map((c) => ({
          login: c.login,
          contributions: c.contributions,
        })),
      });
    }

    // NEW: Handle hybrid mode (all analyses combined)
    if (config.mode === 'hybrid') {
      if (!config.repoPath || !config.githubOptions?.owner || !config.githubOptions?.repo) {
        return NextResponse.json(
          { error: 'repoPath, owner, and repo required for hybrid mode' },
          { status: 400 }
        );
      }

      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const [blameData, commitData, githubData] = await Promise.all([
        computeBlameAttribution(config.repoPath, {
          ...config.blameOptions,
          useMailmap: config.blameOptions?.useMailmap ?? true,
        }),
        computeCommitStats(config.repoPath, {
          ...config.commitOptions,
          excludeMerges: true,
        }),
        (async () => {
          const octokit = new Octokit({
            auth: config.githubOptions!.token || session.accessToken,
          });
          const prs = await octokit.pulls.list({
            owner: config.githubOptions!.owner,
            repo: config.githubOptions!.repo,
            state: 'all',
            per_page: 100,
          });
          return { pullRequests: prs.data };
        })(),
      ]);

      return NextResponse.json({
        mode: 'hybrid',
        lineOwnership: blameData.authors,
        totalLines: blameData.totalLines,
        filesProcessed: blameData.filesProcessed,
        commitActivity: commitData.authors,
        timeline: commitData.timeline,
        pullRequests: githubData.pullRequests.length,
      });
    }

    // LEGACY: Original GitHub API mode (kept for backward compatibility)
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const { owner, repo, branch, includeBots = false } = config;

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
