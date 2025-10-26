/**
 * Global Loading Component
 *
 * Displays a loading spinner while pages are loading.
 * Provides visual feedback during navigation and data fetching.
 */

import { Spinner } from "@/components/ui/Spinner";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <Spinner size="lg" />
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
