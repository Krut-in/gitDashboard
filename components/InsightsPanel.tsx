/**
 * Insights Panel Component
 *
 * Displays extracted insights from commit data:
 * - Temporal patterns (most active day/hour)
 * - Work patterns (weekday vs weekend, morning vs evening)
 * - Code patterns (largest commit, commit types)
 * - Collaboration patterns
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Clock, TrendingUp, Users, Code, Calendar } from "lucide-react";
import type { Insights } from "@/lib/types";

interface InsightsPanelProps {
  insights: Insights;
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  const workRatio =
    insights.weekdayVsWeekend.weekday /
    (insights.weekdayVsWeekend.weekday + insights.weekdayVsWeekend.weekend ||
      1);

  const morningRatio =
    insights.morningVsEvening.morning /
    (insights.morningVsEvening.morning + insights.morningVsEvening.evening ||
      1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Temporal Patterns */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-lg">Activity Patterns</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Most Active Day</p>
            <p className="text-2xl font-bold text-purple-600">
              {insights.mostActiveDay.day}
            </p>
            <p className="text-xs text-gray-500">
              {insights.mostActiveDay.commits} commits
            </p>
          </div>

          {insights.mostActiveHour.commits > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Most Active Hour</p>
              <p className="text-2xl font-bold text-blue-600">
                {insights.mostActiveHour.hour}:00
              </p>
              <p className="text-xs text-gray-500">
                {insights.mostActiveHour.commits} commits
              </p>
            </div>
          )}

          {insights.quietestPeriod && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Longest Quiet Period</p>
              <p className="text-sm font-medium text-gray-700">
                {new Date(insights.quietestPeriod.start).toLocaleDateString()} -{" "}
                {new Date(insights.quietestPeriod.end).toLocaleDateString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Patterns */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            <CardTitle className="text-lg">Work Patterns</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Weekday vs Weekend</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-4 backdrop-blur-md bg-white/50 rounded-full overflow-hidden border border-white/30">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                  style={{ width: `${workRatio * 100}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700">
                {Math.round(workRatio * 100)}%
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {insights.weekdayVsWeekend.weekday} weekday commits,{" "}
              {insights.weekdayVsWeekend.weekend} weekend commits
            </p>
          </div>

          {insights.morningVsEvening.morning +
            insights.morningVsEvening.evening >
            0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Morning vs Evening</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-4 backdrop-blur-md bg-white/50 rounded-full overflow-hidden border border-white/30">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                    style={{ width: `${morningRatio * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {Math.round(morningRatio * 100)}%
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {insights.morningVsEvening.morning} morning commits,{" "}
                {insights.morningVsEvening.evening} evening commits
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Code Patterns */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-green-600" />
            <CardTitle className="text-lg">Code Patterns</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.largestCommit && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Largest Commit</p>
              <p className="text-sm font-medium text-gray-700 mb-1">
                {insights.largestCommit.author}
              </p>
              <p className="text-xs text-gray-500">
                <span className="text-metric-additions">
                  +{insights.largestCommit.additions.toLocaleString()}
                </span>{" "}
                <span className="text-metric-deletions">
                  -{insights.largestCommit.deletions.toLocaleString()}
                </span>
              </p>
              <p className="text-xs text-gray-400 font-mono mt-1">
                {insights.largestCommit.sha.substring(0, 7)}
              </p>
            </div>
          )}

          {insights.commonCommitTypes.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Common Commit Types</p>
              <div className="space-y-1">
                {insights.commonCommitTypes.slice(0, 3).map(type => (
                  <div
                    key={type.type}
                    className="flex items-center justify-between"
                  >
                    <span className="text-xs font-medium text-gray-700 capitalize">
                      {type.type}
                    </span>
                    <span className="text-xs text-gray-500">{type.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {insights.avgCommitMessageLength > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Avg Message Length</p>
              <p className="text-2xl font-bold text-gray-700">
                {insights.avgCommitMessageLength}
              </p>
              <p className="text-xs text-gray-500">characters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collaboration Patterns */}
      {insights.soloContributors.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <CardTitle className="text-lg">Collaboration</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Solo Contributors</p>
              <div className="flex flex-wrap gap-2">
                {insights.soloContributors.slice(0, 5).map(contributor => (
                  <span
                    key={contributor}
                    className="px-2 py-1 text-xs font-medium backdrop-blur-md bg-white/50 rounded-full border border-white/30"
                  >
                    {contributor}
                  </span>
                ))}
              </div>
              {insights.soloContributors.length > 5 && (
                <p className="text-xs text-gray-500 mt-2">
                  +{insights.soloContributors.length - 5} more
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
