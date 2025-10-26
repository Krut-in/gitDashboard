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
