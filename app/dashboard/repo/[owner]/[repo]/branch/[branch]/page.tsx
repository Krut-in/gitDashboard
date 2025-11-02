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
import { ArrowLeft, Download, Play, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
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
    // Prevent multiple simultaneous analysis runs
    if (analysisState.status === "analyzing") {
      console.warn("Analysis already in progress");
      return;
    }

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
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "progress") {
                setProgress({
                  message: data.message || "Processing...",
                  percent: typeof data.percent === "number" ? data.percent : 0,
                });
              } else if (data.type === "complete") {
                setAnalysisState({ status: "complete", data: data.result });
                setProgress(null);
              } else if (data.type === "error") {
                throw new Error(data.message || "Analysis failed");
              }
            } catch (parseError) {
              console.error("Failed to parse SSE data:", parseError);
              // Continue processing other messages instead of failing completely
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
    if (analysisState.status !== "complete") {
      console.warn("Cannot download CSV: Analysis not complete");
      return;
    }

    try {
      const csv =
        type === "contributors"
          ? analysisState.data.exports.contributorsCSV
          : analysisState.data.exports.commitTimesText;

      if (!csv || typeof csv !== "string") {
        console.error("Invalid CSV data");
        return;
      }

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${owner}-${repo}-${decodedBranch}-${type}.csv`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();

      // Cleanup with delay to ensure download starts
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Failed to download CSV:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-sky-50 to-teal-50 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-48 h-48 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
        <div className="absolute top-40 right-10 w-48 h-48 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
        <div className="absolute -bottom-8 left-20 w-48 h-48 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <Link href={`/dashboard/repo/${owner}/${repo}`}>
            <Button variant="gradient" size="sm" className="gap-2 mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to Branches
            </Button>
          </Link>

          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              {owner} / {repo}
            </h1>
            <p className="text-lg text-gray-600">
              Branch: <Badge variant="code">{decodedBranch}</Badge>
            </p>
          </div>
        </div>

        {/* Analysis Controls */}
        {analysisState.status === "idle" && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Analysis Options
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label
                    htmlFor="since-date"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Since Date (Optional)
                  </label>
                  <Input
                    id="since-date"
                    type="date"
                    value={filters.since}
                    onChange={e =>
                      setFilters({ ...filters, since: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label
                    htmlFor="until-date"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Until Date (Optional)
                  </label>
                  <Input
                    id="until-date"
                    type="date"
                    value={filters.until}
                    onChange={e =>
                      setFilters({ ...filters, until: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer backdrop-blur-md bg-white/40 px-4 py-2.5 rounded-lg border border-white/30 hover:bg-white/50 focus-within:ring-2 focus-within:ring-ring transition-all">
                    <input
                      id="filter-bots"
                      type="checkbox"
                      checked={filters.filterBots}
                      onChange={e =>
                        setFilters({
                          ...filters,
                          filterBots: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Filter bot commits
                    </span>
                  </label>
                </div>
              </div>

              <Button
                onClick={startAnalysis}
                variant="gradient"
                className="gap-2"
                aria-label="Start repository analysis"
              >
                <Play className="w-4 h-4" aria-hidden="true" />
                Start Analysis
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Analysis Progress */}
        {analysisState.status === "analyzing" && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Analyzing Repository...
                  </h3>
                  <span className="text-sm font-medium text-gray-600">
                    {progress ? `${Math.round(progress.percent)}%` : "0%"}
                  </span>
                </div>

                {/* Progress Bar */}
                <ProgressBar
                  value={progress?.percent || 0}
                  max={100}
                  variant="default"
                  size="default"
                  barStyle="gradient"
                />

                {/* Progress Message */}
                {progress && (
                  <p
                    className="text-sm text-gray-600 flex items-center gap-2"
                    role="status"
                    aria-live="polite"
                  >
                    <Spinner className="w-4 h-4" aria-hidden="true" />
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
            <CardContent className="p-6">
              <div className="flex items-center gap-3 text-red-600 mb-6">
                <AlertCircle className="w-6 h-6 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-lg">Analysis Failed</h3>
                  <p className="text-sm mt-1">{analysisState.message}</p>
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
            {/* Manager Summary */}
            <AnalysisSummary
              contributors={analysisState.data.contributors as Contributor[]}
              metadata={analysisState.data.metadata}
              repoName={`${owner}/${repo}`}
              branchName={decodedBranch}
            />

            {/* Export Actions Card */}
            <Card>
              <CardContent className="p-6 pt-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Export Analysis Data
                    </h3>
                    <p className="text-sm text-gray-600">
                      Download contributor and commit data as CSV files
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
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
                </div>
              </CardContent>
            </Card>

            {/* Advanced Analysis Link */}
            <div className="p-4 backdrop-blur-md bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Want deeper insights?
                    </h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    View advanced timeline analysis, Gantt charts, and
                    individual user contributions
                  </p>
                </div>
                <Link
                  href={`/dashboard/repo/${owner}/${repo}/branch/${branch}/advanced`}
                  className="flex-shrink-0"
                >
                  <Button variant="gradient" size="sm" className="gap-2">
                    View Advanced Analysis →
                  </Button>
                </Link>
              </div>
            </div>

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
            <div className="flex justify-center pt-2">
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
