/**
 * Insights Panel Component
 *
 * @component
 * @description Renders comprehensive repository insights with visual indicators:
 * - Temporal patterns: Most active day/hour, longest quiet periods
 * - Work patterns: Weekday vs weekend ratio, morning vs evening distribution
 * - Language patterns: Language breakdown with GitHub colors, most edited files
 * - Collaboration patterns: Solo contributors, team dynamics
 *
 * @features
 * - GitHub-style language visualization bars
 * - Responsive grid layout (1-3 columns based on viewport)
 * - Glassmorphism design for modern UI aesthetics
 * - Graceful degradation when data is unavailable
 *
 * @performance
 * - Pure component with memoized calculations
 * - No heavy computations (pre-calculated data from API)
 * - Efficient rendering with React keys
 *
 * @author GitHub Contribution Dashboard Team
 * @since 1.0.0
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Clock, Users, Code, Calendar } from "lucide-react";
import type { Insights } from "@/lib/types";

interface InsightsPanelProps {
  insights: Insights;
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  // Validate insights data structure
  if (!insights) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No insights data available</p>
      </div>
    );
  }

  // Safe ratio calculations with fallback values
  const totalWorkCommits =
    (insights.weekdayVsWeekend?.weekday || 0) +
    (insights.weekdayVsWeekend?.weekend || 0);
  const workRatio =
    totalWorkCommits > 0
      ? insights.weekdayVsWeekend.weekday / totalWorkCommits
      : 0.5; // Default to 50% if no data

  const totalTimeCommits =
    (insights.morningVsEvening?.morning || 0) +
    (insights.morningVsEvening?.evening || 0);
  const morningRatio =
    totalTimeCommits > 0
      ? insights.morningVsEvening.morning / totalTimeCommits
      : 0.5; // Default to 50% if no data

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Temporal Patterns */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600" />
            <CardTitle className="text-lg">Activity Patterns</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Most Active Day</p>
            <p className="text-2xl font-bold text-teal-600">
              {insights.mostActiveDay.day}
            </p>
            <p className="text-xs text-gray-500">
              {insights.mostActiveDay.commits} commits
            </p>
          </div>

          {insights.mostActiveHour.commits > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-1">Most Active Hour</p>
              <p className="text-2xl font-bold text-sky-600">
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

      {/* Language Patterns */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-teal-600" />
            <CardTitle className="text-lg">Language Patterns</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Language Breakdown */}
          {insights.languageBreakdown &&
            insights.languageBreakdown.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Languages Used</p>

                {/* Language Bar */}
                <div className="flex h-2 rounded-full overflow-hidden backdrop-blur-md bg-white/50 border border-white/30 mb-3">
                  {insights.languageBreakdown.slice(0, 5).map((lang, idx) => (
                    <div
                      key={idx}
                      className="transition-all duration-300"
                      style={{
                        backgroundColor: lang.color,
                        width: `${lang.percentage}%`,
                      }}
                      title={`${lang.language}: ${lang.percentage.toFixed(1)}%`}
                    />
                  ))}
                </div>

                {/* Language List */}
                <div className="space-y-1.5">
                  {insights.languageBreakdown.slice(0, 5).map((lang, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: lang.color }}
                        />
                        <span className="font-medium text-gray-700">
                          {lang.language}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">
                          {lang.fileCount}{" "}
                          {lang.fileCount === 1 ? "file" : "files"}
                        </span>
                        <span className="font-semibold text-gray-900 min-w-[2.5rem] text-right">
                          {lang.percentage.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Most Edited File */}
          {insights.mostEditedFiles && insights.mostEditedFiles.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Most Edited File</p>
              <div className="space-y-2">
                {insights.mostEditedFiles.slice(0, 1).map((file, i) => (
                  <div
                    key={i}
                    className="p-2 backdrop-blur-md bg-white/50 rounded border border-white/30"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-medium text-gray-700 truncate flex-1">
                        {file.filename.split("/").pop()}
                      </p>
                      <span className="text-xs font-bold text-sky-600 ml-2">
                        {file.edits}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="px-1.5 py-0.5 bg-gray-100 rounded text-gray-700">
                        {file.language}
                      </span>
                      <span>
                        {file.contributors} contributor
                        {file.contributors !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fallback when no data */}
          {(!insights.languageBreakdown ||
            insights.languageBreakdown.length === 0) &&
            (!insights.mostEditedFiles ||
              insights.mostEditedFiles.length === 0) && (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500 italic">
                  No language data available
                </p>
              </div>
            )}
        </CardContent>
      </Card>

      {/* Collaboration Patterns */}
      {insights.soloContributors.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-sky-600" />
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
