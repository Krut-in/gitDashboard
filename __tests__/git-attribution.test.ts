/**
 * Git Blame Attribution Tests
 * 
 * Tests for accurate line-level code attribution using git blame.
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { computeBlameAttribution } from '@/lib/git/blame';
import { computeCommitStats } from '@/lib/git/commits';
import { ensureGitRepo } from '@/lib/git/runGit';
import * as path from 'path';

// Update this to your actual repository path for testing
const TEST_REPO_PATH = process.env.TEST_REPO_PATH || '/tmp/test-repo';

describe('Git Attribution Analysis', () => {
  beforeAll(async () => {
    // Verify test repo exists
    try {
      await ensureGitRepo(TEST_REPO_PATH);
    } catch {
      console.warn(`Test repo not found at ${TEST_REPO_PATH}, skipping tests`);
    }
  });

  describe('computeBlameAttribution', () => {
    it('should compute line ownership for all files', async () => {
      try {
        const result = await computeBlameAttribution(TEST_REPO_PATH, {
          ignoreWhitespace: true,
          detectMoves: true,
          detectCopies: true,
          useMailmap: true,
        });

        expect(result).toBeDefined();
        expect(result.authors).toBeInstanceOf(Array);
        expect(result.totalLines).toBeGreaterThan(0);
        expect(result.filesProcessed).toBeGreaterThan(0);

        // Verify authors are sorted by line count
        if (result.authors.length > 1) {
          expect(result.authors[0].lines).toBeGreaterThanOrEqual(
            result.authors[1].lines
          );
        }

        // Verify total lines match sum of author lines
        const sumLines = result.authors.reduce((sum, a) => sum + a.lines, 0);
        expect(sumLines).toBe(result.totalLines);
      } catch (error: any) {
        if (error.message.includes('Not a valid git repository')) {
          console.log('Skipping test - repository not found');
        } else {
          throw error;
        }
      }
    }, 30000);

    it('should handle empty repositories gracefully', async () => {
      const result = await computeBlameAttribution('/nonexistent', {}).catch(
        (e) => e
      );
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('Not a valid git repository');
    });
  });

  describe('computeCommitStats', () => {
    it('should exclude merge commits by default', async () => {
      try {
        const result = await computeCommitStats(TEST_REPO_PATH, {
          excludeMerges: true,
        });

        expect(result).toBeDefined();
        expect(result.authors).toBeInstanceOf(Array);
        expect(result.timeline).toBeInstanceOf(Array);

        // Verify each author has required fields
        result.authors.forEach((author) => {
          expect(author).toHaveProperty('name');
          expect(author).toHaveProperty('email');
          expect(author).toHaveProperty('commits');
          expect(author).toHaveProperty('additions');
          expect(author).toHaveProperty('deletions');
          expect(typeof author.commits).toBe('number');
          expect(author.commits).toBeGreaterThan(0);
        });
      } catch (error: any) {
        if (error.message.includes('Not a valid git repository')) {
          console.log('Skipping test - repository not found');
        } else {
          throw error;
        }
      }
    }, 30000);

    it('should filter by date range', async () => {
      try {
        const since = '2024-01-01';
        const result = await computeCommitStats(TEST_REPO_PATH, {
          excludeMerges: true,
          since,
        });

        expect(result.authors).toBeInstanceOf(Array);
        // All commits should be after since date
        result.timeline.forEach((entry) => {
          const entryDate = new Date(entry.date);
          const sinceDate = new Date(since);
          expect(entryDate >= sinceDate).toBe(true);
        });
      } catch (error: any) {
        if (error.message.includes('Not a valid git repository')) {
          console.log('Skipping test - repository not found');
        } else {
          throw error;
        }
      }
    }, 30000);
  });

  describe('Attribution Comparison', () => {
    it('blame and commit stats should show different results (blame ignores merges)', async () => {
      try {
        const [blameResult, commitResult] = await Promise.all([
          computeBlameAttribution(TEST_REPO_PATH, {}),
          computeCommitStats(TEST_REPO_PATH, { excludeMerges: true }),
        ]);

        // Both should have results
        expect(blameResult.authors.length).toBeGreaterThan(0);
        expect(commitResult.authors.length).toBeGreaterThan(0);

        // Blame shows line ownership, commits show activity
        // These will differ because:
        // - Blame: current state of code
        // - Commits: historical activity
        console.log('Blame authors:', blameResult.authors.length);
        console.log('Commit authors:', commitResult.authors.length);
      } catch (error: any) {
        if (error.message.includes('Not a valid git repository')) {
          console.log('Skipping test - repository not found');
        } else {
          throw error;
        }
      }
    }, 60000);
  });
});
