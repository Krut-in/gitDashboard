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

export default function AdvancedAnalysisPage({ params }: AdvancedPageProps) {
  const { owner, repo, branch } = params;
  const decodedBranch = decodeURIComponent(branch);

  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    status: "idle",
  });
  const [activeTab, setActiveTab] = useState<TabView>("overview");

  useEffect(() => {
    // Auto-start analysis on page load
    loadAdvancedAnalysis();
  }, []);

  const loadAdvancedAnalysis = async () => {
    setAnalysisState({ status: "loading" });

    try {
      // For demonstration, we'll generate mock data since this requires local repo access
      // In production, you would call the API with a local repository path

      // Uncomment this when you have local repo access configured:
      /*
      const response = await fetch("/api/github/analyze/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoPath: "/path/to/local/repo", // User needs to provide this
          branch: decodedBranch,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Advanced analysis failed");
      }

      const data: AdvancedAnalysisResponse = await response.json();
      setAnalysisState({ status: "complete", data });
      */

      // For now, show an informative error
      throw new Error(
        "Advanced analysis requires local repository access. Please configure repository path in the API call. This feature works best with the Blame, Commits, or Hybrid analysis modes that have access to local git repositories."
      );
    } catch (error: any) {
      setAnalysisState({
        status: "error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Link href={`/dashboard/repo/${owner}/${repo}/branch/${branch}`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 mb-4 backdrop-blur-md bg-white/40 hover:bg-white/60 border-white/30"
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
          <div className="flex gap-2 border-b border-gray-200">
            {(["overview", "timeline", "users", "report"] as TabView[]).map(
              tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? "text-purple-600 border-b-2 border-purple-600"
                      : "text-gray-600 hover:text-gray-900"
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
                <p className="text-gray-600">Loading advanced analysis...</p>
                <p className="text-sm text-gray-500 mt-2">
                  This may take a few minutes for large repositories
                </p>
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
                  Advanced analysis requires local repository access. This
                  feature works best with the analysis modes that access local
                  git repositories (Blame, Commits, or Hybrid modes).
                </p>
                <Button onClick={loadAdvancedAnalysis} variant="outline">
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {analysisState.status === "complete" && (
          <div className="space-y-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* Summary Statistics */}
                <Card>
                  <CardContent className="py-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">
                          Total Commits
                        </p>
                        <p className="text-3xl font-bold text-metric-commits">
                          {analysisState.data.timeline.totalCommits.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">
                          Contributors
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {analysisState.data.timeline.users.length}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">
                          Lines Added
                        </p>
                        <p className="text-3xl font-bold text-metric-additions">
                          +
                          {analysisState.data.timeline.totalAdditions.toLocaleString()}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Net Change</p>
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
