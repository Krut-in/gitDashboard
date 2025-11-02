/**
 * User Contribution Card Component
 *
 * Individual user card with collapsible content:
 * - Summary (always visible): Avatar, Name, Stats, Date range
 * - Expanded content: 4 heatmaps + weekly bar chart
 * - Click to expand/collapse
 */

"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { ContributionHeatmap } from "./charts/ContributionHeatmap";
import { UserWeeklyBarChart } from "./charts/UserWeeklyBarChart";
import type { UserContribution } from "@/lib/types";

interface UserContributionCardProps {
  user: UserContribution;
  isExpanded: boolean;
  onToggle: () => void;
}

export function UserContributionCard({
  user,
  isExpanded,
  onToggle,
}: UserContributionCardProps) {
  const { lifetimeStats } = user;

  return (
    <div className="border border-gray-200 rounded-lg backdrop-blur-md bg-white/50 overflow-hidden">
      {/* Summary Card (Always Visible) */}
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/60 transition-colors"
      >
        <div className="flex items-center gap-4">
          {/* Avatar */}
          {user.avatarUrl && (
            <img
              src={user.avatarUrl}
              alt={user.userName}
              className="w-12 h-12 rounded-full border-2 border-white shadow-md"
            />
          )}

          {/* User Info */}
          <div className="text-left">
            <h3 className="text-lg font-bold text-gray-900">{user.userName}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
              <span className="font-medium">
                {lifetimeStats.commits} commits
              </span>
              <span className="text-metric-additions">
                +{lifetimeStats.additions.toLocaleString()}
              </span>
              <span className="text-metric-deletions">
                -{lifetimeStats.deletions.toLocaleString()}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date(lifetimeStats.firstCommit).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
              →{" "}
              {new Date(lifetimeStats.lastCommit).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
        </div>

        {/* Expand/Collapse Icon */}
        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronDown className="w-6 h-6 text-gray-600" />
          ) : (
            <ChevronRight className="w-6 h-6 text-gray-600" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-6 py-6 border-t border-gray-200 space-y-8 bg-white/30">
          {/* Heatmaps Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Commits Heatmap */}
            <div className="p-4 backdrop-blur-md bg-white/50 rounded-lg border border-white/30">
              <ContributionHeatmap
                title="Commits"
                dailyData={user.dailyCommits}
                colorScheme="teal"
                firstCommitDate={lifetimeStats.firstCommit}
                lastCommitDate={lifetimeStats.lastCommit}
              />
            </div>

            {/* Lines Added Heatmap */}
            <div className="p-4 backdrop-blur-md bg-white/50 rounded-lg border border-white/30">
              <ContributionHeatmap
                title="Lines Added"
                dailyData={user.dailyAdditions}
                colorScheme="orange"
                firstCommitDate={lifetimeStats.firstCommit}
                lastCommitDate={lifetimeStats.lastCommit}
              />
            </div>

            {/* Lines Removed Heatmap */}
            <div className="p-4 backdrop-blur-md bg-white/50 rounded-lg border border-white/30">
              <ContributionHeatmap
                title="Lines Removed"
                dailyData={user.dailyDeletions}
                colorScheme="red"
                firstCommitDate={lifetimeStats.firstCommit}
                lastCommitDate={lifetimeStats.lastCommit}
              />
            </div>

            {/* Net Lines Heatmap */}
            <div className="p-4 backdrop-blur-md bg-white/50 rounded-lg border border-white/30">
              <ContributionHeatmap
                title="Net Lines"
                dailyData={user.dailyNetLines}
                colorScheme="amber"
                firstCommitDate={lifetimeStats.firstCommit}
                lastCommitDate={lifetimeStats.lastCommit}
              />
            </div>
          </div>

          {/* Weekly Bar Chart */}
          <div className="p-6 backdrop-blur-md bg-white/50 rounded-lg border border-white/30">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Weekly Activity
            </h4>
            <UserWeeklyBarChart
              weeklyStats={user.weeklyStats}
              firstCommit={lifetimeStats.firstCommit}
              lastCommit={lifetimeStats.lastCommit}
            />
          </div>
        </div>
      )}
    </div>
  );
}
