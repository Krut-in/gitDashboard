/**
 * Git Blame Attribution Engine
 * 
 * Computes true line-level code ownership using git blame.
 * This approach correctly attributes code to the original authors,
 * ignoring merge commits and respecting code moves/renames.
 * 
 * Key features:
 * - Whitespace-insensitive attribution (-w)
 * - Detects code moves within files (-M)
 * - Detects code copied across files (-C)
 * - Normalizes author identities via .mailmap
 * - Honors .git-blame-ignore-revs for mass refactors
 */

import os from "node:os";
import { runGit, ensureGitRepo } from "./runGit";

export type BlameOptions = {
  maxConcurrency?: number;
  respectIgnoreRevsFile?: boolean;
  ignoreWhitespace?: boolean;
  detectMoves?: boolean;
  detectCopies?: boolean;
  useMailmap?: boolean;
};

export type AuthorAttribution = {
  name: string;
  email?: string;
  lines: number;
};

type AuthorKey = { name: string; email?: string };

/**
 * Creates a unique key for author deduplication
 */
function keyFor(author: AuthorKey): string {
  const email = author.email?.toLowerCase().trim() || "";
  const name = author.name.trim();
  return `${name}__${email}`;
}

/**
 * Parses git blame --line-porcelain output and counts lines per author
 * Format: metadata lines followed by content line starting with tab
 */
function parsePorcelainAndCountAuthors(
  porcelain: string
): Map<string, number> {
  const counts = new Map<string, number>();
  let curName: string | undefined;
  let curEmail: string | undefined;

  const lines = porcelain.split("\n");
  for (const line of lines) {
    if (line.startsWith("author ")) {
      curName = line.substring("author ".length);
    } else if (line.startsWith("author-mail ")) {
      const raw = line.substring("author-mail ".length).trim();
      const m = raw.match(/^<(.+)>$/);
      curEmail = m ? m[1] : raw.replace(/[<>]/g, "");
    } else if (line.startsWith("\t")) {
      // Content line marks end of blame entry
      const name = (curName ?? "Unknown").trim();
      const email = curEmail?.trim();
      const k = keyFor({ name, email });
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * Runs git blame on a single file with specified options
 */
async function blameFile(
  repoPath: string,
  relPath: string,
  opts: BlameOptions
): Promise<Map<string, number>> {
  const args: string[] = [];

  if (opts.respectIgnoreRevsFile !== false) {
    args.push("-c", "blame.ignoreRevsFile=.git-blame-ignore-revs");
  }

  args.push("blame");

  if (opts.ignoreWhitespace !== false) args.push("-w");
  if (opts.detectMoves !== false) args.push("-M");
  if (opts.detectCopies !== false) args.push("-C");

  args.push("--line-porcelain", "--", relPath);

  try {
    const { stdout } = await runGit(args, { cwd: repoPath });
    return parsePorcelainAndCountAuthors(stdout);
  } catch (e: any) {
    // Skip binary files and files with issues
    if (
      e?.message?.includes("binary") ||
      e?.message?.includes("no such path") ||
      e?.message?.includes("fatal:")
    ) {
      return new Map();
    }
    console.warn(`Skipping ${relPath}: ${e?.message}`);
    return new Map();
  }
}

/**
 * Lists all tracked files in the repository
 */
async function listTrackedFiles(repoPath: string): Promise<string[]> {
  const { stdout } = await runGit(["ls-files", "-z"], { cwd: repoPath });
  return stdout
    .split("\0")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Merges source counts into target map
 */
function mergeCountsInto(
  target: Map<string, number>,
  src: Map<string, number>
): void {
  src.forEach((v, k) => {
    target.set(k, (target.get(k) ?? 0) + v);
  });
}

/**
 * Normalizes author identities using .mailmap via git check-mailmap
 */
async function normalizeWithMailmap(
  repoPath: string,
  counts: Map<string, number>
): Promise<Map<string, number>> {
  const entries = Array.from(counts.entries());
  const normalized = new Map<string, number>();

  for (const [k, v] of entries) {
    const [name, email] = k.split("__");
    const id = email ? `${name} <${email}>` : name;

    try {
      const { stdout } = await runGit(["check-mailmap", id], {
        cwd: repoPath,
      });
      const out = stdout.trim() || id;
      const m = out.match(/^(.*)\s+<(.+)>$/);
      const canonical = m
        ? `${m[1].trim()}__${m[2].trim().toLowerCase()}`
        : `${out.trim()}__`;
      normalized.set(canonical, (normalized.get(canonical) ?? 0) + v);
    } catch {
      // Fallback to original key if mailmap fails
      normalized.set(k, (normalized.get(k) ?? 0) + v);
    }
  }

  return normalized;
}

/**
 * Computes true line-level attribution for all tracked files in repository
 * Uses parallel processing for performance on large repositories
 * 
 * @param repoPath - Absolute path to git repository
 * @param opts - Blame configuration options
 * @returns Author attribution data with line counts
 */
export async function computeBlameAttribution(
  repoPath: string,
  opts: BlameOptions = {}
): Promise<{
  authors: AuthorAttribution[];
  filesProcessed: number;
  totalLines: number;
}> {
  await ensureGitRepo(repoPath);

  const files = await listTrackedFiles(repoPath);
  if (files.length === 0) {
    return { authors: [], filesProcessed: 0, totalLines: 0 };
  }

  const maxConcurrency =
    opts.maxConcurrency && opts.maxConcurrency > 0
      ? opts.maxConcurrency
      : Math.max(2, Math.min(os.cpus().length, 8));

  const totals = new Map<string, number>();
  let filesProcessed = 0;
  let fileIndex = 0;

  // Worker function for parallel processing
  async function worker(): Promise<void> {
    while (true) {
      const idx = fileIndex++;
      if (idx >= files.length) break;

      const file = files[idx];
      const counts = await blameFile(repoPath, file, opts);
      mergeCountsInto(totals, counts);
      filesProcessed++;
    }
  }

  // Execute workers in parallel
  await Promise.all(
    Array.from({ length: maxConcurrency }, () => worker())
  );

  // Normalize author identities if mailmap is enabled
  const finalCounts =
    opts.useMailmap !== false
      ? await normalizeWithMailmap(repoPath, totals)
      : totals;

  // Convert to sorted array
  const authors = Array.from(finalCounts.entries())
    .map(([k, lines]) => {
      const [name, email] = k.split("__");
      return { name, email: email || undefined, lines };
    })
    .sort((a, b) => b.lines - a.lines);

  const totalLines = authors.reduce((sum, a) => sum + a.lines, 0);

  return { authors, filesProcessed, totalLines };
}
