/**
 * AI Manager Report Component
 *
 * Displays AI-generated summary and recommendations for managers.
 * Currently shows a placeholder with manual summary structure.
 * TODO: Integrate with OpenAI API or similar for actual generation.
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import {
  Sparkles,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import type { AdvancedAnalysisResponse } from "@/lib/types";

interface AIManagerReportProps {
  data: AdvancedAnalysisResponse;
}

export function AIManagerReport({ data }: AIManagerReportProps) {
  const { timeline, insights, metadata } = data;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 backdrop-blur-md bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">Manager Summary Report</CardTitle>
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
        </CardHeader>
      </Card>

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
              Currently, <strong>{activeContributors}</strong> contributors are
              actively working on the project (activity within the last 30
              days), indicating{" "}
              {activeContributors / timeline.users.length > 0.5
                ? "strong team engagement"
                : "moderate team engagement"}
              . The team is most productive on{" "}
              <strong>{insights.mostActiveDay.day}</strong>, with peak activity
              occurring during{" "}
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
                    Less than half of the team has been active in the last 30
                    days. Regular check-ins or pair programming sessions might
                    help.
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
                    changes. This often indicates good refactoring and technical
                    debt reduction.
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
          This is a template report based on repository metrics. Full AI-powered
          insights require OpenAI API integration.
        </p>
      </div>
    </div>
  );
}
