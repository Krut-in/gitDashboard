/**
 * Shared TypeScript Types
 * 
 * This file contains type definitions used throughout the application.
 * These types ensure type safety and provide autocompletion in the IDE.
 */

/**
 * User information from GitHub OAuth
 */
export interface GitHubUser {
  name: string;
  email: string;
  image: string;
  username: string;
  avatarUrl: string;
}

/**
 * Complete user session including access token
 * Used for authenticated API calls to GitHub
 */
export interface UserSession {
  user: GitHubUser;
  accessToken: string;
}

/**
 * GitHub repository data
 */
export interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  created_at: string;
  updated_at: string;
  private: boolean;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  message: string;
  code?: string;
  status?: number;
}

/**
 * GitHub branch data
 */
export interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

/**
 * Analysis request parameters
 */
export interface AnalysisRequest {
  owner: string;
  repo: string;
  branch: string;
}

/**
 * Analysis metadata
 */
export interface AnalysisMetadata {
  totalCommits: number;
  analyzedCommits: number;
  totalContributors: number;
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

/**
 * Complete analysis response with CSV/text exports
 */
export interface AnalysisResponse {
  contributors: any[];
  commitMessages: any[];
  commitTimes: any[];
  filesByAuthor: any[];
  merges: any[];
  warnings: string[];
  metadata: AnalysisMetadata;
  exports: {
    contributorsCSV: string;
    commitMessagesText: string;
    commitTimesText: string;
    filesByAuthorText: string;
    mergesText: string;
  };
}
