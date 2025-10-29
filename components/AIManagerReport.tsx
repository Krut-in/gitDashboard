/**
 * AI Manager Report Component
 *
 * Displays an intelligent analysis summary and actionable recommendations for managers.
 * Provides insights into team productivity, collaboration patterns, and code quality metrics.
 *
 * Key Features:
 * - Team productivity overview with contribution metrics
 * - Collaboration patterns and solo contributor identification
 * - Work pattern analysis (weekday vs. weekend, timing)
 * - Actionable recommendations based on data patterns
 * - AI-powered insights using OpenAI GPT-4o
 *
 * Uses OpenAI GPT-4o to generate contextual insights and recommendations.
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import {
  Sparkles,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import type { AdvancedAnalysisResponse } from "@/lib/types";

interface AIManagerReportProps {
  data: AdvancedAnalysisResponse;
}

interface AIInsights {
  executiveSummary: string;
  strengths: string[];
  concerns: string[];
  recommendations: Array<{
    priority: "high" | "medium" | "low";
    title: string;
    description: string;
    impact: string;
  }>;
  teamHealth: {
    score: number;
    factors: string[];
  };
  predictiveInsights: string[];
}

export function AIManagerReport({ data }: AIManagerReportProps) {
  const { timeline, insights, metadata } = data;

  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useAI, setUseAI] = useState(false);

  // Calculate some metrics for the report
  const avgCommitsPerUser =
    timeline.users.length > 0
      ? Math.round(timeline.totalCommits / timeline.users.length)
      : 0;

  const activeContributors = timeline.users.filter(
    u =>
      new Date(u.lastCommitDate).getTime() >
      Date.now() - 30 * 24 * 60 * 60 * 1000
  ).length;

  const codeGrowth =
    timeline.totalAdditions > 0
      ? ((timeline.totalNetLines / timeline.totalAdditions) * 100).toFixed(1)
      : 0;

  const fetchAIInsights = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/manager-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate AI insights");
      }

      const result = await response.json();
      setAiInsights(result.insights);
      setUseAI(true);
    } catch (err: any) {
      setError(err.message);
      setUseAI(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-50 border-red-200";
      case "medium":
        return "bg-yellow-50 border-yellow-200";
      case "low":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-900";
      case "medium":
        return "text-yellow-900";
      case "low":
        return "text-blue-900";
      default:
        return "text-gray-900";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-yellow-600";
      case "low":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 backdrop-blur-md bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {useAI && aiInsights
                    ? "AI-Powered Manager Report"
                    : "Manager Summary Report"}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Generated on{" "}
                  {new Date(metadata.generatedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            <Button
              onClick={fetchAIInsights}
              disabled={isLoading}
              className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating AI Insights...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {useAI && aiInsights ? "Regenerate" : "Generate"} AI Insights
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-900">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">AI Analysis Failed</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI-Powered Insights */}
      {useAI && aiInsights && (
        <>
          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <CardTitle>AI Executive Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {aiInsights.executiveSummary}
              </p>
            </CardContent>
          </Card>

          {/* Team Health Score */}
          {aiInsights.teamHealth && aiInsights.teamHealth.score > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <CardTitle>Team Health Score</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="relative w-32 h-32">
                    <svg className="transform -rotate-90 w-32 h-32">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        className="text-gray-200"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="currentColor"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${
                          2 *
                          Math.PI *
                          56 *
                          (1 - aiInsights.teamHealth.score / 100)
                        }`}
                        className={
                          aiInsights.teamHealth.score >= 80
                            ? "text-green-600"
                            : aiInsights.teamHealth.score >= 60
                            ? "text-yellow-600"
                            : "text-red-600"
                        }
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-3xl font-bold text-gray-900">
                        {aiInsights.teamHealth.score}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h4 className="font-semibold mb-2">Key Factors:</h4>
                    <ul className="space-y-1">
                      {aiInsights.teamHealth.factors.map((factor, i) => (
                        <li
                          key={i}
                          className="text-sm text-gray-700 flex items-start gap-2"
                        >
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          {factor}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Strengths & Concerns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <CardTitle>Strengths</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {aiInsights.strengths.map((strength, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <CardTitle>Areas of Concern</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {aiInsights.concerns.map((concern, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{concern}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <CardTitle>AI-Powered Recommendations</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {aiInsights.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg border ${getPriorityColor(
                      rec.priority
                    )}`}
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${getPriorityIcon(
                          rec.priority
                        )}`}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4
                            className={`font-semibold ${getPriorityTextColor(
                              rec.priority
                            )}`}
                          >
                            {rec.title}
                          </h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-white/50 font-medium">
                            {rec.priority} priority
                          </span>
                        </div>
                        <p
                          className={`text-sm mb-2 ${getPriorityTextColor(
                            rec.priority
                          )}`}
                        >
                          {rec.description}
                        </p>
                        <p
                          className={`text-xs italic ${getPriorityTextColor(
                            rec.priority
                          )} opacity-80`}
                        >
                          <strong>Expected Impact:</strong> {rec.impact}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Predictive Insights */}
          {aiInsights.predictiveInsights.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <CardTitle>Predictive Insights</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {aiInsights.predictiveInsights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Fallback: Traditional Report (when AI is not used) */}
      {!useAI && (
        <>
          {/* Executive Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <CardTitle>Executive Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700 leading-relaxed">
                  The repository shows{" "}
                  <strong className="text-gray-900">
                    {timeline.totalCommits} total commits
                  </strong>{" "}
                  from{" "}
                  <strong className="text-gray-900">
                    {timeline.users.length} contributors
                  </strong>{" "}
                  over the analyzed period. With{" "}
                  <strong className="text-metric-additions">
                    +{timeline.totalAdditions.toLocaleString()} lines added
                  </strong>{" "}
                  and{" "}
                  <strong className="text-metric-deletions">
                    -{timeline.totalDeletions.toLocaleString()} lines removed
                  </strong>
                  , the codebase has experienced a net change of{" "}
                  <strong
                    className={
                      timeline.totalNetLines >= 0
                        ? "text-metric-net"
                        : "text-metric-deletions"
                    }
                  >
                    {timeline.totalNetLines >= 0 ? "+" : ""}
                    {timeline.totalNetLines.toLocaleString()} lines
                  </strong>
                  , representing {codeGrowth}% growth.
                </p>
                <p className="text-gray-700 leading-relaxed mt-3">
                  Currently, <strong>{activeContributors}</strong> contributors
                  are actively working on the project (activity within the last
                  30 days), indicating{" "}
                  {activeContributors / timeline.users.length > 0.5
                    ? "strong team engagement"
                    : "moderate team engagement"}
                  . The team is most productive on{" "}
                  <strong>{insights.mostActiveDay.day}</strong>, with peak
                  activity occurring during{" "}
                  {insights.weekdayVsWeekend.weekday >
                  insights.weekdayVsWeekend.weekend
                    ? "weekdays"
                    : "weekends"}
                  .
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Top Contributors */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <CardTitle>Top Contributors & Impact</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.users
                  .slice(0, 5)
                  .sort((a, b) => b.totalCommits - a.totalCommits)
                  .map((user, index) => (
                    <div
                      key={user.userId}
                      className="flex items-center gap-4 p-3 backdrop-blur-md bg-white/50 rounded-lg border border-white/30"
                    >
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center backdrop-blur-md bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-bold text-sm">
                        #{index + 1}
                      </div>

                      {user.avatarUrl && (
                        <img
                          src={user.avatarUrl}
                          alt={user.userName}
                          className="w-10 h-10 rounded-full border-2 border-white shadow"
                        />
                      )}

                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {user.userName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {user.totalCommits} commits •{" "}
                          <span className="text-metric-additions">
                            +{user.totalAdditions.toLocaleString()}
                          </span>{" "}
                          <span className="text-metric-deletions">
                            -{user.totalDeletions.toLocaleString()}
                          </span>{" "}
                          • Net:{" "}
                          <span
                            className={
                              user.totalNetLines >= 0
                                ? "text-metric-net"
                                : "text-metric-deletions"
                            }
                          >
                            {user.totalNetLines >= 0 ? "+" : ""}
                            {user.totalNetLines.toLocaleString()}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <CardTitle>Recommendations</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeContributors / timeline.users.length < 0.5 && (
                  <div className="flex gap-3 p-3 backdrop-blur-md bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-900">
                        Consider re-engaging inactive contributors
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Less than half of the team has been active in the last
                        30 days. Regular check-ins or pair programming sessions
                        might help.
                      </p>
                    </div>
                  </div>
                )}

                {avgCommitsPerUser < 10 && (
                  <div className="flex gap-3 p-3 backdrop-blur-md bg-blue-50 rounded-lg border border-blue-200">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">
                        Low commit frequency detected
                      </p>
                      <p className="text-sm text-blue-700 mt-1">
                        Average of {avgCommitsPerUser} commits per contributor.
                        Consider encouraging smaller, more frequent commits for
                        better code review and collaboration.
                      </p>
                    </div>
                  </div>
                )}

                {timeline.totalNetLines < 0 && (
                  <div className="flex gap-3 p-3 backdrop-blur-md bg-purple-50 rounded-lg border border-purple-200">
                    <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-purple-900">
                        Positive code reduction
                      </p>
                      <p className="text-sm text-purple-700 mt-1">
                        The codebase has been streamlined with net negative line
                        changes. This often indicates good refactoring and
                        technical debt reduction.
                      </p>
                    </div>
                  </div>
                )}

                {insights.soloContributors.length > 0 && (
                  <div className="flex gap-3 p-3 backdrop-blur-md bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900">
                        Encourage knowledge sharing
                      </p>
                      <p className="text-sm text-green-700 mt-1">
                        {insights.soloContributors.length} contributor(s) are
                        working independently. Consider code reviews or pair
                        programming to improve knowledge distribution.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Note about AI */}
          <div className="text-center text-sm text-gray-500 italic">
            <p>
              Click "Generate AI Insights" above for AI-powered analysis and
              recommendations.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
