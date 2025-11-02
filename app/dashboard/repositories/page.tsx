/**
 * Repositories Page
 *
 * Main dashboard page that displays the list of user's GitHub repositories.
 * Allows searching, filtering, and selecting a repository to analyze.
 * Includes error boundary for graceful error handling and accessibility features.
 */

import { Suspense } from "react";
import { RepoList } from "@/components/RepoList";
import { Spinner } from "@/components/ui/Spinner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorFallback } from "@/components/ErrorFallback";

export const metadata = {
  title: "Your Repositories | GitHub Dashboard",
  description: "View and analyze your GitHub repositories",
};

export default function RepositoriesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-sky-50 to-teal-50 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Decorative background orbs for visual appeal */}
        <div className="absolute top-20 left-10 w-48 h-48 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 will-change-transform"></div>
        <div className="absolute top-40 right-10 w-48 h-48 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 will-change-transform"></div>
        <div className="absolute -bottom-8 left-20 w-48 h-48 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 will-change-transform"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Skip to main content for accessibility */}
        <a
          href="#repository-list"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-sky-600 text-white px-4 py-2 rounded-md z-50"
        >
          Skip to repository list
        </a>

        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Your Repositories
          </h1>
          <p className="text-lg text-gray-600">
            Select a repository to analyze contributions and activity
          </p>
        </header>

        <main id="repository-list" role="main">
          <ErrorBoundary fallback={<ErrorFallback />}>
            <Suspense
              fallback={
                <div
                  className="flex flex-col items-center justify-center py-12"
                  role="status"
                  aria-live="polite"
                  aria-label="Loading repositories"
                >
                  <Spinner size="lg" />
                  <p className="mt-4 text-gray-600">Loading repositories...</p>
                </div>
              }
            >
              <RepoList />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
