/**
 * Analysis Mode Selector Component
 *
 * Allows users to switch between different analysis modes:
 * - Blame: True line-level code ownership
 * - Commits: Commit activity analysis
 * - GitHub API: Pull requests and issues metadata
 * - Hybrid: Combined analysis (all modes)
 */

"use client";

import { useState } from "react";
import { Button } from "./ui/Button";
import type { AnalysisMode } from "@/lib/analysis-modes";

export type AnalysisModeConfig = {
  mode: AnalysisMode;
  repoPath?: string;
  owner?: string;
  repo?: string;
  branch?: string;
};

type Props = {
  onModeChange: (config: AnalysisModeConfig) => void;
  defaultOwner?: string;
  defaultRepo?: string;
  defaultBranch?: string;
  loading?: boolean;
};

export function AnalysisModeSelector({
  onModeChange,
  defaultOwner = "",
  defaultRepo = "",
  defaultBranch = "",
  loading = false,
}: Props) {
  const [mode, setMode] = useState<AnalysisMode>("blame");
  const [repoPath, setRepoPath] = useState("");
  const [owner, setOwner] = useState(defaultOwner);
  const [repo, setRepo] = useState(defaultRepo);
  const [branch, setBranch] = useState(defaultBranch);

  const handleAnalyze = () => {
    onModeChange({
      mode,
      repoPath: repoPath || undefined,
      owner: owner || undefined,
      repo: repo || undefined,
      branch: branch || undefined,
    });
  };

  const requiresRepoPath =
    mode === "blame" || mode === "commits" || mode === "hybrid";
  const requiresGitHubInfo = mode === "github-api" || mode === "hybrid";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Analysis Configuration</h2>

        {/* Mode Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Analysis Mode
          </label>
          <select
            value={mode}
            onChange={e => setMode(e.target.value as AnalysisMode)}
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="blame">
              Blame - True Line Ownership (Recommended)
            </option>
            <option value="commits">
              Commits - Activity Analysis (No Merges)
            </option>
            <option value="github-api">GitHub API - Metadata Only</option>
            <option value="hybrid">Hybrid - All Combined</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {mode === "blame" &&
              "✅ Accurate line-level attribution, ignores merges"}
            {mode === "commits" && "Commit frequency and activity over time"}
            {mode === "github-api" && "Pull requests, issues, and contributors"}
            {mode === "hybrid" && "Complete analysis with all data sources"}
          </p>
        </div>

        {/* Repository Path (for local git operations) */}
        {requiresRepoPath && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Local Repository Path <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={repoPath}
              onChange={e => setRepoPath(e.target.value)}
              placeholder="/path/to/your/repository"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Absolute path to the git repository on your local machine
            </p>
          </div>
        )}

        {/* GitHub Information (for API mode) */}
        {requiresGitHubInfo && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Repository Owner <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={owner}
                onChange={e => setOwner(e.target.value)}
                placeholder="octocat"
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Repository Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={repo}
                onChange={e => setRepo(e.target.value)}
                placeholder="hello-world"
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>
        )}

        {/* Branch (optional for commits mode) */}
        {mode === "commits" && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Branch (Optional)
            </label>
            <input
              type="text"
              value={branch}
              onChange={e => setBranch(e.target.value)}
              placeholder="main"
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to analyze all branches
            </p>
          </div>
        )}

        {/* Analyze Button */}
        <Button
          onClick={handleAnalyze}
          disabled={
            loading ||
            (requiresRepoPath && !repoPath) ||
            (requiresGitHubInfo && (!owner || !repo))
          }
          className="w-full"
        >
          {loading ? "Analyzing..." : "Start Analysis"}
        </Button>
      </div>

      {/* Mode Information */}
      <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-md p-4">
        <h3 className="font-semibold text-sm mb-2">
          About {mode.charAt(0).toUpperCase() + mode.slice(1)} Mode
        </h3>
        <ul className="text-xs space-y-1 text-gray-700 dark:text-gray-300">
          {mode === "blame" && (
            <>
              <li>✓ True line-level code ownership</li>
              <li>✓ Ignores merge commits automatically</li>
              <li>✓ Detects code moves and renames</li>
              <li>✓ Most accurate attribution method</li>
            </>
          )}
          {mode === "commits" && (
            <>
              <li>✓ Excludes merge commits (--no-merges)</li>
              <li>✓ Shows commit frequency per author</li>
              <li>✓ Tracks additions/deletions per commit</li>
              <li>✓ Good for activity timelines</li>
            </>
          )}
          {mode === "github-api" && (
            <>
              <li>✓ Pull requests count and status</li>
              <li>✓ Issues tracking</li>
              <li>✓ GitHub contributors list</li>
              <li>✓ Fast, no local repo needed</li>
            </>
          )}
          {mode === "hybrid" && (
            <>
              <li>✓ Complete analysis with all methods</li>
              <li>✓ Line ownership + commit activity</li>
              <li>✓ GitHub metadata included</li>
              <li>✓ Most comprehensive view</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
