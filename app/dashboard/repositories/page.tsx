/**
 * Repositories Page
 *
 * Main dashboard page that displays the list of user's GitHub repositories.
 * Allows searching, filtering, and selecting a repository to analyze.
 */

import { Suspense } from "react";
import { RepoList } from "@/components/RepoList";
import { Spinner } from "@/components/ui/Spinner";

export default function RepositoriesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 relative overflow-hidden">
      {/* Static Background Orbs - No Animation for Performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Your Repositories
          </h1>
          <p className="text-lg text-gray-600">
            Select a repository to analyze contributions and activity
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-12">
              <Spinner size="lg" />
              <p className="mt-4 text-gray-600">Loading repositories...</p>
            </div>
          }
        >
          <RepoList />
        </Suspense>
      </div>
    </div>
  );
}
