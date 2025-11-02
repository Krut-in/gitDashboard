/**
 * Navigation Bar Component
 *
 * Displays at the top of all pages with consistent Sunset Code branding.
 * - Public mode: Shows "Sign in with GitHub" button
 * - Authenticated mode: Shows user avatar, username, and sign-out button
 * Logo links to repositories page when authenticated, or stays on home when public.
 */

import Link from "next/link";
import Image from "next/image";
import { signIn, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { GitHubUser } from "@/lib/types";
import { LogOut, Github } from "lucide-react";

interface NavBarProps {
  user?: GitHubUser; // Optional - if not provided, shows public navigation
}

export function NavBar({ user }: NavBarProps) {
  const isAuthenticated = !!user;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-lg bg-white/30 border-b border-white/40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - links to dashboard if authenticated, stays on home if not */}
          <Link
            href={isAuthenticated ? "/dashboard/repositories" : "/"}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-orange-600 to-amber-600 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <Github className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-sky-600 bg-clip-text text-transparent">
              GitDash
            </h1>
          </Link>

          {/* Right side - different content based on authentication */}
          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              <>
                {/* Authenticated: Show user profile and sign out */}
                <Link
                  href={`https://github.com/${user.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 backdrop-blur-md bg-white/50 px-3 py-1.5 rounded-full border border-white/60 hover:bg-white/70 hover:border-white/80 transition-all shadow-lg hover:shadow-xl"
                >
                  {user.avatarUrl && (
                    <Image
                      src={user.avatarUrl}
                      alt={user.username}
                      width={32}
                      height={32}
                      className="rounded-full ring-2 ring-teal-400/50"
                    />
                  )}
                  <div className="hidden sm:block text-sm">
                    <p className="font-medium text-gray-900">
                      @{user.username}
                    </p>
                  </div>
                </Link>

                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/" });
                  }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    type="submit"
                    className="gap-2 backdrop-blur-md bg-white/50 hover:bg-red-50/70 hover:border-red-300/70 border-white/60 transition-all shadow-lg hover:shadow-xl"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Sign out</span>
                  </Button>
                </form>
              </>
            ) : (
              <>
                {/* Public: Show sign in button */}
                <form
                  action={async () => {
                    "use server";
                    await signIn("github", { redirectTo: "/dashboard" });
                  }}
                >
                  <Button
                    type="submit"
                    size="sm"
                    className="backdrop-blur-md bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white flex items-center gap-2 shadow-xl border border-white/30 hover:shadow-2xl transition-all"
                  >
                    <Github className="w-4 h-4" />
                    Sign in with GitHub
                  </Button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
