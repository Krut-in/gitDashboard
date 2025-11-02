/**
 * Commit Message Analysis Utilities
 * 
 * Analyzes commit messages to extract insights about:
 * - Message length patterns (short, medium, long, verbose)
 * - Conventional commit type usage (feat, fix, docs, etc.)
 * - Contributor writing styles (verbose vs minimalist)
 * - Message quality patterns (single-char, generic messages)
 * 
 * @module commit-message-analysis
 */

import type { CommitData } from './github-api-commits';

/**
 * Length categories for commit messages
 */
export type MessageLengthCategory = 'short' | 'medium' | 'long' | 'verbose';

/**
 * Conventional commit types
 */
export const CONVENTIONAL_COMMIT_TYPES = [
  'feat',
  'fix',
  'docs',
  'style',
  'refactor',
  'test',
  'chore',
  'perf',
  'ci',
  'build',
  'revert',
] as const;

export type ConventionalCommitType = typeof CONVENTIONAL_COMMIT_TYPES[number] | 'other';

/**
 * Generic message patterns to detect
 */
const GENERIC_MESSAGES = [
  'update',
  'updated',
  'fix',
  'fixed',
  'wip',
  'changes',
  'modify',
  'modified',
  'change',
  'test',
  'testing',
  'cleanup',
  'refactor',
  'temp',
];

/**
 * Length distribution by category
 */
export interface LengthDistribution {
  short: number;      // < 50 chars
  medium: number;     // 50-100 chars
  long: number;       // 100-200 chars
  verbose: number;    // > 200 chars
}

/**
 * Type distribution for conventional commits
 */
export interface TypeDistribution {
  [key: string]: number;
}

/**
 * User writing style with examples
 */
export interface UserWritingStyle {
  userName: string;
  avgLength: number;
  category: 'verbose' | 'minimalist' | 'balanced';
  commitCount: number;
  exampleMessages: string[];
}

/**
 * Interesting pattern found in commit messages
 */
export interface CommitPattern {
  type: 'single-char' | 'generic' | 'no-message' | 'very-long';
  count: number;
  examples: { author: string; message: string }[];
}

/**
 * Complete commit message analysis results
 */
export interface CommitMessageAnalysis {
  lengthDistribution: LengthDistribution;
  typeDistribution: TypeDistribution;
  userCategories: {
    verbose: UserWritingStyle[];
    minimalist: UserWritingStyle[];
    balanced: UserWritingStyle[];
  };
  statistics: {
    totalMessages: number;
    avgLength: number;
    medianLength: number;
    mostCommonType: string;
    conventionalCommitPercentage: number;
  };
  patterns: CommitPattern[];
}

/**
 * Categorize message length
 */
export function categorizeMessageLength(message: string): MessageLengthCategory {
  // Use first line for length categorization
  const firstLine = message.split('\n')[0].trim();
  const length = firstLine.length;
  
  if (length < 50) return 'short';
  if (length < 100) return 'medium';
  if (length < 200) return 'long';
  return 'verbose';
}

/**
 * Parse conventional commit type from message
 */
export function parseConventionalCommitType(message: string): ConventionalCommitType {
  const firstLine = message.split('\n')[0].trim();
  const match = firstLine.match(/^(feat|fix|docs|style|refactor|test|chore|perf|ci|build|revert)(\(.+\))?:/i);
  
  if (match) {
    return match[1].toLowerCase() as ConventionalCommitType;
  }
  
  return 'other';
}

/**
 * Check if message is generic/non-descriptive
 */
export function isGenericMessage(message: string): boolean {
  const firstLine = message.split('\n')[0].trim().toLowerCase();
  return GENERIC_MESSAGES.includes(firstLine);
}

/**
 * Check if message is single character
 */
export function isSingleCharMessage(message: string): boolean {
  const firstLine = message.split('\n')[0].trim();
  return firstLine.length === 1;
}

/**
 * Categorize user writing style
 */
export function categorizeUserStyle(avgLength: number): 'verbose' | 'minimalist' | 'balanced' {
  if (avgLength < 30) return 'minimalist';
  if (avgLength > 80) return 'verbose';
  return 'balanced';
}

/**
 * Analyze all commit messages and return comprehensive insights
 */
export function analyzeCommitMessages(commits: CommitData[]): CommitMessageAnalysis {
  if (commits.length === 0) {
    return {
      lengthDistribution: { short: 0, medium: 0, long: 0, verbose: 0 },
      typeDistribution: {},
      userCategories: { verbose: [], minimalist: [], balanced: [] },
      statistics: {
        totalMessages: 0,
        avgLength: 0,
        medianLength: 0,
        mostCommonType: 'other',
        conventionalCommitPercentage: 0,
      },
      patterns: [],
    };
  }

  // Initialize tracking structures
  const lengthDistribution: LengthDistribution = {
    short: 0,
    medium: 0,
    long: 0,
    verbose: 0,
  };
  
  const typeDistribution: TypeDistribution = {};
  
  const userMessages = new Map<string, { messages: string[]; totalLength: number }>();
  
  const patterns: {
    singleChar: { author: string; message: string }[];
    generic: { author: string; message: string }[];
    noMessage: { author: string; message: string }[];
    veryLong: { author: string; message: string }[];
  } = {
    singleChar: [],
    generic: [],
    noMessage: [],
    veryLong: [],
  };

  const allLengths: number[] = [];
  let conventionalCommitCount = 0;

  // Process each commit
  for (const commit of commits) {
    const message = commit.message || '';
    const firstLine = message.split('\n')[0].trim();
    const author = commit.authorName;

    // Length distribution
    const lengthCategory = categorizeMessageLength(message);
    lengthDistribution[lengthCategory]++;
    allLengths.push(firstLine.length);

    // Type distribution
    const type = parseConventionalCommitType(message);
    typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    
    if (type !== 'other') {
      conventionalCommitCount++;
    }

    // Track user messages
    if (!userMessages.has(author)) {
      userMessages.set(author, { messages: [], totalLength: 0 });
    }
    const userData = userMessages.get(author)!;
    userData.messages.push(firstLine);
    userData.totalLength += firstLine.length;

    // Pattern detection
    if (isSingleCharMessage(message)) {
      patterns.singleChar.push({ author, message: firstLine });
    } else if (isGenericMessage(message)) {
      patterns.generic.push({ author, message: firstLine });
    } else if (firstLine.length === 0) {
      patterns.noMessage.push({ author, message: '(empty)' });
    } else if (firstLine.length > 200) {
      patterns.veryLong.push({ author, message: firstLine.substring(0, 100) + '...' });
    }
  }

  // Calculate statistics
  const totalMessages = commits.length;
  const totalLength = allLengths.reduce((sum, len) => sum + len, 0);
  const avgLength = totalMessages > 0 ? Math.round(totalLength / totalMessages) : 0;
  
  // Calculate median
  const sortedLengths = [...allLengths].sort((a, b) => a - b);
  const medianLength = sortedLengths.length > 0
    ? sortedLengths[Math.floor(sortedLengths.length / 2)]
    : 0;

  // Find most common type
  let mostCommonType = 'other';
  let maxCount = 0;
  for (const [type, count] of Object.entries(typeDistribution)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonType = type;
    }
  }

  const conventionalCommitPercentage = totalMessages > 0
    ? Math.round((conventionalCommitCount / totalMessages) * 100)
    : 0;

  // Categorize users by writing style
  const userCategories: {
    verbose: UserWritingStyle[];
    minimalist: UserWritingStyle[];
    balanced: UserWritingStyle[];
  } = {
    verbose: [],
    minimalist: [],
    balanced: [],
  };

  Array.from(userMessages.entries()).forEach(([userName, data]) => {
    const avgLength = data.messages.length > 0
      ? Math.round(data.totalLength / data.messages.length)
      : 0;
    
    const category = categorizeUserStyle(avgLength);
    
    // Get up to 3 example messages
    const exampleMessages = data.messages
      .slice(0, 3)
      .map(msg => msg.length > 100 ? msg.substring(0, 100) + '...' : msg);

    const userStyle: UserWritingStyle = {
      userName,
      avgLength,
      category,
      commitCount: data.messages.length,
      exampleMessages,
    };

    userCategories[category].push(userStyle);
  });

  // Sort user categories by commit count (descending)
  userCategories.verbose.sort((a, b) => b.commitCount - a.commitCount);
  userCategories.minimalist.sort((a, b) => b.commitCount - a.commitCount);
  userCategories.balanced.sort((a, b) => b.commitCount - a.commitCount);

  // Build pattern results
  const patternResults: CommitPattern[] = [];

  if (patterns.singleChar.length > 0) {
    patternResults.push({
      type: 'single-char',
      count: patterns.singleChar.length,
      examples: patterns.singleChar.slice(0, 5),
    });
  }

  if (patterns.generic.length > 0) {
    patternResults.push({
      type: 'generic',
      count: patterns.generic.length,
      examples: patterns.generic.slice(0, 5),
    });
  }

  if (patterns.noMessage.length > 0) {
    patternResults.push({
      type: 'no-message',
      count: patterns.noMessage.length,
      examples: patterns.noMessage.slice(0, 5),
    });
  }

  if (patterns.veryLong.length > 0) {
    patternResults.push({
      type: 'very-long',
      count: patterns.veryLong.length,
      examples: patterns.veryLong.slice(0, 5),
    });
  }

  return {
    lengthDistribution,
    typeDistribution,
    userCategories,
    statistics: {
      totalMessages,
      avgLength,
      medianLength,
      mostCommonType,
      conventionalCommitPercentage,
    },
    patterns: patternResults,
  };
}

