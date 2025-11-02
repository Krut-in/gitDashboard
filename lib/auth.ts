/**
 * Authentication Configuration
 * 
 * This file sets up Auth.js (NextAuth) with GitHub OAuth provider.
 * It handles user authentication, session management, and token storage.
 * The access token is encrypted in the JWT session for secure API calls.
 */

import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import type { NextAuthConfig } from 'next-auth';
import { UserSession } from './types';

// Validate required environment variables
if (!process.env.GITHUB_CLIENT_ID) {
  throw new Error('GITHUB_CLIENT_ID environment variable is required');
}

if (!process.env.GITHUB_CLIENT_SECRET) {
  throw new Error('GITHUB_CLIENT_SECRET environment variable is required');
}

if (!process.env.AUTH_SECRET) {
  throw new Error('AUTH_SECRET environment variable is required');
}

export const authConfig: NextAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'repo read:user user:email',
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Store access token and user info in JWT on first sign in
      if (account && profile) {
        token.accessToken = account.access_token;
        token.username = profile.login;
        token.avatarUrl = profile.avatar_url;
      }
      return token;
    },
    async session({ session, token }) {
      // Pass access token and user info to client session
      if (token && session.user) {
        (session as any).accessToken = token.accessToken;
        (session.user as any).username = token.username;
        (session.user as any).avatarUrl = token.avatarUrl;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: 'jwt',
  },
  // Trust host for development and production deployments
  trustHost: true,
  // Explicitly set the base path for OAuth callbacks
  basePath: '/api/auth',
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

/**
 * Get the current user session (server-side only)
 * Returns null if not authenticated
 */
export async function getSession(): Promise<UserSession | null> {
  const session = await auth();
  if (!session) return null;

  return {
    user: {
      name: session.user?.name || '',
      email: session.user?.email || '',
      image: session.user?.image || '',
      username: (session.user as any).username || '',
      avatarUrl: (session.user as any).avatarUrl || '',
    },
    accessToken: (session as any).accessToken || '',
  };
}

/**
 * Require authentication - redirect to sign-in if not authenticated
 * Use this in server components that require authentication
 */
export async function requireAuth(): Promise<UserSession> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}
