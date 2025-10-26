/**
 * Navigation Bar Component
 *
 * Displays at the top of authenticated pages.
 * Shows the user's avatar, name, and a sign-out button.
 * Provides consistent navigation across the dashboard.
 */

import Image from "next/image";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { GitHubUser } from "@/lib/types";
import { LogOut } from "lucide-react";

interface NavBarProps {
  user: GitHubUser;
}

export function NavBar({ user }: NavBarProps) {
  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">
              GitHub Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {user.avatarUrl && (
                <Image
                  src={user.avatarUrl}
                  alt={user.name || user.username}
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
              <div className="hidden sm:block text-sm">
                <p className="font-medium text-gray-900">
                  {user.name || user.username}
                </p>
                <p className="text-gray-500">@{user.username}</p>
              </div>
            </div>

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
                className="gap-2"
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
