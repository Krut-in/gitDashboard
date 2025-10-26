/**
 * Contribution Analysis Engine
 * 
 * Core analysis utilities for aggregating GitHub contribution statistics.
 * Processes commit data to compute per-contributor metrics including:
 * - Commit counts, line additions/deletions, net changes
 * - Date ranges (first/last commit) and active days
 * - Supplementary reports: commit messages, times, files, merges
 * - CSV export serialization
 * 
 * Handles edge cases: duplicate contributors, missing data, bot users, large diffs.
 */

import { z } from 'zod';
import { parseUTC, daysDifference, formatISO } from './date';

/**
 * Schema for raw GitHub commit data from API
 */
export const GitHubCommitSchema = z.object({
  sha: z.string(),
  commit: z.object({
    author: z.object({
      name: z.string().optional(),
      email: z.string().optional(),
      date: z.string().optional(),
    }).optional(),
    message: z.string(),
  }),
  author: z.object({
    login: z.string(),
    id: z.number(),
    avatar_url: z.string().optional(),
  }).nullable().optional(),
  stats: z.object({
    additions: z.number(),
    deletions: z.number(),
    total: z.number(),
  }).optional(),
  files: z.array(z.object({
    filename: z.string(),
    additions: z.number(),
    deletions: z.number(),
    changes: z.number(),
  })).optional(),
  parents: z.array(z.object({
    sha: z.string(),
  })).optional(),
});

export type GitHubCommit = z.infer<typeof GitHubCommitSchema>;

/**
 * Schema for contributor statistics
 */
export const ContributorStatsSchema = z.object({
  name: z.string(),
  email: z.string(),
  githubId: z.number().nullable(),
  githubLogin: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  commitCount: z.number(),
  additions: z.number(),
  deletions: z.number(),
  netLines: z.number(),
  firstCommitDate: z.string().nullable(),
  lastCommitDate: z.string().nullable(),
  activeDays: z.number(),
  isMergeCommitter: z.boolean(),
});

export type ContributorStats = z.infer<typeof ContributorStatsSchema>;

/**
 * Schema for commit message entry
 */
export const CommitMessageSchema = z.object({
  sha: z.string(),
  author: z.string(),
  date: z.string(),
  message: z.string(),
});

export type CommitMessage = z.infer<typeof CommitMessageSchema>;

/**
 * Schema for commit time entry
 */
export const CommitTimeSchema = z.object({
  sha: z.string(),
  author: z.string(),
  date: z.string(),
  timestamp: z.number(),
});

export type CommitTime = z.infer<typeof CommitTimeSchema>;

/**
 * Schema for file-by-author entry
 */
export const FileByAuthorSchema = z.object({
  author: z.string(),
  filename: z.string(),
  additions: z.number(),
  deletions: z.number(),
  changes: z.number(),
});

export type FileByAuthor = z.infer<typeof FileByAuthorSchema>;

/**
 * Schema for merge commit entry
 */
export const MergeCommitSchema = z.object({
  sha: z.string(),
  author: z.string(),
  date: z.string(),
  message: z.string(),
  parentCount: z.number(),
});

export type MergeCommit = z.infer<typeof MergeCommitSchema>;

/**
 * Schema for complete analysis result
 */
export const AnalysisResultSchema = z.object({
  contributors: z.array(ContributorStatsSchema),
  commitMessages: z.array(CommitMessageSchema),
  commitTimes: z.array(CommitTimeSchema),
  filesByAuthor: z.array(FileByAuthorSchema),
  merges: z.array(MergeCommitSchema),
  warnings: z.array(z.string()),
  metadata: z.object({
    totalCommits: z.number(),
    analyzedCommits: z.number(),
    totalContributors: z.number(),
    dateRange: z.object({
      start: z.string().nullable(),
      end: z.string().nullable(),
    }),
  }),
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

/**
 * Internal contributor accumulator for aggregation
 */
interface ContributorAccumulator {
  name: string;
  emails: Set<string>;
  githubId: number | null;
  githubLogin: string | null;
  avatarUrl: string | null;
  commitCount: number;
  additions: number;
  deletions: number;
  commitDates: Date[];
  mergeCommitCount: number;
}

/**
 * Normalize email for comparison (lowercase, trim)
 */
function normalizeEmail(email: string | undefined): string {
  if (!email) return 'unknown@unknown';
  return email.toLowerCase().trim();
}

/**
 * Normalize name for comparison (lowercase, trim, remove extra spaces)
 */
function normalizeName(name: string | undefined): string {
  if (!name) return 'Unknown';
  return name.trim().replace(/\s+/g, ' ');
}

/**
 * Create a unique key for a contributor
 * Priority: GitHub ID > normalized email > normalized name
 */
function getContributorKey(commit: GitHubCommit): string {
  if (commit.author?.id) {
    return `github:${commit.author.id}`;
  }
  
  const email = normalizeEmail(commit.commit.author?.email);
  if (email && !email.includes('noreply')) {
    return `email:${email}`;
  }
  
  const name = normalizeName(commit.commit.author?.name);
  return `name:${name}`;
}

/**
 * Check if a commit is a merge commit (has multiple parents)
 */
function isMergeCommit(commit: GitHubCommit): boolean {
  return (commit.parents?.length || 0) > 1;
}

/**
 * Check if contributor appears to be a bot
 */
function isBot(name: string, email: string): boolean {
  const botPatterns = [
    /bot/i,
    /\[bot\]/i,
    /automated/i,
    /github-actions/i,
    /dependabot/i,
    /renovate/i,
  ];
  
  return botPatterns.some(pattern => 
    pattern.test(name) || pattern.test(email)
  );
}

/**
 * Deduplicate and merge contributor data
 * Groups commits by the same person using GitHub ID, email, or name
 */
export function deduplicateContributors(
  commits: GitHubCommit[]
): Map<string, ContributorAccumulator> {
  const contributors = new Map<string, ContributorAccumulator>();

  for (const commit of commits) {
    const key = getContributorKey(commit);
    const email = normalizeEmail(commit.commit.author?.email);
    const name = normalizeName(commit.commit.author?.name);
    const date = parseUTC(commit.commit.author?.date);

    if (!contributors.has(key)) {
      contributors.set(key, {
        name,
        emails: new Set([email]),
        githubId: commit.author?.id || null,
        githubLogin: commit.author?.login || null,
        avatarUrl: commit.author?.avatar_url || null,
        commitCount: 0,
        additions: 0,
        deletions: 0,
        commitDates: [],
        mergeCommitCount: 0,
      });
    }

    const contributor = contributors.get(key)!;
    contributor.emails.add(email);
    contributor.commitCount++;
    contributor.additions += commit.stats?.additions || 0;
    contributor.deletions += commit.stats?.deletions || 0;
    
    if (date) {
      contributor.commitDates.push(date);
    }

    if (isMergeCommit(commit)) {
      contributor.mergeCommitCount++;
    }

    // Update name if we have a better one (prefer GitHub login)
    if (commit.author?.login && !contributor.githubLogin) {
      contributor.githubLogin = commit.author.login;
      contributor.name = commit.author.login;
    }
  }

  return contributors;
}

/**
 * Aggregate contributor statistics from accumulated data
 */
export function aggregateStats(
  contributors: Map<string, ContributorAccumulator>
): ContributorStats[] {
  const results: ContributorStats[] = [];

  for (const [, contributor] of contributors) {
    const sortedDates = contributor.commitDates.sort((a, b) => a.getTime() - b.getTime());
    const firstDate = sortedDates[0] || null;
    const lastDate = sortedDates[sortedDates.length - 1] || null;
    const activeDays = daysDifference(firstDate, lastDate);

    results.push({
      name: contributor.name,
      email: Array.from(contributor.emails)[0], // Primary email
      githubId: contributor.githubId,
      githubLogin: contributor.githubLogin,
      avatarUrl: contributor.avatarUrl,
      commitCount: contributor.commitCount,
      additions: contributor.additions,
      deletions: contributor.deletions,
      netLines: contributor.additions - contributor.deletions,
      firstCommitDate: formatISO(firstDate),
      lastCommitDate: formatISO(lastDate),
      activeDays,
      isMergeCommitter: contributor.mergeCommitCount > 0,
    });
  }

  // Sort by commit count descending
  return results.sort((a, b) => b.commitCount - a.commitCount);
}

/**
 * Build supplementary reports: commit messages, times, files, merges
 */
export function buildSupplementaryReports(commits: GitHubCommit[]): {
  commitMessages: CommitMessage[];
  commitTimes: CommitTime[];
  filesByAuthor: FileByAuthor[];
  merges: MergeCommit[];
} {
  const commitMessages: CommitMessage[] = [];
  const commitTimes: CommitTime[] = [];
  const filesByAuthor: FileByAuthor[] = [];
  const merges: MergeCommit[] = [];

  for (const commit of commits) {
    const author = commit.author?.login || 
                   commit.commit.author?.name || 
                   'Unknown';
    const date = commit.commit.author?.date || '';
    const dateObj = parseUTC(date);

    // Commit messages
    commitMessages.push({
      sha: commit.sha,
      author,
      date,
      message: commit.commit.message.split('\n')[0], // First line only
    });

    // Commit times
    if (dateObj) {
      commitTimes.push({
        sha: commit.sha,
        author,
        date,
        timestamp: dateObj.getTime(),
      });
    }

    // Files by author
    if (commit.files && commit.files.length > 0) {
      for (const file of commit.files) {
        // Skip very large files (likely binary)
        if (file.changes > 10000) continue;

        filesByAuthor.push({
          author,
          filename: file.filename,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
        });
      }
    }

    // Merge commits
    if (isMergeCommit(commit)) {
      merges.push({
        sha: commit.sha,
        author,
        date,
        message: commit.commit.message.split('\n')[0],
        parentCount: commit.parents?.length || 0,
      });
    }
  }

  return { commitMessages, commitTimes, filesByAuthor, merges };
}

/**
 * Serialize contributors to CSV format
 */
export function serializeContributorsCSV(contributors: ContributorStats[]): string {
  const headers = [
    'Name',
    'Email',
    'GitHub ID',
    'GitHub Login',
    'Commit Count',
    'Additions',
    'Deletions',
    'Net Lines',
    'First Commit',
    'Last Commit',
    'Active Days',
    'Has Merges',
  ];

  const rows = contributors.map(c => [
    escapeCSV(c.name),
    escapeCSV(c.email),
    c.githubId?.toString() || '',
    c.githubLogin || '',
    c.commitCount.toString(),
    c.additions.toString(),
    c.deletions.toString(),
    c.netLines.toString(),
    c.firstCommitDate || '',
    c.lastCommitDate || '',
    c.activeDays.toString(),
    c.isMergeCommitter ? 'Yes' : 'No',
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Serialize commit messages to text format
 */
export function serializeCommitMessages(messages: CommitMessage[]): string {
  return messages
    .map(m => `${m.sha.substring(0, 7)} | ${m.author} | ${m.date} | ${m.message}`)
    .join('\n');
}

/**
 * Serialize commit times to text format
 */
export function serializeCommitTimes(times: CommitTime[]): string {
  return times
    .map(t => `${t.sha.substring(0, 7)} | ${t.author} | ${t.date} | ${t.timestamp}`)
    .join('\n');
}

/**
 * Serialize files-by-author to text format
 */
export function serializeFilesByAuthor(files: FileByAuthor[]): string {
  return files
    .map(f => `${f.author} | ${f.filename} | +${f.additions} -${f.deletions} (${f.changes})`)
    .join('\n');
}

/**
 * Serialize merge commits to text format
 */
export function serializeMerges(merges: MergeCommit[]): string {
  return merges
    .map(m => `${m.sha.substring(0, 7)} | ${m.author} | ${m.date} | Parents: ${m.parentCount} | ${m.message}`)
    .join('\n');
}

/**
 * Escape CSV values (handle commas, quotes, newlines)
 */
function escapeCSV(value: string | null | undefined): string {
  if (!value) return '';
  
  const needsQuotes = /[",\n\r]/.test(value);
  if (needsQuotes) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  
  return value;
}

/**
 * Main analysis function - processes commits and returns complete results
 */
export function analyzeCommits(
  commits: GitHubCommit[],
  options: { includeBots?: boolean } = {}
): AnalysisResult {
  const warnings: string[] = [];

  // Filter out invalid commits
  const validCommits = commits.filter(commit => {
    try {
      GitHubCommitSchema.parse(commit);
      return true;
    } catch {
      warnings.push(`Invalid commit data: ${commit.sha}`);
      return false;
    }
  });

  if (validCommits.length === 0) {
    return {
      contributors: [],
      commitMessages: [],
      commitTimes: [],
      filesByAuthor: [],
      merges: [],
      warnings: ['No valid commits to analyze'],
      metadata: {
        totalCommits: commits.length,
        analyzedCommits: 0,
        totalContributors: 0,
        dateRange: { start: null, end: null },
      },
    };
  }

  // Filter bots if requested
  let processedCommits = validCommits;
  if (!options.includeBots) {
    processedCommits = validCommits.filter(commit => {
      const name = commit.commit.author?.name || '';
      const email = commit.commit.author?.email || '';
      return !isBot(name, email);
    });
  }

  // Deduplicate and aggregate
  const contributorMap = deduplicateContributors(processedCommits);
  const contributors = aggregateStats(contributorMap);

  // Build supplementary reports
  const supplementary = buildSupplementaryReports(processedCommits);

  // Calculate date range
  const allDates = processedCommits
    .map(c => parseUTC(c.commit.author?.date))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  const dateRange = {
    start: allDates[0] ? formatISO(allDates[0]) : null,
    end: allDates[allDates.length - 1] ? formatISO(allDates[allDates.length - 1]) : null,
  };

  return {
    contributors,
    ...supplementary,
    warnings,
    metadata: {
      totalCommits: commits.length,
      analyzedCommits: processedCommits.length,
      totalContributors: contributors.length,
      dateRange,
    },
  };
}
