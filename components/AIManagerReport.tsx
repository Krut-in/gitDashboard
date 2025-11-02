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
 * - AI-powered insights using OpenAI GPT-5-mini
 *
 * Uses OpenAI GPT-5-mini to generate contextual insights and recommendations.
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  Info,
  AlertTriangle,
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

interface APIError {
  error: string;
  fallback?: boolean;
  details?: string;
  suggestion?: string;
}

export function AIManagerReport({ data }: AIManagerReportProps) {
  const { timeline, insights, metadata } = data;

  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<APIError | null>(null);
  const [useAI, setUseAI] = useState(false);
  const [isCached, setIsCached] = useState(false);

  // Calculate some metrics for the report
  const activeContributors = timeline.users.filter(
    u =>
      new Date(u.lastCommitDate).getTime() >
      Date.now() - 30 * 24 * 60 * 60 * 1000
  ).length;

  const codeGrowth =
    timeline.totalAdditions > 0
      ? ((timeline.totalNetLines / timeline.totalAdditions) * 100).toFixed(1)
      : "0";

  const fetchAIInsights = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/manager-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      // Handle different error scenarios
      if (!response.ok) {
        const errorData: APIError = {
          error: result.error || "Failed to generate AI insights",
          fallback: result.fallback || false,
          details: result.details,
          suggestion: result.suggestion,
        };

        setError(errorData);
        setUseAI(false);
        return;
      }

      // Success case
      setAiInsights(result.insights);
      setIsCached(result.cached || false);
      setUseAI(true);
      setError(null);
    } catch (err: any) {
      console.error("Client-side error:", err);
      setError({
        error: "Network error occurred",
        fallback: true,
        details: err.message || "Unable to connect to the AI service",
        suggestion: "Please check your internet connection and try again.",
      });
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
        return "bg-sky-50 border-sky-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const getPriorityTextColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-900";
      case "medium":
        return "text-amber-900";
      case "low":
        return "text-sky-900";
      default:
        return "text-gray-900";
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-amber-600";
      case "low":
        return "text-sky-600";
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
              <div className="p-2 backdrop-blur-md bg-gradient-to-r from-orange-600 to-amber-600 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
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
                  {isCached && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full">
                      Cached
                    </span>
                  )}
                </p>
              </div>
            </div>

            <Button
              onClick={fetchAIInsights}
              disabled={isLoading}
              className="gap-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
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
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900 mb-2">
                  {error.error}
                </h3>

                {error.details && (
                  <p className="text-sm text-amber-800 mb-3">
                    <strong>Details:</strong> {error.details}
                  </p>
                )}

                {error.suggestion && (
                  <div className="flex items-start gap-2 p-3 bg-amber-100 rounded-lg mb-3">
                    <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-900">
                      <strong>Suggestion:</strong> {error.suggestion}
                    </p>
                  </div>
                )}

                {error.fallback && (
                  <div className="flex items-center gap-2 text-sm text-amber-700 mt-3">
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      Don't worry! The traditional report is available below.
                    </span>
                  </div>
                )}

                <Button
                  onClick={() => setError(null)}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  Dismiss
                </Button>
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
                <Sparkles className="w-5 h-5 text-amber-600" />
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
                  <TrendingUp className="w-5 h-5 text-teal-600" />
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
                            ? "text-teal-600"
                            : aiInsights.teamHealth.score >= 60
                            ? "text-amber-600"
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
                    {aiInsights.teamHealth.factors.length > 0 ? (
                      <ul className="space-y-1">
                        {aiInsights.teamHealth.factors.map((factor, i) => (
                          <li
                            key={i}
                            className="text-sm text-gray-700 flex items-start gap-2"
                          >
                            <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        No specific factors identified
                      </p>
                    )}
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
                  <CheckCircle className="w-5 h-5 text-teal-600" />
                  <CardTitle>Strengths</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {aiInsights.strengths.length > 0 ? (
                  <ul className="space-y-2">
                    {aiInsights.strengths.map((strength, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">
                          {strength}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    No specific strengths identified
                  </p>
                )}
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
                {aiInsights.concerns.length > 0 ? (
                  <ul className="space-y-2">
                    {aiInsights.concerns.map((concern, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{concern}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    No major concerns identified
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* AI Recommendations */}
          {aiInsights.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-sky-600" />
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
          )}

          {/* Predictive Insights */}
          {aiInsights.predictiveInsights.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <CardTitle>Predictive Insights</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {aiInsights.predictiveInsights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
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
                <TrendingUp className="w-5 h-5 text-teal-600" />
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
        </>
      )}
    </div>
  );
}
