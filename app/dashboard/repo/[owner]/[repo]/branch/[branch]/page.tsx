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
  | { status: "analyzing" }
  | { status: "complete"; data: AnalysisResponse }
  | { status: "error"; message: string };

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

  const startAnalysis = async () => {
    setAnalysisState({ status: "analyzing" });

    try {
      const response = await fetch("/api/github/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          branch: decodedBranch,
          ...filters,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Analysis failed");
      }

      const data: AnalysisResponse = await response.json();
      setAnalysisState({ status: "complete", data });
    } catch (error) {
      setAnalysisState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/dashboard/repo/${owner}/${repo}`}>
          <Button variant="outline" size="sm" className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Branches
          </Button>
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {owner} / {repo}
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          Branch:{" "}
          <code className="bg-gray-100 px-2 py-1 rounded">{decodedBranch}</code>
        </p>

        {/* Analysis Controls */}
        {analysisState.status === "idle" && (
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Analysis Options</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Since Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={filters.since}
                    onChange={e =>
                      setFilters({ ...filters, since: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Until Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={filters.until}
                    onChange={e =>
                      setFilters({ ...filters, until: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.filterBots}
                      onChange={e =>
                        setFilters({ ...filters, filterBots: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Filter bot commits
                    </span>
                  </label>
                </div>
              </div>

              <Button onClick={startAnalysis} className="gap-2">
                <Play className="w-4 h-4" />
                Start Analysis
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Analysis Progress */}
      {analysisState.status === "analyzing" && (
        <div className="flex items-center justify-center py-12">
          <Spinner />
          <p className="ml-4 text-gray-600">Analyzing contributions...</p>
        </div>
      )}

      {/* Error State */}
      {analysisState.status === "error" && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <div>
                <h3 className="font-semibold">Analysis Failed</h3>
                <p className="text-sm">{analysisState.message}</p>
              </div>
            </div>
            <Button
              onClick={() => setAnalysisState({ status: "idle" })}
              variant="outline"
              className="mt-4"
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
          <div className="flex gap-3 justify-end">
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
  );
}
