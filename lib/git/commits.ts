/**
 * Git Commit Statistics Engine
 * 
 * Analyzes commit history using git log to extract commit activity data.
 * Excludes merge commits by default to prevent false attribution.
 * 
 * Key features:
 * - Excludes merge commits (--no-merges)
 * - Tracks additions/deletions per author (--numstat)
 * - Normalizes author identities (--use-mailmap)
 * - Supports date filtering
 */

import { runGit, ensureGitRepo } from "./runGit";

export type CommitOptions = {
  excludeMerges?: boolean;
  since?: string;
  until?: string;
  branch?: string;
};

export type CommitAuthorStats = {
  name: string;
  email: string;
  commits: number;
  additions: number;
  deletions: number;
};

export type TimelineEntry = {
  date: string;
  author: string;
  commits: number;
};

/**
 * Analyzes git commit history and computes per-author statistics
 * 
 * @param repoPath - Absolute path to git repository
 * @param opts - Commit analysis options
 * @returns Author statistics and timeline data
 */
export async function computeCommitStats(
  repoPath: string,
  opts: CommitOptions = {}
): Promise<{
  authors: CommitAuthorStats[];
  timeline: TimelineEntry[];
}> {
  await ensureGitRepo(repoPath);

  const args = [
    "log",
    "--use-mailmap",
    "--numstat",
    "--format=%H%x09%aN%x09%aE%x09%ad%x09%s",
  ];

  // CRITICAL: Exclude merge commits by default to prevent false attribution
  if (opts.excludeMerges !== false) {
    args.push("--no-merges");
  }

  if (opts.since) args.push(`--since=${opts.since}`);
  if (opts.until) args.push(`--until=${opts.until}`);
  if (opts.branch) args.push(opts.branch);

  const { stdout } = await runGit(args, { cwd: repoPath });

  const authors = new Map<
    string,
    { commits: number; additions: number; deletions: number }
  >();
  const timeline: TimelineEntry[] = [];

  let currentCommit: {
    hash: string;
    name: string;
    email: string;
    date: string;
    subject: string;
  } | null = null;

  for (const line of stdout.split("\n")) {
    if (!line.trim()) continue;

    // Check if this is a commit header line (contains tabs but not numstat format)
    if (line.includes("\t") && !line.match(/^\d+\t\d+\t/)) {
      const parts = line.split("\t");
      if (parts.length >= 5) {
        const [hash, name, email, date, subject] = parts;
        currentCommit = {
          hash,
          name,
          email: email.toLowerCase(),
          date,
          subject,
        };

        const key = `${name}__${email.toLowerCase()}`;
        const existing = authors.get(key) || {
          commits: 0,
          additions: 0,
          deletions: 0,
        };
        existing.commits++;
        authors.set(key, existing);

        timeline.push({ date, author: name, commits: 1 });
      }
    } else if (line.match(/^\d+\t\d+\t/)) {
      // numstat line: additions, deletions, file
      const [addStr, delStr] = line.split("\t");
      const add = parseInt(addStr, 10);
      const del = parseInt(delStr, 10);

      if (currentCommit && !isNaN(add) && !isNaN(del)) {
        const key = `${currentCommit.name}__${currentCommit.email}`;
        const existing = authors.get(key);
        if (existing) {
          existing.additions += add;
          existing.deletions += del;
        }
      }
    }
  }

  const authorsList = Array.from(authors.entries())
    .map(([k, v]) => {
      const [name, email] = k.split("__");
      return { name, email, ...v };
    })
    .sort((a, b) => b.commits - a.commits);

  return {
    authors: authorsList,
    timeline,
  };
}
