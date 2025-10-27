/**
 * Navigation Bar Component
 *
 * Displays at the top of authenticated pages.
 * Shows the user's avatar, username (clickable to GitHub profile), and a sign-out button.
 * Logo links back to repositories page for easy navigation.
 */

import Link from "next/link";
import Image from "next/image";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { GitHubUser } from "@/lib/types";
import { LogOut, Github } from "lucide-react";

interface NavBarProps {
  user: GitHubUser;
}

export function NavBar({ user }: NavBarProps) {
  return (
    <nav className="relative z-10 backdrop-blur-md bg-white/30 border-b border-white/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            href="/dashboard/repositories"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center shadow-lg">
              <Github className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">GitDash</h1>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href={`https://github.com/${user.username}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 backdrop-blur-md bg-white/40 px-3 py-1.5 rounded-full border border-white/30 hover:bg-white/60 transition-all"
            >
              {user.avatarUrl && (
                <Image
                  src={user.avatarUrl}
                  alt={user.username}
                  width={32}
                  height={32}
                  className="rounded-full ring-2 ring-white/50"
                />
              )}
              <div className="hidden sm:block text-sm">
                <p className="font-medium text-gray-900">@{user.username}</p>
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
                className="gap-2 backdrop-blur-md bg-white/40 hover:bg-red-50 hover:border-red-300 border-white/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
