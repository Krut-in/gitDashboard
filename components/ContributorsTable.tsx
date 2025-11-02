/**
 * Contributors Table Component
 *
 * Displays a sortable table of repository contributors with their statistics.
 * Highlights inactive contributors (>30 days since last commit).
 * Supports sorting by various metrics like commits, lines added/removed, etc.
 */

"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { ArrowUpDown, ArrowUp, ArrowDown, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import {
  formatNumber,
  formatSignedNumber,
  formatDateShort,
  getActivityStatus,
} from "@/lib/format";

interface Contributor {
  name: string;
  email: string | null;
  githubId: number | null;
  githubLogin: string | null;
  avatarUrl: string | null;
  commitCount: number;
  additions: number;
  deletions: number;
  netLines: number;
  firstCommitDate: string | null;
  lastCommitDate: string | null;
  activeDays: number;
  isMergeCommitter: boolean;
}

interface ContributorsTableProps {
  contributors: Contributor[];
}

type SortField =
  | "name"
  | "commitCount"
  | "additions"
  | "deletions"
  | "netLines"
  | "activeDays"
  | "lastCommitDate";
type SortDirection = "asc" | "desc";

export function ContributorsTable({ contributors }: ContributorsTableProps) {
  const [sortField, setSortField] = useState<SortField>("commitCount");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const sortedContributors = useMemo(() => {
    return [...contributors].sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      // Handle null values
      if (aValue === null)
        aValue = sortDirection === "asc" ? Infinity : -Infinity;
      if (bValue === null)
        bValue = sortDirection === "asc" ? Infinity : -Infinity;

      // Handle date strings
      if (sortField === "lastCommitDate") {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }

      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [contributors, sortField, sortDirection]);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="w-4 h-4 text-primary" />
    ) : (
      <ArrowDown className="w-4 h-4 text-primary" />
    );
  }

  const inactiveCount = contributors.filter(c => {
    if (!c.lastCommitDate) return false;
    const daysSince = Math.floor(
      (Date.now() - new Date(c.lastCommitDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    return daysSince > 30;
  }).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Contributors ({contributors.length})</CardTitle>
          {inactiveCount > 0 && (
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <AlertCircle className="w-4 h-4" />
              <span>{inactiveCount} inactive (&gt;30 days)</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-700">
                  Contributor
                </th>
                <th
                  className="text-right py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("commitCount")}
                >
                  <div className="flex items-center justify-end gap-2">
                    Commits
                    <SortIcon field="commitCount" />
                  </div>
                </th>
                <th
                  className="text-right py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("additions")}
                >
                  <div className="flex items-center justify-end gap-2">
                    Added
                    <SortIcon field="additions" />
                  </div>
                </th>
                <th
                  className="text-right py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("deletions")}
                >
                  <div className="flex items-center justify-end gap-2">
                    Removed
                    <SortIcon field="deletions" />
                  </div>
                </th>
                <th
                  className="text-right py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("netLines")}
                >
                  <div className="flex items-center justify-end gap-2">
                    Net Lines
                    <SortIcon field="netLines" />
                  </div>
                </th>
                <th
                  className="text-right py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("activeDays")}
                >
                  <div className="flex items-center justify-end gap-2">
                    Active Days
                    <SortIcon field="activeDays" />
                  </div>
                </th>
                <th
                  className="text-left py-3 px-4 font-medium text-gray-700 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort("lastCommitDate")}
                >
                  <div className="flex items-center gap-2">
                    Last Commit
                    <SortIcon field="lastCommitDate" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedContributors.map((contributor, index) => {
                const activity = getActivityStatus(contributor.lastCommitDate);
                const isInactive = activity.status === "inactive";

                return (
                  <tr
                    key={index}
                    className={`border-b hover:bg-gray-50 ${
                      isInactive ? "bg-orange-50" : ""
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {contributor.avatarUrl ? (
                          <Image
                            src={contributor.avatarUrl}
                            alt={contributor.name}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-medium">
                            {contributor.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">
                            {contributor.githubLogin || contributor.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {contributor.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {formatNumber(contributor.commitCount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-teal-600">
                      +{formatNumber(contributor.additions)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-red-600">
                      -{formatNumber(contributor.deletions)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      {formatSignedNumber(contributor.netLines)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {contributor.activeDays}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={activity.color}>
                          {formatDateShort(contributor.lastCommitDate)}
                        </span>
                        {isInactive && (
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
