/**
 * Analysis Summary Component
 *
 * Generates and displays a manager-readable summary of the contribution analysis.
 * Includes key insights, top contributors, inactive developers, and code statistics.
 * Summary is deterministic (no AI) and can be exported as markdown.
 */

"use client";

import { useMemo } from "react";
import {
  Download,
  TrendingUp,
  Users,
  AlertTriangle,
  GitCommit,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import {
  formatNumber,
  formatDateShort,
  formatSignedNumber,
} from "@/lib/format";

interface Contributor {
  name: string;
  githubLogin: string | null;
  commitCount: number;
  additions: number;
  deletions: number;
  netLines: number;
  lastCommitDate: string | null;
  activeDays: number;
}

interface AnalysisMetadata {
  totalCommits: number;
  analyzedCommits: number;
  totalContributors: number;
  dateRange: {
    start: string | null;
    end: string | null;
  };
}

interface AnalysisSummaryProps {
  contributors: Contributor[];
  metadata: AnalysisMetadata;
  repoName: string;
  branchName: string;
}

export function AnalysisSummary({
  contributors,
  metadata,
  repoName,
  branchName,
}: AnalysisSummaryProps) {
  const insights = useMemo(() => {
    // Top 3 contributors by commits
    const topByCommits = [...contributors]
      .sort((a, b) => b.commitCount - a.commitCount)
      .slice(0, 3);

    // Inactive contributors (>30 days)
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const inactiveContributors = contributors.filter(c => {
      if (!c.lastCommitDate) return false;
      return new Date(c.lastCommitDate).getTime() < thirtyDaysAgo;
    });

    // Total additions and deletions
    const totalAdditions = contributors.reduce(
      (sum, c) => sum + c.additions,
      0
    );
    const totalDeletions = contributors.reduce(
      (sum, c) => sum + c.deletions,
      0
    );
    const addRemoveRatio =
      totalDeletions > 0 ? totalAdditions / totalDeletions : totalAdditions;

    // Most productive contributor (by net lines)
    const mostProductive = contributors.reduce(
      (max, c) => (c.netLines > max.netLines ? c : max),
      contributors[0] || { netLines: 0, name: "Unknown" }
    );

    // Average commits per contributor
    const avgCommits =
      metadata.totalContributors > 0
        ? Math.round(metadata.totalCommits / metadata.totalContributors)
        : 0;

    // Development span
    const startDate = metadata.dateRange.start
      ? new Date(metadata.dateRange.start)
      : null;
    const endDate = metadata.dateRange.end
      ? new Date(metadata.dateRange.end)
      : null;
    const developmentDays =
      startDate && endDate
        ? Math.floor(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        : 0;

    return {
      topByCommits,
      inactiveContributors,
      totalAdditions,
      totalDeletions,
      addRemoveRatio,
      mostProductive,
      avgCommits,
      developmentDays,
    };
  }, [contributors, metadata]);

  const generateMarkdownSummary = (): string => {
    const {
      topByCommits,
      inactiveContributors,
      totalAdditions,
      totalDeletions,
      addRemoveRatio,
      mostProductive,
      avgCommits,
      developmentDays,
    } = insights;

    return `# Repository Analysis Summary

**Repository:** ${repoName}
**Branch:** ${branchName}
**Analysis Date:** ${formatDateShort(new Date().toISOString())}

## Overview

- **Total Commits:** ${formatNumber(metadata.totalCommits)}
- **Total Contributors:** ${metadata.totalContributors}
- **Development Period:** ${formatDateShort(
      metadata.dateRange.start
    )} to ${formatDateShort(metadata.dateRange.end)} (${developmentDays} days)
- **Average Commits per Contributor:** ${avgCommits}

## Code Changes

- **Total Lines Added:** ${formatNumber(totalAdditions)}
- **Total Lines Deleted:** ${formatNumber(totalDeletions)}
- **Net Change:** ${formatSignedNumber(totalAdditions - totalDeletions)} lines
- **Add/Remove Ratio:** ${addRemoveRatio.toFixed(2)}:1

## Top Contributors

${topByCommits
  .map(
    (c, i) => `${i + 1}. **${c.githubLogin || c.name}**
   - Commits: ${formatNumber(c.commitCount)}
   - Lines Added: ${formatNumber(c.additions)}
   - Lines Removed: ${formatNumber(c.deletions)}
   - Net Contribution: ${formatSignedNumber(c.netLines)} lines
   - Active Days: ${c.activeDays}
`
  )
  .join("\n")}

## Key Insights

### Most Productive Contributor
**${
      mostProductive.githubLogin || mostProductive.name
    }** leads with ${formatSignedNumber(
      mostProductive.netLines
    )} net lines contributed.

### Team Activity
${
  inactiveContributors.length === 0
    ? "All contributors have been active within the last 30 days."
    : `${
        inactiveContributors.length
      } contributor(s) have been inactive for more than 30 days:\n${inactiveContributors
        .slice(0, 5)
        .map(
          c =>
            `- ${c.githubLogin || c.name} (last active: ${formatDateShort(
              c.lastCommitDate
            )})`
        )
        .join("\n")}`
}

### Development Patterns
- **Code Growth:** ${
      addRemoveRatio > 2
        ? "Rapidly expanding codebase"
        : addRemoveRatio > 1
        ? "Moderate growth with some refactoring"
        : "Heavy refactoring or code cleanup"
    }
- **Collaboration:** ${
      metadata.totalContributors > 5
        ? "Large team collaboration"
        : metadata.totalContributors > 2
        ? "Small team collaboration"
        : "Individual or pair development"
    }
- **Commit Frequency:** ${
      avgCommits > 50
        ? "High activity per contributor"
        : avgCommits > 20
        ? "Moderate activity"
        : "Low activity or focused contributors"
    }

## Recommendations

${
  inactiveContributors.length > 0
    ? "- Review inactive contributors and assess knowledge transfer needs\n"
    : ""
}${
      addRemoveRatio < 0.5
        ? "- Significant code removal detected; ensure documentation is updated\n"
        : ""
    }${
      metadata.totalContributors > 10
        ? "- Consider code review processes for large team\n"
        : ""
    }${
      avgCommits < 10
        ? "- Low average commits may indicate blocked contributors or large commit strategy\n"
        : ""
    }

---
*Generated by GitHub Contribution Dashboard*
`;
  };

  const handleDownloadSummary = () => {
    const summary = generateMarkdownSummary();
    const blob = new Blob([summary], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${repoName.replace("/", "-")}-${branchName}-summary.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Manager Summary</CardTitle>
          <Button
            onClick={handleDownloadSummary}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <GitCommit className="w-5 h-5 text-blue-600" />
              <h4 className="text-sm font-medium text-blue-900">
                Total Commits
              </h4>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {formatNumber(metadata.totalCommits)}
            </p>
          </div>

          <div className="bg-teal-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-teal-600" />
              <h4 className="text-sm font-medium text-teal-900">
                Contributors
              </h4>
            </div>
            <p className="text-2xl font-bold text-teal-900">
              {metadata.totalContributors}
            </p>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h4 className="text-sm font-medium text-green-900">Net Lines</h4>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {formatSignedNumber(
                insights.totalAdditions - insights.totalDeletions
              )}
            </p>
          </div>

          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <h4 className="text-sm font-medium text-orange-900">Inactive</h4>
            </div>
            <p className="text-2xl font-bold text-orange-900">
              {insights.inactiveContributors.length}
            </p>
          </div>
        </div>

        {/* Narrative Summary */}
        <div className="prose prose-sm max-w-none">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Executive Summary
          </h3>
          <p className="text-gray-700 mb-4">
            Analysis of <strong>{repoName}</strong> (branch: {branchName})
            reveals <strong>{metadata.totalCommits}</strong> commits from{" "}
            <strong>{metadata.totalContributors}</strong> contributors over{" "}
            <strong>{insights.developmentDays}</strong> days.
          </p>

          <h4 className="text-base font-semibold text-gray-900 mb-2">
            Top Contributors
          </h4>
          <ul className="list-disc list-inside space-y-1 mb-4">
            {insights.topByCommits.map((c, i) => (
              <li key={i} className="text-gray-700">
                <strong>{c.githubLogin || c.name}</strong>:{" "}
                {formatNumber(c.commitCount)} commits,{" "}
                {formatSignedNumber(c.netLines)} net lines
              </li>
            ))}
          </ul>

          <h4 className="text-base font-semibold text-gray-900 mb-2">
            Activity Status
          </h4>
          <p className="text-gray-700 mb-4">
            {insights.inactiveContributors.length === 0 ? (
              <span className="text-green-600">
                ✓ All contributors active in last 30 days
              </span>
            ) : (
              <span className="text-orange-600">
                ⚠ {insights.inactiveContributors.length} contributor(s) inactive
                &gt;30 days
              </span>
            )}
          </p>

          <h4 className="text-base font-semibold text-gray-900 mb-2">
            Code Patterns
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="bg-gradient-to-br from-sky-50 to-cyan-50 rounded-lg p-3 border border-sky-100">
              <p className="text-xs font-medium text-blue-900 mb-1">
                Add/Remove Ratio
              </p>
              <p className="text-2xl font-bold text-blue-700 mb-1">
                {insights.addRemoveRatio.toFixed(2)}:1
              </p>
              <p className="text-xs text-blue-600">
                {insights.addRemoveRatio > 2
                  ? "Rapid expansion"
                  : insights.addRemoveRatio > 1
                  ? "Balanced growth"
                  : "Heavy refactoring"}
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-100">
              <p className="text-xs font-medium text-amber-900 mb-1">
                Avg Commits/Dev
              </p>
              <p className="text-2xl font-bold text-orange-700 mb-1">
                {insights.avgCommits}
              </p>
              <p className="text-xs text-amber-600">
                {insights.avgCommits > 50
                  ? "High activity"
                  : insights.avgCommits > 20
                  ? "Moderate activity"
                  : "Focused work"}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-100">
              <p className="text-xs font-medium text-green-900 mb-1">
                Code Churn Rate
              </p>
              <p className="text-2xl font-bold text-green-700 mb-1">
                {insights.totalAdditions > 0
                  ? (
                      (insights.totalDeletions / insights.totalAdditions) *
                      100
                    ).toFixed(0)
                  : 0}
                %
              </p>
              <p className="text-xs text-green-600">
                {insights.totalAdditions > 0 &&
                insights.totalDeletions / insights.totalAdditions > 0.5
                  ? "High churn"
                  : insights.totalAdditions > 0 &&
                    insights.totalDeletions / insights.totalAdditions > 0.2
                  ? "Normal churn"
                  : "Low churn"}
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-3 border border-orange-100">
              <p className="text-xs font-medium text-orange-900 mb-1">
                Dev Velocity
              </p>
              <p className="text-2xl font-bold text-orange-700 mb-1">
                {insights.developmentDays > 0
                  ? (metadata.totalCommits / insights.developmentDays).toFixed(
                      1
                    )
                  : 0}
              </p>
              <p className="text-xs text-orange-600">commits/day</p>
            </div>
          </div>

          <p className="text-sm text-gray-600 italic">
            💡 The add/remove ratio of{" "}
            <strong>{insights.addRemoveRatio.toFixed(2)}:1</strong> indicates{" "}
            {insights.addRemoveRatio > 2
              ? "rapid codebase expansion with minimal refactoring."
              : insights.addRemoveRatio > 1
              ? "healthy growth with balanced refactoring."
              : "significant refactoring or code cleanup activity."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
