/**
 * Branch Analysis Page
 *
 * Runs and displays contribution analysis for a selected branch.
 * Shows real-time progress via SSE, then displays results with:
 * - Charts (Net Lines Bar, Add/Remove Stacked, Commits Over Time, Activity Heatmap)
 * - Contributors table
 * - Manager summary
 * - Export options (CSV, Markdown)
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Play, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { AnalysisLoader } from "@/components/AnalysisLoader";
import { ProgressPanel } from "@/components/ProgressPanel";
import { NetLinesBar } from "@/components/charts/NetLinesBar";
import { AddRemoveStacked } from "@/components/charts/AddRemoveStacked";
import { CommitsOverTime } from "@/components/charts/CommitsOverTime";
import { ActivityHeatmap } from "@/components/charts/ActivityHeatmap";
import { ContributorsTable } from "@/components/ContributorsTable";
import { AnalysisSummary } from "@/components/AnalysisSummary";
import type { AnalysisResponse, Contributor } from "@/lib/types";

interface BranchPageProps {
  params: {
    owner: string;
    repo: string;
    branch: string;
  };
}

type AnalysisState =
  | { status: "idle" }
  | { status: "analyzing"; startTime: number }
  | { status: "complete"; data: AnalysisResponse }
  | { status: "error"; message: string };

interface ProgressState {
  message: string;
  percent: number;
}

export default function BranchPage({ params }: BranchPageProps) {
  const { owner, repo, branch } = params;
  const decodedBranch = decodeURIComponent(branch);

  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    status: "idle",
  });
  const [filters, setFilters] = useState({
    since: "",
    until: "",
    filterBots: true,
  });
  const [progress, setProgress] = useState<ProgressState | null>(null);

  const startAnalysis = async () => {
    setAnalysisState({ status: "analyzing", startTime: Date.now() });
    setProgress({ message: "Connecting to GitHub API...", percent: 0 });

    try {
      const response = await fetch("/api/github/analyze/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          branch: decodedBranch,
          since: filters.since || undefined,
          until: filters.until || undefined,
          filterBots: filters.filterBots,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Analysis failed");
      }

      if (!response.body) {
        throw new Error("No response body available");
      }

      // Process SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = JSON.parse(line.slice(6));

            if (data.type === "progress") {
              setProgress({ message: data.message, percent: data.percent });
            } else if (data.type === "complete") {
              setAnalysisState({ status: "complete", data: data.result });
              setProgress(null);
            } else if (data.type === "error") {
              throw new Error(data.message || "Analysis failed");
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Analysis error:", error);
      setAnalysisState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
      setProgress(null);
    }
  };

  const handleDownloadCSV = (type: "contributors" | "commits") => {
    if (analysisState.status !== "complete") return;

    const csv =
      type === "contributors"
        ? analysisState.data.exports.contributorsCSV
        : analysisState.data.exports.commitTimesText;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${owner}-${repo}-${decodedBranch}-${type}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 relative overflow-hidden">
      {/* Static Background Orbs - No Animation for Performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-48 h-48 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
        <div className="absolute top-40 right-10 w-48 h-48 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
        <div className="absolute -bottom-8 left-20 w-48 h-48 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Link href={`/dashboard/repo/${owner}/${repo}`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 mb-4 backdrop-blur-md bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:text-white hover:from-purple-700 hover:to-blue-700 border-none shadow-lg hover:shadow-purple-500/50 hover:scale-[1.02] transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Branches
            </Button>
          </Link>

          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {owner} / {repo}
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Branch:{" "}
            <code className="backdrop-blur-md bg-white/40 px-3 py-1 rounded-lg border border-white/30">
              {decodedBranch}
            </code>
          </p>

          {/* Analysis Controls */}
          {analysisState.status === "idle" && (
            <Card>
              <CardContent className="py-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Analysis Options
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Since Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={filters.since}
                      onChange={e =>
                        setFilters({ ...filters, since: e.target.value })
                      }
                      className="w-full px-3 py-2 backdrop-blur-md bg-white/40 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Until Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={filters.until}
                      onChange={e =>
                        setFilters({ ...filters, until: e.target.value })
                      }
                      className="w-full px-3 py-2 backdrop-blur-md bg-white/40 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                    />
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center gap-2 cursor-pointer backdrop-blur-md bg-white/40 px-3 py-2 rounded-lg border border-white/30 hover:bg-white/50 transition-all">
                      <input
                        type="checkbox"
                        checked={filters.filterBots}
                        onChange={e =>
                          setFilters({
                            ...filters,
                            filterBots: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">
                        Filter bot commits
                      </span>
                    </label>
                  </div>
                </div>

                <Button
                  onClick={startAnalysis}
                  className="gap-2 backdrop-blur-md bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
                >
                  <Play className="w-4 h-4" />
                  Start Analysis
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
        {/* Analysis Progress */}
        {analysisState.status === "analyzing" && (
          <Card>
            <CardContent className="py-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Analyzing Repository...
                  </h3>
                  <span className="text-sm font-medium text-gray-600">
                    {progress ? `${Math.round(progress.percent)}%` : "0%"}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full backdrop-blur-sm bg-white/40 border border-white/20 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-full transition-all duration-300 ease-out"
                    style={{ width: `${progress?.percent || 0}%` }}
                  />
                </div>

                {/* Progress Message */}
                {progress && (
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Spinner className="w-4 h-4" />
                    {progress.message}
                  </p>
                )}

                <p className="text-xs text-gray-500">
                  This may take a few minutes for large repositories...
                </p>
              </div>
            </CardContent>
          </Card>
        )}
        {/* Error State */}
        {analysisState.status === "error" && (
          <Card>
            <CardContent className="py-6">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Analysis Failed</h3>
                  <p className="text-sm">{analysisState.message}</p>
                </div>
              </div>
              <Button
                onClick={() => setAnalysisState({ status: "idle" })}
                variant="outline"
                size="sm"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}
        {/* Results */}
        {analysisState.status === "complete" && (
          <div className="space-y-6">
            {/* Export Actions */}
            <div className="flex gap-4 justify-end">
              <Button
                onClick={() => handleDownloadCSV("contributors")}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Contributors CSV
              </Button>
              <Button
                onClick={() => handleDownloadCSV("commits")}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Commits CSV
              </Button>
            </div>

            {/* Manager Summary */}
            <AnalysisSummary
              contributors={analysisState.data.contributors as Contributor[]}
              metadata={analysisState.data.metadata}
              repoName={`${owner}/${repo}`}
              branchName={decodedBranch}
            />

            {/* Advanced Analysis Link */}
            <Card>
              <CardContent className="py-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Want deeper insights?
                    </h3>
                    <p className="text-sm text-gray-600">
                      View advanced timeline analysis, Gantt charts, and
                      individual user contributions
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/repo/${owner}/${repo}/branch/${branch}/advanced`}
                    className="flex-shrink-0"
                  >
                    <Button className="gap-2 backdrop-blur-md bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-purple-500/50 transition-all duration-300">
                      View Advanced Analysis →
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <NetLinesBar
                contributors={analysisState.data.contributors as Contributor[]}
              />
              <AddRemoveStacked
                contributors={analysisState.data.contributors as Contributor[]}
              />
              <CommitsOverTime
                commitTimes={analysisState.data.commitTimes as any[]}
              />
              <ActivityHeatmap
                commitTimes={analysisState.data.commitTimes as any[]}
              />
            </div>

            {/* Contributors Table */}
            <ContributorsTable
              contributors={analysisState.data.contributors as Contributor[]}
            />

            {/* Re-analyze Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => setAnalysisState({ status: "idle" })}
                variant="outline"
              >
                Run New Analysis
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
