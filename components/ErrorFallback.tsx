/**
 * Error Fallback Component
 *
 * User-friendly error display component for use with ErrorBoundary.
 * Shows when the ErrorBoundary catches an error in the component tree.
 * Includes a reload button for retry functionality.
 */

"use client";

export function ErrorFallback() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <h2 className="text-xl font-semibold text-red-800 mb-2">
        Failed to Load Repositories
      </h2>
      <p className="text-red-600 mb-4">
        We encountered an error while loading your repositories. Please try
        again.
      </p>
      <button
        onClick={handleReload}
        className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        aria-label="Reload page"
      >
        Reload Page
      </button>
    </div>
  );
}
