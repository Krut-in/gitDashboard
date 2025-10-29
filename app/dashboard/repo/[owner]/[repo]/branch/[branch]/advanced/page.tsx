/**
 * Advanced Analysis Page
 *
 * Displays detailed timeline analysis, Gantt charts, and individual user contributions.
 * Uses tabs to organize different views: Overview, Timeline, Users, Report.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { CommitsTimeline } from "@/components/charts/CommitsTimeline";
import { LinesChangedTimeline } from "@/components/charts/LinesChangedTimeline";
import { ContributionGantt } from "@/components/charts/ContributionGantt";
import { UserContributionsSection } from "@/components/UserContributionsSection";
import { AIManagerReport } from "@/components/AIManagerReport";
import { InsightsPanel } from "@/components/InsightsPanel";
import { CommitMessageAnalysisCard } from "@/components/CommitMessageAnalysis";
import type { AdvancedAnalysisResponse } from "@/lib/types";

interface AdvancedPageProps {
  params: {
    owner: string;
    repo: string;
    branch: string;
  };
}

type AnalysisState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "complete"; data: AdvancedAnalysisResponse }
  | { status: "error"; message: string };

type TabView = "overview" | "timeline" | "users" | "report";

interface ProgressState {
  message: string;
  percent: number;
}

export default function AdvancedAnalysisPage({ params }: AdvancedPageProps) {
  const { owner, repo, branch } = params;
  const decodedBranch = decodeURIComponent(branch);

  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    status: "idle",
  });
  const [activeTab, setActiveTab] = useState<TabView>("overview");
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [commitOffset, setCommitOffset] = useState(0);

  useEffect(() => {
    // Auto-start analysis on page load
    loadAdvancedAnalysis();
  }, []);

  const loadAdvancedAnalysis = async (loadMore = false) => {
    setAnalysisState({ status: "loading" });
    setProgress({ message: "Connecting to GitHub API...", percent: 0 });

    try {
      const response = await fetch("/api/github/analyze/advanced/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner,
          repo,
          branch: decodedBranch,
          offset: loadMore ? commitOffset : 0,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to start analysis");
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
              setHasMore(data.hasMore || false);
              setCommitOffset(data.nextOffset || 0);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 relative overflow-hidden">
      {/* Static Background Orbs - Glassmorphism Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-48 h-48 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
        <div className="absolute top-40 right-10 w-48 h-48 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
        <div className="absolute -bottom-8 left-20 w-48 h-48 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Link href={`/dashboard/repo/${owner}/${repo}/branch/${branch}`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 mb-4 backdrop-blur-md !bg-gradient-to-r !from-purple-600 !to-blue-600 !text-white hover:!text-white hover:!bg-gradient-to-r hover:!from-purple-600 hover:!to-blue-600 !border-none shadow-lg hover:shadow-purple-500/50 hover:scale-[1.02] transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Analysis
            </Button>
          </Link>

          <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
            <Link href="/dashboard" className="hover:text-gray-900">
              Dashboard
            </Link>
            <span>/</span>
            <Link
              href={`/dashboard/repo/${owner}/${repo}`}
              className="hover:text-gray-900"
            >
              {owner}/{repo}
            </Link>
            <span>/</span>
            <Link
              href={`/dashboard/repo/${owner}/${repo}/branch/${branch}`}
              className="hover:text-gray-900"
            >
              {decodedBranch}
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">Advanced Analysis</span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Advanced Analysis
          </h1>
          <p className="text-lg text-gray-600">
            Deep dive into repository contributions and patterns
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex gap-3 backdrop-blur-md bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-2 border border-white/40 shadow-lg">
            {(["overview", "timeline", "users", "report"] as TabView[]).map(
              tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 px-6 py-3 font-medium capitalize transition-all duration-200 rounded-md cursor-pointer ${
                    activeTab === tab
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/60"
                  }`}
                >
                  {tab}
                </button>
              )
            )}
          </div>
        </div>

        {/* Content Area */}
        {analysisState.status === "loading" && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
                <p className="text-gray-600">
                  {progress?.message || "Loading advanced analysis..."}
                </p>
                {progress && (
                  <>
                    <div className="w-64 h-2 bg-gray-200 rounded-full mt-4">
                      <div
                        className="h-2 bg-purple-600 rounded-full transition-all duration-300"
                        style={{ width: `${progress.percent}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {progress.percent}%
                    </p>
                  </>
                )}
                {!progress && (
                  <p className="text-sm text-gray-500 mt-2">
                    This may take a few minutes for large repositories
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {analysisState.status === "error" && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <div className="inline-block p-4 bg-red-100 rounded-full mb-4">
                  <svg
                    className="w-8 h-8 text-red-600"
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Analysis Error
                </h3>
                <p className="text-gray-600 mb-4">{analysisState.message}</p>
                <p className="text-sm text-gray-500 mb-6">
                  Please check your GitHub authentication and repository access.
                  If the issue persists, the repository may be too large or the
                  branch may not exist.
                </p>
                <Button
                  onClick={() => loadAdvancedAnalysis()}
                  variant="outline"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {analysisState.status === "complete" && (
          <>
            <div className="space-y-6">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Summary Statistics */}
                  <Card>
                    <CardContent className="py-8">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-600 mb-2">
                            Total Commits
                          </p>
                          <p className="text-3xl font-bold text-metric-commits">
                            {analysisState.data.timeline.totalCommits.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-600 mb-2">
                            Contributors
                          </p>
                          <p className="text-3xl font-bold text-gray-900">
                            {analysisState.data.timeline.users.length}
                          </p>
                        </div>
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-600 mb-2">
                            Lines Added
                          </p>
                          <p className="text-3xl font-bold text-metric-additions">
                            +
                            {analysisState.data.timeline.totalAdditions.toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center py-4">
                          <p className="text-sm text-gray-600 mb-2">
                            Net Change
                          </p>
                          <p
                            className={`text-3xl font-bold ${
                              analysisState.data.timeline.totalNetLines >= 0
                                ? "text-metric-net"
                                : "text-metric-deletions"
                            }`}
                          >
                            {analysisState.data.timeline.totalNetLines >= 0
                              ? "+"
                              : ""}
                            {analysisState.data.timeline.totalNetLines.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Flatten all daily metrics for timeline charts */}
                  {(() => {
                    const allDailyMetrics =
                      analysisState.data.timeline.users.flatMap(
                        user => user.dailyMetrics
                      );
                    return (
                      <>
                        <CommitsTimeline dailyMetrics={allDailyMetrics} />
                        <LinesChangedTimeline dailyMetrics={allDailyMetrics} />
                      </>
                    );
                  })()}

                  {/* Commit Message Quality Analysis */}
                  {analysisState.data.commitMessageAnalysis && (
                    <CommitMessageAnalysisCard
                      data={analysisState.data.commitMessageAnalysis}
                    />
                  )}
                </div>
              )}

              {activeTab === "timeline" && (
                <ContributionGantt timeline={analysisState.data.timeline} />
              )}

              {activeTab === "users" && (
                <UserContributionsSection
                  users={analysisState.data.userContributions}
                />
              )}

              {activeTab === "report" && (
                <div className="space-y-6">
                  <AIManagerReport data={analysisState.data} />
                  <InsightsPanel insights={analysisState.data.insights} />
                </div>
              )}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <Card className="mt-6">
                <CardContent className="py-6">
                  <div className="text-center">
                    <p className="text-gray-600 mb-4">
                      This repository has more commits available. You can load
                      the next 5,000 commits to see more history.
                    </p>
                    <Button
                      onClick={() => loadAdvancedAnalysis(true)}
                      variant="outline"
                      className="gap-2"
                    >
                      Load Next 5,000 Commits
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {analysisState.status === "idle" && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-gray-600">Preparing advanced analysis...</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
