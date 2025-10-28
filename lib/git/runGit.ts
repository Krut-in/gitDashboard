/**
 * Git Command Execution Utility
 * 
 * Provides safe execution of git commands with proper error handling and validation.
 * Used as the foundation for git blame and git log operations.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { access } from "node:fs/promises";
import { join } from "node:path";

const execFileAsync = promisify(execFile);

/**
 * Validates that the given path is a valid git repository
 * @param repoPath - Absolute path to repository
 * @throws Error if .git directory is not found
 */
export async function ensureGitRepo(repoPath: string): Promise<void> {
  try {
    const dotGit = join(repoPath, ".git");
    await access(dotGit);
  } catch {
    throw new Error(
      `Not a valid git repository: ${repoPath} (missing .git directory)`
    );
  }
}

/**
 * Executes a git command safely with timeout and buffer limits
 * @param args - Git command arguments (e.g., ['log', '--oneline'])
 * @param opts - Execution options including working directory
 * @returns Object containing stdout and stderr
 * @throws Error if git command fails or times out
 */
export async function runGit(
  args: string[],
  opts: { cwd: string; timeoutMs?: number }
): Promise<{ stdout: string; stderr: string }> {
  try {
    const { stdout, stderr } = await execFileAsync("git", args, {
      cwd: opts.cwd,
      timeout: opts.timeoutMs ?? 0,
      maxBuffer: 1024 * 1024 * 200, // 200MB buffer for large repositories
      encoding: "utf8",
    });
    return { stdout, stderr };
  } catch (error: any) {
    const message =
      error.stderr ||
      error.message ||
      "Git command failed with unknown error";
    throw new Error(`Git error: ${message}`);
  }
}
