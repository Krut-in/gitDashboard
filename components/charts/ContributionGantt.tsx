/**
 * Contribution Gantt Chart Component
 *
 * Interactive Gantt chart showing user contribution timelines:
 * - Users on Y-axis (sorted by first commit date)
 * - Time on X-axis (from first to last commit)
 * - Color intensity based on daily activity
 * - Toggle between metrics (commits, additions, deletions, net lines)
 * - Scrollable horizontally and vertically
 */

"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { TimelineSelector } from "./TimelineSelector";
import { MetricToggle } from "./MetricToggle";
import { GanttRow } from "./GanttRow";
import { GanttTooltip } from "./GanttTooltip";
import {
  generateDateRange,
  sortUsersByJoinDate,
  calculateCellDimensions,
} from "@/lib/gantt-utils";
import { getRecentTimeRange } from "@/lib/aggregation";
import {
  DEFAULT_TIME_RANGE,
  METRICS,
  type TimeRange,
  type MetricType,
} from "@/lib/constants";
import type { RepositoryTimeline } from "@/lib/types";

interface ContributionGanttProps {
  timeline: RepositoryTimeline;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  date: string;
  value: number;
  userName: string;
}

export function ContributionGantt({ timeline }: ContributionGanttProps) {
  const [selectedRange, setSelectedRange] =
    useState<TimeRange>(DEFAULT_TIME_RANGE);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>(
    METRICS.COMMITS
  );
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    date: "",
    value: 0,
    userName: "",
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1000);

  useEffect(() => {
    if (containerRef.current) {
      const updateWidth = () => {
        if (containerRef.current) {
          setContainerWidth(containerRef.current.offsetWidth - 200); // Subtract user info width
        }
      };

      updateWidth();
      window.addEventListener("resize", updateWidth);
      return () => window.removeEventListener("resize", updateWidth);
    }
  }, []);

  // Sort users by join date
  const sortedUsers = useMemo(
    () => sortUsersByJoinDate(timeline.users),
    [timeline.users]
  );

  // Get date range based on selected time range
  const dateRange = useMemo(() => {
    const recent = getRecentTimeRange(
      selectedRange === "year"
        ? 12
        : selectedRange === "quarter"
        ? 3
        : selectedRange === "month"
        ? 1
        : 0.25
    );

    // Use repository date range if available, otherwise use recent
    const startDate =
      timeline.repoFirstCommit < recent.startDate
        ? recent.startDate
        : timeline.repoFirstCommit;
    const endDate = timeline.repoLastCommit;

    return {
      startDate,
      endDate,
    };
  }, [timeline, selectedRange]);

  // Generate all dates in range
  const allDates = useMemo(
    () => generateDateRange(dateRange.startDate, dateRange.endDate, 1),
    [dateRange]
  );

  // Calculate cell dimensions
  const { cellWidth, cellHeight } = useMemo(
    () => calculateCellDimensions(allDates.length, containerWidth),
    [allDates.length, containerWidth]
  );

  const handleCellHover = (
    date: string,
    value: number,
    userName: string,
    x: number,
    y: number
  ) => {
    setTooltip({
      visible: true,
      x,
      y,
      date,
      value,
      userName,
    });
  };

  const handleCellLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  if (timeline.users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contribution Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-8">
            No contributor data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          <CardTitle>Contribution Timeline</CardTitle>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <TimelineSelector
              selectedRange={selectedRange}
              onRangeChange={setSelectedRange}
            />

            <MetricToggle
              selectedMetric={selectedMetric}
              onMetricChange={setSelectedMetric}
            />
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
              <span>No activity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-metric-commits/30 border border-gray-300 rounded"></div>
              <span>Low activity</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-metric-commits border border-gray-300 rounded"></div>
              <span>High activity</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div
          ref={containerRef}
          className="relative overflow-x-auto overflow-y-auto max-h-[600px] border border-gray-200 rounded-lg"
        >
          {/* Date Header */}
          <div className="flex sticky top-0 z-20 bg-white border-b border-gray-200">
            <div
              className="flex-shrink-0 px-4 py-2 backdrop-blur-md bg-white/90 border-r border-gray-200 sticky left-0 z-30 font-semibold text-sm"
              style={{ width: "200px" }}
            >
              Contributors ({sortedUsers.length})
            </div>
            <div className="flex">
              {allDates.map((date, index) => {
                const dateObj = new Date(date);
                const isFirstOfMonth = dateObj.getDate() === 1;

                return (
                  <div
                    key={index}
                    className={`border-r border-gray-100 flex items-center justify-center text-xs ${
                      isFirstOfMonth ? "font-semibold" : "text-gray-400"
                    }`}
                    style={{
                      width: `${cellWidth}px`,
                      height: "32px",
                      writingMode: cellWidth < 12 ? "vertical-rl" : undefined,
                      fontSize: cellWidth < 12 ? "10px" : undefined,
                    }}
                  >
                    {isFirstOfMonth
                      ? dateObj.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : cellWidth >= 15
                      ? dateObj.getDate()
                      : ""}
                  </div>
                );
              })}
            </div>
          </div>

          {/* User Rows */}
          {sortedUsers.map(user => (
            <GanttRow
              key={user.userId}
              user={user}
              dates={allDates}
              metric={selectedMetric}
              cellWidth={cellWidth}
              cellHeight={cellHeight}
              onCellHover={handleCellHover}
              onCellLeave={handleCellLeave}
            />
          ))}
        </div>

        {/* Tooltip */}
        <GanttTooltip
          visible={tooltip.visible}
          x={tooltip.x}
          y={tooltip.y}
          date={tooltip.date}
          value={tooltip.value}
          userName={tooltip.userName}
          metric={selectedMetric}
        />

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-4 gap-4 text-center">
          <div className="p-3 backdrop-blur-md bg-white/50 rounded-lg border border-white/30">
            <p className="text-sm text-gray-600">Total Contributors</p>
            <p className="text-2xl font-bold text-gray-900">
              {sortedUsers.length}
            </p>
          </div>
          <div className="p-3 backdrop-blur-md bg-white/50 rounded-lg border border-white/30">
            <p className="text-sm text-gray-600">Total Commits</p>
            <p className="text-2xl font-bold text-metric-commits">
              {timeline.totalCommits.toLocaleString()}
            </p>
          </div>
          <div className="p-3 backdrop-blur-md bg-white/50 rounded-lg border border-white/30">
            <p className="text-sm text-gray-600">Lines Added</p>
            <p className="text-2xl font-bold text-metric-additions">
              +{timeline.totalAdditions.toLocaleString()}
            </p>
          </div>
          <div className="p-3 backdrop-blur-md bg-white/50 rounded-lg border border-white/30">
            <p className="text-sm text-gray-600">Net Change</p>
            <p
              className={`text-2xl font-bold ${
                timeline.totalNetLines >= 0
                  ? "text-metric-net"
                  : "text-metric-deletions"
              }`}
            >
              {timeline.totalNetLines >= 0 ? "+" : ""}
              {timeline.totalNetLines.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
