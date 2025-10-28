/**
 * Analysis Dashboard Page
 * 
 * Main page for running repository analysis with multiple modes.
 * Allows users to choose between blame, commits, GitHub API, or hybrid analysis.
 */

'use client';

import { useState } from 'react';
import { AnalysisModeSelector, type AnalysisModeConfig } from '@/components/AnalysisModeSelector';
import { AnalysisResults } from '@/components/AnalysisResults';
import { Spinner } from '@/components/ui/Spinner';
import { Card } from '@/components/ui/Card';

type AnalysisState = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: any }
  | { status: 'error'; error: string };

export default function AnalysisDashboard() {
  const [state, setState] = useState<AnalysisState>({ status: 'idle' });

  const handleModeChange = async (config: AnalysisModeConfig) => {
    setState({ status: 'loading' });

    try {
      const requestBody: any = {
        mode: config.mode,
      };

      if (config.repoPath) {
        requestBody.repoPath = config.repoPath;
      }

      if (config.mode === 'github-api' || config.mode === 'hybrid') {
        requestBody.githubOptions = {
          owner: config.owner,
          repo: config.repo,
        };
      }

      if (config.mode === 'commits' && config.branch) {
        requestBody.commitOptions = {
          branch: config.branch,
        };
      }

      const response = await fetch('/api/github/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const data = await response.json();
      setState({ status: 'success', data });
    } catch (error: any) {
      setState({ status: 'error', error: error.message });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Repository Analysis</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Choose an analysis mode to get accurate insights into your repository
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <AnalysisModeSelector
            onModeChange={handleModeChange}
            loading={state.status === 'loading'}
          />
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          {state.status === 'idle' && (
            <Card className="p-8 text-center">
              <div className="text-gray-400 dark:text-gray-600">
                <svg
                  className="mx-auto h-12 w-12 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <p className="text-lg font-medium">No Analysis Yet</p>
                <p className="text-sm mt-2">
                  Configure and start an analysis to see results here
                </p>
              </div>
            </Card>
          )}

          {state.status === 'loading' && (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center">
                <Spinner size="lg" />
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  Analyzing repository...
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  This may take a few minutes for large repositories
                </p>
              </div>
            </Card>
          )}

          {state.status === 'error' && (
            <Card className="p-6 border-red-200 dark:border-red-800">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-red-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                    Analysis Error
                  </h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                    <p>{state.error}</p>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {state.status === 'success' && (
            <AnalysisResults result={state.data} />
          )}
        </div>
      </div>
    </div>
  );
}
