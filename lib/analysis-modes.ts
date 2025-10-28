/**
 * Analysis Mode Configuration Types
 * 
 * Defines the analysis modes and configuration options for git repository analysis.
 * Supports multiple analysis approaches for different use cases.
 */

export type AnalysisMode = "blame" | "commits" | "github-api" | "hybrid";

export type BlameOptions = {
  ignoreWhitespace?: boolean;
  detectMoves?: boolean;
  detectCopies?: boolean;
  useMailmap?: boolean;
  respectIgnoreRevs?: boolean;
  maxConcurrency?: number;
};

export type CommitOptions = {
  excludeMerges?: boolean;
  since?: string;
  until?: string;
  branch?: string;
};

export type GitHubOptions = {
  owner: string;
  repo: string;
  token?: string;
};

export type AnalysisConfig = {
  mode: AnalysisMode;
  repoPath?: string;
  blameOptions?: BlameOptions;
  commitOptions?: CommitOptions;
  githubOptions?: GitHubOptions;
};
