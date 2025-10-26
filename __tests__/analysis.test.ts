/**
 * Analysis Engine Tests
 * 
 * Unit tests for contribution analysis functions including:
 * - Contributor deduplication and merging
 * - Statistics aggregation
 * - Supplementary report generation
 * - CSV serialization
 */

import { describe, it, expect } from '@jest/globals';
import {
  deduplicateContributors,
  aggregateStats,
  buildSupplementaryReports,
  analyzeCommits,
  serializeContributorsCSV,
  serializeCommitMessages,
  GitHubCommit,
} from '../lib/analysis';

describe('Analysis Engine', () => {
  const mockCommit = (overrides: Partial<GitHubCommit> = {}): GitHubCommit => ({
    sha: 'abc123',
    commit: {
      author: {
        name: 'Test User',
        email: 'test@example.com',
        date: '2024-01-15T10:00:00Z',
      },
      message: 'Test commit',
    },
    author: {
      login: 'testuser',
      id: 12345,
      avatar_url: 'https://example.com/avatar.jpg',
    },
    stats: {
      additions: 10,
      deletions: 5,
      total: 15,
    },
    files: [],
    parents: [{ sha: 'parent123' }],
    ...overrides,
  });

  describe('deduplicateContributors', () => {
    it('should deduplicate contributors by GitHub ID', () => {
      const commits = [
        mockCommit({ sha: 'commit1' }),
        mockCommit({ sha: 'commit2' }),
      ];
      
      const result = deduplicateContributors(commits);
      expect(result.size).toBe(1);
      expect(result.get('github:12345')?.commitCount).toBe(2);
    });

    it('should deduplicate contributors by email when no GitHub ID', () => {
      const commits = [
        mockCommit({
          sha: 'commit1',
          author: null,
        }),
        mockCommit({
          sha: 'commit2',
          author: null,
        }),
      ];
      
      const result = deduplicateContributors(commits);
      expect(result.size).toBe(1);
      expect(result.get('email:test@example.com')?.commitCount).toBe(2);
    });

    it('should handle commits with different contributors', () => {
      const commits = [
        mockCommit({ sha: 'commit1' }),
        mockCommit({
          sha: 'commit2',
          author: { login: 'other', id: 99999, avatar_url: '' },
          commit: {
            author: {
              name: 'Other User',
              email: 'other@example.com',
              date: '2024-01-16T10:00:00Z',
            },
            message: 'Other commit',
          },
        }),
      ];
      
      const result = deduplicateContributors(commits);
      expect(result.size).toBe(2);
    });

    it('should aggregate additions and deletions', () => {
      const commits = [
        mockCommit({ 
          sha: 'commit1',
          stats: { additions: 10, deletions: 5, total: 15 },
        }),
        mockCommit({ 
          sha: 'commit2',
          stats: { additions: 20, deletions: 10, total: 30 },
        }),
      ];
      
      const result = deduplicateContributors(commits);
      const contributor = result.get('github:12345')!;
      expect(contributor.additions).toBe(30);
      expect(contributor.deletions).toBe(15);
    });

    it('should track merge commits', () => {
      const commits = [
        mockCommit({
          sha: 'commit1',
          parents: [{ sha: 'p1' }, { sha: 'p2' }], // Merge commit
        }),
        mockCommit({
          sha: 'commit2',
          parents: [{ sha: 'p1' }], // Regular commit
        }),
      ];
      
      const result = deduplicateContributors(commits);
      const contributor = result.get('github:12345')!;
      expect(contributor.mergeCommitCount).toBe(1);
    });
  });

  describe('aggregateStats', () => {
    it('should calculate correct statistics', () => {
      const contributorMap = deduplicateContributors([
        mockCommit({
          sha: 'commit1',
          commit: {
            author: {
              name: 'Test User',
              email: 'test@example.com',
              date: '2024-01-01T10:00:00Z',
            },
            message: 'First commit',
          },
          stats: { additions: 100, deletions: 20, total: 120 },
        }),
        mockCommit({
          sha: 'commit2',
          commit: {
            author: {
              name: 'Test User',
              email: 'test@example.com',
              date: '2024-01-10T10:00:00Z',
            },
            message: 'Second commit',
          },
          stats: { additions: 50, deletions: 10, total: 60 },
        }),
      ]);

      const stats = aggregateStats(contributorMap);
      
      expect(stats).toHaveLength(1);
      expect(stats[0].commitCount).toBe(2);
      expect(stats[0].additions).toBe(150);
      expect(stats[0].deletions).toBe(30);
      expect(stats[0].netLines).toBe(120);
      expect(stats[0].activeDays).toBe(9);
    });

    it('should sort by commit count descending', () => {
      const commits = [
        mockCommit({
          sha: 'c1',
          author: { login: 'user1', id: 1, avatar_url: '' },
        }),
        mockCommit({
          sha: 'c2',
          author: { login: 'user2', id: 2, avatar_url: '' },
        }),
        mockCommit({
          sha: 'c3',
          author: { login: 'user2', id: 2, avatar_url: '' },
        }),
      ];

      const contributorMap = deduplicateContributors(commits);
      const stats = aggregateStats(contributorMap);

      expect(stats[0].githubId).toBe(2); // user2 with 2 commits
      expect(stats[0].commitCount).toBe(2);
      expect(stats[1].githubId).toBe(1); // user1 with 1 commit
      expect(stats[1].commitCount).toBe(1);
    });
  });

  describe('buildSupplementaryReports', () => {
    it('should build commit messages report', () => {
      const commits = [
        mockCommit({ sha: 'abc123', commit: { ...mockCommit().commit, message: 'Fix bug' } }),
        mockCommit({ sha: 'def456', commit: { ...mockCommit().commit, message: 'Add feature' } }),
      ];

      const { commitMessages } = buildSupplementaryReports(commits);
      
      expect(commitMessages).toHaveLength(2);
      expect(commitMessages[0].message).toBe('Fix bug');
      expect(commitMessages[1].message).toBe('Add feature');
    });

    it('should build commit times report', () => {
      const commits = [
        mockCommit({
          sha: 'abc123',
          commit: {
            author: {
              name: 'Test',
              email: 'test@example.com',
              date: '2024-01-15T10:00:00Z',
            },
            message: 'Test',
          },
        }),
      ];

      const { commitTimes } = buildSupplementaryReports(commits);
      
      expect(commitTimes).toHaveLength(1);
      expect(commitTimes[0].timestamp).toBe(new Date('2024-01-15T10:00:00Z').getTime());
    });

    it('should build files by author report', () => {
      const commits = [
        mockCommit({
          files: [
            { filename: 'test.ts', additions: 10, deletions: 5, changes: 15 },
            { filename: 'README.md', additions: 2, deletions: 1, changes: 3 },
          ],
        }),
      ];

      const { filesByAuthor } = buildSupplementaryReports(commits);
      
      expect(filesByAuthor).toHaveLength(2);
      expect(filesByAuthor[0].filename).toBe('test.ts');
      expect(filesByAuthor[1].filename).toBe('README.md');
    });

    it('should skip very large file changes', () => {
      const commits = [
        mockCommit({
          files: [
            { filename: 'large.bin', additions: 50000, deletions: 0, changes: 50000 },
            { filename: 'normal.ts', additions: 10, deletions: 5, changes: 15 },
          ],
        }),
      ];

      const { filesByAuthor } = buildSupplementaryReports(commits);
      
      expect(filesByAuthor).toHaveLength(1);
      expect(filesByAuthor[0].filename).toBe('normal.ts');
    });

    it('should build merges report', () => {
      const commits = [
        mockCommit({
          sha: 'merge123',
          parents: [{ sha: 'p1' }, { sha: 'p2' }],
          commit: {
            author: {
              name: 'Test',
              email: 'test@example.com',
              date: '2024-01-15T10:00:00Z',
            },
            message: 'Merge branch feature',
          },
        }),
      ];

      const { merges } = buildSupplementaryReports(commits);
      
      expect(merges).toHaveLength(1);
      expect(merges[0].parentCount).toBe(2);
      expect(merges[0].message).toContain('Merge');
    });
  });

  describe('analyzeCommits', () => {
    it('should return complete analysis', () => {
      const commits = [
        mockCommit({ sha: 'c1' }),
        mockCommit({ sha: 'c2' }),
      ];

      const result = analyzeCommits(commits);

      expect(result.contributors).toHaveLength(1);
      expect(result.commitMessages).toHaveLength(2);
      expect(result.metadata.totalCommits).toBe(2);
      expect(result.metadata.analyzedCommits).toBe(2);
    });

    it('should handle empty commit list', () => {
      const result = analyzeCommits([]);

      expect(result.contributors).toHaveLength(0);
      expect(result.warnings).toContain('No valid commits to analyze');
      expect(result.metadata.totalCommits).toBe(0);
    });

    it('should filter out bot commits when requested', () => {
      const commits = [
        mockCommit({
          sha: 'c1',
          commit: {
            author: {
              name: 'github-actions[bot]',
              email: 'bot@github.com',
              date: '2024-01-15T10:00:00Z',
            },
            message: 'Automated commit',
          },
        }),
        mockCommit({ sha: 'c2' }),
      ];

      const result = analyzeCommits(commits, { includeBots: false });

      expect(result.contributors).toHaveLength(1);
      expect(result.metadata.analyzedCommits).toBe(1);
    });
  });

  describe('serializeContributorsCSV', () => {
    it('should generate valid CSV', () => {
      const stats = aggregateStats(deduplicateContributors([
        mockCommit({ sha: 'c1' }),
      ]));

      const csv = serializeContributorsCSV(stats);

      expect(csv).toContain('Name,Email,GitHub ID');
      expect(csv).toContain('testuser');
      expect(csv).toContain('test@example.com');
    });

    it('should escape commas in values', () => {
      const commits = [
        mockCommit({
          commit: {
            author: {
              name: 'User, Test',
              email: 'test@example.com',
              date: '2024-01-15T10:00:00Z',
            },
            message: 'Test',
          },
        }),
      ];

      const stats = aggregateStats(deduplicateContributors(commits));
      const csv = serializeContributorsCSV(stats);

      expect(csv).toContain('"User, Test"');
    });
  });

  describe('serializeCommitMessages', () => {
    it('should generate text format', () => {
      const commits = [
        mockCommit({
          sha: 'abc1234',
          commit: {
            author: {
              name: 'Test',
              email: 'test@example.com',
              date: '2024-01-15T10:00:00Z',
            },
            message: 'Fix bug',
          },
        }),
      ];

      const { commitMessages } = buildSupplementaryReports(commits);
      const text = serializeCommitMessages(commitMessages);

      expect(text).toContain('abc1234'.substring(0, 7));
      expect(text).toContain('Fix bug');
    });
  });
});
