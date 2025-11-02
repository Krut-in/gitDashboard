/**
 * Commit Message Analysis Component
 *
 * Displays comprehensive analysis of commit message quality, including:
 * - Length distribution and statistics
 * - Conventional commit type usage
 * - Contributor writing styles (verbose vs minimalist)
 * - Quality patterns and issues
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import {
  MessageSquare,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  Info,
} from "lucide-react";
import type { CommitMessageAnalysis } from "@/lib/types";

interface CommitMessageAnalysisProps {
  data: CommitMessageAnalysis;
}

export function CommitMessageAnalysisCard({
  data,
}: CommitMessageAnalysisProps) {
  const {
    lengthDistribution,
    typeDistribution,
    userCategories,
    statistics,
    patterns,
  } = data;

  // Calculate percentages for length distribution
  const lengthPercentages = {
    short:
      statistics.totalMessages > 0
        ? Math.round(
            (lengthDistribution.short / statistics.totalMessages) * 100
          )
        : 0,
    medium:
      statistics.totalMessages > 0
        ? Math.round(
            (lengthDistribution.medium / statistics.totalMessages) * 100
          )
        : 0,
    long:
      statistics.totalMessages > 0
        ? Math.round((lengthDistribution.long / statistics.totalMessages) * 100)
        : 0,
    verbose:
      statistics.totalMessages > 0
        ? Math.round(
            (lengthDistribution.verbose / statistics.totalMessages) * 100
          )
        : 0,
  };

  // Get top commit types
  const topTypes = Object.entries(typeDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Format type labels
  const formatTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      feat: "Features",
      fix: "Fixes",
      docs: "Documentation",
      style: "Styling",
      refactor: "Refactoring",
      test: "Testing",
      chore: "Chores",
      perf: "Performance",
      ci: "CI/CD",
      build: "Build",
      revert: "Reverts",
      other: "Other",
    };
    return labels[type] || type;
  };

  return (
    <Card className="border-2">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 backdrop-blur-md bg-gradient-to-r from-sky-600 to-teal-600 rounded-lg">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">
              Commit Message Quality Analysis
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Insights into commit message patterns, conventions, and quality
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Statistics Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
            <div className="text-sm text-gray-600 mb-1">Total Messages</div>
            <div className="text-2xl font-bold text-orange-900">
              {statistics.totalMessages.toLocaleString()}
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg border border-teal-200">
            <div className="text-sm text-gray-600 mb-1">Avg Length</div>
            <div className="text-2xl font-bold text-teal-900">
              {statistics.avgLength} chars
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-100 rounded-lg border border-amber-200">
            <div className="text-sm text-gray-600 mb-1">Conventional</div>
            <div className="text-2xl font-bold text-orange-900">
              {statistics.conventionalCommitPercentage}%
            </div>
          </div>

          <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
            <div className="text-sm text-gray-600 mb-1">Most Common</div>
            <div className="text-xl font-bold text-orange-900 truncate">
              {formatTypeLabel(statistics.mostCommonType)}
            </div>
          </div>
        </div>

        {/* Length Distribution */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-sky-600" />
            <h3 className="text-lg font-semibold">Length Distribution</h3>
          </div>

          <div className="space-y-3">
            {/* Short */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Short (&lt;50 chars)
                </span>
                <span className="text-sm text-gray-600">
                  {lengthDistribution.short} ({lengthPercentages.short}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${lengthPercentages.short}%` }}
                />
              </div>
            </div>

            {/* Medium */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Medium (50-100 chars)
                </span>
                <span className="text-sm text-gray-600">
                  {lengthDistribution.medium} ({lengthPercentages.medium}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-teal-400 to-teal-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${lengthPercentages.medium}%` }}
                />
              </div>
            </div>

            {/* Long */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Long (100-200 chars)
                </span>
                <span className="text-sm text-gray-600">
                  {lengthDistribution.long} ({lengthPercentages.long}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-sky-400 to-sky-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${lengthPercentages.long}%` }}
                />
              </div>
            </div>

            {/* Verbose */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700">
                  Verbose (&gt;200 chars)
                </span>
                <span className="text-sm text-gray-600">
                  {lengthDistribution.verbose} ({lengthPercentages.verbose}%)
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-orange-400 to-amber-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${lengthPercentages.verbose}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Conventional Commit Types */}
        {topTypes.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-teal-600" />
              <h3 className="text-lg font-semibold">Top Commit Types</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {topTypes.map(([type, count]) => {
                const percentage =
                  statistics.totalMessages > 0
                    ? Math.round((count / statistics.totalMessages) * 100)
                    : 0;

                return (
                  <div
                    key={type}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          type === "feat"
                            ? "bg-teal-500"
                            : type === "fix"
                            ? "bg-red-500"
                            : type === "docs"
                            ? "bg-sky-500"
                            : type === "other"
                            ? "bg-gray-400"
                            : "bg-amber-500"
                        }`}
                      />
                      <span className="font-medium text-gray-900">
                        {formatTypeLabel(type)}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {count}
                      </div>
                      <div className="text-xs text-gray-500">{percentage}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Contributor Writing Styles */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            <h3 className="text-lg font-semibold">
              Contributor Writing Styles
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Verbose Writers */}
            {userCategories.verbose.length > 0 && (
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h4 className="font-semibold text-amber-900 mb-2">
                  Verbose ({userCategories.verbose.length})
                </h4>
                <div className="space-y-2">
                  {userCategories.verbose.slice(0, 3).map(user => (
                    <div key={user.userName} className="text-sm">
                      <div className="font-medium text-gray-900">
                        {user.userName}
                      </div>
                      <div className="text-xs text-gray-600">
                        Avg: {user.avgLength} chars · {user.commitCount} commits
                      </div>
                      {user.exampleMessages[0] && (
                        <div className="text-xs text-gray-500 italic truncate mt-1">
                          "{user.exampleMessages[0]}"
                        </div>
                      )}
                    </div>
                  ))}
                  {userCategories.verbose.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{userCategories.verbose.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Balanced Writers */}
            {userCategories.balanced.length > 0 && (
              <div className="p-4 bg-teal-50 rounded-lg border border-teal-200">
                <h4 className="font-semibold text-teal-900 mb-2">
                  Balanced ({userCategories.balanced.length})
                </h4>
                <div className="space-y-2">
                  {userCategories.balanced.slice(0, 3).map(user => (
                    <div key={user.userName} className="text-sm">
                      <div className="font-medium text-gray-900">
                        {user.userName}
                      </div>
                      <div className="text-xs text-gray-600">
                        Avg: {user.avgLength} chars · {user.commitCount} commits
                      </div>
                      {user.exampleMessages[0] && (
                        <div className="text-xs text-gray-500 italic truncate mt-1">
                          "{user.exampleMessages[0]}"
                        </div>
                      )}
                    </div>
                  ))}
                  {userCategories.balanced.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{userCategories.balanced.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Minimalist Writers */}
            {userCategories.minimalist.length > 0 && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-2">
                  Minimalist ({userCategories.minimalist.length})
                </h4>
                <div className="space-y-2">
                  {userCategories.minimalist.slice(0, 3).map(user => (
                    <div key={user.userName} className="text-sm">
                      <div className="font-medium text-gray-900">
                        {user.userName}
                      </div>
                      <div className="text-xs text-gray-600">
                        Avg: {user.avgLength} chars · {user.commitCount} commits
                      </div>
                      {user.exampleMessages[0] && (
                        <div className="text-xs text-gray-500 italic truncate mt-1">
                          "{user.exampleMessages[0]}"
                        </div>
                      )}
                    </div>
                  ))}
                  {userCategories.minimalist.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{userCategories.minimalist.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quality Patterns */}
        {patterns.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h3 className="text-lg font-semibold">
                Quality Patterns Detected
              </h3>
            </div>

            <div className="space-y-2">
              {patterns.map(pattern => {
                const patternInfo = {
                  "single-char": {
                    label: "Single-character commits",
                    color: "red",
                    icon: "🚨",
                  },
                  generic: {
                    label: "Generic/non-descriptive commits",
                    color: "orange",
                    icon: "⚠️",
                  },
                  "no-message": {
                    label: "Empty commit messages",
                    color: "red",
                    icon: "❌",
                  },
                  "very-long": {
                    label: "Very long commit messages (>200 chars)",
                    color: "blue",
                    icon: "📝",
                  },
                };

                const info = patternInfo[pattern.type];

                return (
                  <div
                    key={pattern.type}
                    className={`p-3 rounded-lg border ${
                      info.color === "red"
                        ? "bg-red-50 border-red-200"
                        : info.color === "orange"
                        ? "bg-orange-50 border-orange-200"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{info.icon}</span>
                        <div>
                          <div className="font-medium text-gray-900">
                            {info.label}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Found {pattern.count} instance
                            {pattern.count !== 1 ? "s" : ""}
                          </div>
                          {pattern.examples.length > 0 && (
                            <div className="mt-2 text-xs text-gray-700">
                              <div className="font-medium">Example:</div>
                              <div className="italic mt-1">
                                "{pattern.examples[0].message}" by{" "}
                                {pattern.examples[0].author}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Key Insights */}
        <div className="p-4 bg-gradient-to-r from-sky-50 to-teal-50 rounded-lg border border-sky-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-sky-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Key Insights</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                {statistics.conventionalCommitPercentage >= 70 && (
                  <li>
                    ✅ Great adoption of conventional commit standards (
                    {statistics.conventionalCommitPercentage}%)
                  </li>
                )}
                {statistics.conventionalCommitPercentage < 50 && (
                  <>
                    <li>
                      📌 Consider adopting conventional commit standards
                      (currently {statistics.conventionalCommitPercentage}%)
                    </li>
                    <li className="ml-5 text-xs text-gray-600 mt-1">
                      Conventional commits follow a structured format:{" "}
                      <code className="bg-white px-1 py-0.5 rounded">
                        type(scope): description
                      </code>
                      <br />
                      Examples:{" "}
                      <code className="bg-white px-1 py-0.5 rounded">
                        feat: add user login
                      </code>
                      ,{" "}
                      <code className="bg-white px-1 py-0.5 rounded">
                        fix: resolve memory leak
                      </code>
                      ,{" "}
                      <code className="bg-white px-1 py-0.5 rounded">
                        docs: update README
                      </code>
                      <br />
                      This standard improves code history readability, enables
                      automated changelog generation, and helps teams understand
                      changes at a glance.
                    </li>
                  </>
                )}
                {statistics.avgLength < 30 && (
                  <li>
                    📌 Commit messages are quite brief (avg:{" "}
                    {statistics.avgLength} chars) - consider adding more context
                  </li>
                )}
                {statistics.avgLength > 100 && (
                  <li>
                    ✅ Detailed commit messages (avg: {statistics.avgLength}{" "}
                    chars) provide good context
                  </li>
                )}
                {patterns.some(
                  p => p.type === "single-char" || p.type === "generic"
                ) && (
                  <li>
                    ⚠️ Some commits have low-quality messages - encourage
                    descriptive commit messages
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
