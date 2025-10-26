/**
 * Repositories Page
 * 
 * Main dashboard page that displays the list of user's GitHub repositories.
 * Allows searching, filtering, and selecting a repository to analyze.
 */

import { Suspense } from 'react';
import { RepoList } from '@/components/RepoList';
import { Spinner } from '@/components/ui/Spinner';

export default function RepositoriesPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Your Repositories
        </h1>
        <p className="text-gray-600">
          Select a repository to analyze contributions and activity
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        }
      >
        <RepoList />
      </Suspense>
    </div>
  );
}
