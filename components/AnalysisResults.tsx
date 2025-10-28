/**
 * Analysis Results Display Component
 *
 * Renders analysis results based on the selected mode.
 * Displays line ownership, commit activity, or GitHub metadata.
 */

"use client";

import { Card } from "./ui/Card";
import type { AnalysisMode } from "@/lib/analysis-modes";

type BlameResult = {
  mode: "blame";
  authors: Array<{ name: string; email?: string; lines: number }>;
  totalLines: number;
  filesProcessed: number;
};

type CommitsResult = {
  mode: "commits";
  authors: Array<{
    name: string;
    email: string;
    commits: number;
    additions: number;
    deletions: number;
  }>;
  timeline: Array<{ date: string; author: string; commits: number }>;
};

type GitHubResult = {
  mode: "github-api";
  pullRequests: number;
  issues: number;
  contributors: Array<{ login: string; contributions: number }>;
};

type HybridResult = {
  mode: "hybrid";
  lineOwnership: Array<{ name: string; email?: string; lines: number }>;
  totalLines: number;
  filesProcessed: number;
  commitActivity: Array<{
    name: string;
    email: string;
    commits: number;
    additions: number;
    deletions: number;
  }>;
  timeline: Array<{ date: string; author: string; commits: number }>;
  pullRequests: number;
};

type AnalysisResult = BlameResult | CommitsResult | GitHubResult | HybridResult;

type Props = {
  result: AnalysisResult;
};

export function AnalysisResults({ result }: Props) {
  if (result.mode === "blame") {
    return <BlameResults result={result} />;
  }

  if (result.mode === "commits") {
    return <CommitsResults result={result} />;
  }

  if (result.mode === "github-api") {
    return <GitHubResults result={result} />;
  }

  if (result.mode === "hybrid") {
    return <HybridResults result={result} />;
  }

  return null;
}

function BlameResults({ result }: { result: BlameResult }) {
  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-xl font-semibold mb-4">
          Line Ownership (git blame)
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Total Lines</p>
            <p className="text-2xl font-bold">
              {result.totalLines.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Files Processed</p>
            <p className="text-2xl font-bold">
              {result.filesProcessed.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Rank
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Author
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Email
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Lines
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {result.authors.map((author, idx) => {
                const percentage = (
                  (author.lines / result.totalLines) *
                  100
                ).toFixed(1);
                return (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-4 py-2 text-sm">{idx + 1}</td>
                    <td className="px-4 py-2 text-sm font-medium">
                      {author.name}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {author.email || "N/A"}
                    </td>
                    <td className="px-4 py-2 text-sm text-right">
                      {author.lines.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-sm text-right">
                      {percentage}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function CommitsResults({ result }: { result: CommitsResult }) {
  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-xl font-semibold mb-4">
          Commit Activity (git log --no-merges)
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Rank
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Author
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Email
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Commits
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Additions
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Deletions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {result.authors.map((author, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-4 py-2 text-sm">{idx + 1}</td>
                  <td className="px-4 py-2 text-sm font-medium">
                    {author.name}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {author.email}
                  </td>
                  <td className="px-4 py-2 text-sm text-right">
                    {author.commits}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-green-600">
                    +{author.additions.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-right text-red-600">
                    -{author.deletions.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function GitHubResults({ result }: { result: GitHubResult }) {
  return (
    <div className="space-y-4">
      <Card>
        <h2 className="text-xl font-semibold mb-4">GitHub Metadata</h2>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Pull Requests</p>
            <p className="text-2xl font-bold">{result.pullRequests}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Issues</p>
            <p className="text-2xl font-bold">{result.issues}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Contributors</p>
            <p className="text-2xl font-bold">{result.contributors.length}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Rank
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Username
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                  Contributions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {result.contributors.map((contributor, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-4 py-2 text-sm">{idx + 1}</td>
                  <td className="px-4 py-2 text-sm font-medium">
                    {contributor.login}
                  </td>
                  <td className="px-4 py-2 text-sm text-right">
                    {contributor.contributions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function HybridResults({ result }: { result: HybridResult }) {
  return (
    <div className="space-y-6">
      {/* Line Ownership Section */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">
          📊 Line Ownership (Accurate Attribution)
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Total Lines</p>
            <p className="text-2xl font-bold">
              {result.totalLines.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Files Processed</p>
            <p className="text-2xl font-bold">
              {result.filesProcessed.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase">
                  Author
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium uppercase">
                  Lines
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium uppercase">
                  %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {result.lineOwnership.slice(0, 10).map((author, idx) => {
                const percentage = (
                  (author.lines / result.totalLines) *
                  100
                ).toFixed(1);
                return (
                  <tr key={idx}>
                    <td className="px-3 py-2 font-medium">{author.name}</td>
                    <td className="px-3 py-2 text-right">
                      {author.lines.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 text-right">{percentage}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Commit Activity Section */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">⚡ Commit Activity</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase">
                  Author
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium uppercase">
                  Commits
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium uppercase">
                  +
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium uppercase">
                  -
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {result.commitActivity.slice(0, 10).map((author, idx) => (
                <tr key={idx}>
                  <td className="px-3 py-2 font-medium">{author.name}</td>
                  <td className="px-3 py-2 text-right">{author.commits}</td>
                  <td className="px-3 py-2 text-right text-green-600">
                    +{author.additions.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right text-red-600">
                    -{author.deletions.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* GitHub Metadata */}
      <Card>
        <h2 className="text-xl font-semibold mb-4">🔗 GitHub Metadata</h2>
        <div className="flex gap-8">
          <div>
            <p className="text-sm text-gray-500">Pull Requests</p>
            <p className="text-2xl font-bold">{result.pullRequests}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
