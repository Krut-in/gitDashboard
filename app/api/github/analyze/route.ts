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
import { createGitHubClient } from '@/lib/github';
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
import { computeBlameAttribution } from '@/lib/git/blame';
import { computeCommitStats } from '@/lib/git/commits';
import { fetchCommitsForBranch } from '@/lib/github-api-commits';
import { Octokit } from '@octokit/rest';
import type { AnalysisConfig } from '@/lib/analysis-modes';

/**
 * Convert CommitData to GitHubCommit format for analysis
 * Maps the simplified CommitData from github-api-commits to the full GitHubCommit format
 */
function convertToGitHubCommits(
  commits: Array<{ sha: string; authorName: string; authorEmail: string; date: string; additions: number; deletions: number }>
): GitHubCommit[] {
  return commits.map(commit => ({
    sha: commit.sha,
    commit: {
      author: {
        name: commit.authorName,
        email: commit.authorEmail,
        date: commit.date,
      },
      message: '', // Not available in simplified format
    },
    author: null,
    stats: {
      additions: commit.additions,
      deletions: commit.deletions,
      total: commit.additions + commit.deletions,
    },
    files: [],
    parents: [], // Single parent assumed (non-merge commits)
  }));
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

    // Fetch all commits using centralized function (with stats)
    const commitData = await fetchCommitsForBranch(octokit, owner, repo, branch, {
      excludeMerges: false, // Include all commits for legacy mode
      maxCommits: 5000,
    });

    if (commitData.length === 0) {
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

    // Convert to GitHubCommit format for analysis
    const commits = convertToGitHubCommits(commitData);

    // Analyze commits
    const analysis = analyzeCommits(commits, { includeBots });

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
