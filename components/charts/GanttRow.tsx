/**
 * Gantt Chart Row Component
 *
 * Renders a single user's timeline row with color-coded cells
 * - Each cell represents activity on a specific day
 * - Color intensity based on metric value
 * - Hover interaction for tooltip
 */

"use client";

import { useMemo } from "react";
import {
  getColorIntensity,
  getMetricColor,
  createDateValueMap,
  isUserInactive,
} from "@/lib/gantt-utils";
import type { UserTimelineData } from "@/lib/types";
import type { MetricType } from "@/lib/constants";

interface GanttRowProps {
  user: UserTimelineData;
  dates: string[];
  metric: MetricType;
  cellWidth: number;
  cellHeight: number;
  onCellHover: (
    date: string,
    value: number,
    userName: string,
    x: number,
    y: number
  ) => void;
  onCellLeave: () => void;
}

export function GanttRow({
  user,
  dates,
  metric,
  cellWidth,
  cellHeight,
  onCellHover,
  onCellLeave,
}: GanttRowProps) {
  // Create map for efficient lookups
  const dateValueMap = useMemo(
    () => createDateValueMap(user.dailyMetrics, metric),
    [user.dailyMetrics, metric]
  );

  const inactive = isUserInactive(user);

  // Filter dates to only show dates within user's active period
  const userStartDate = new Date(user.firstCommitDate);
  const userEndDate = new Date(user.lastCommitDate);

  const handleCellMouseEnter = (
    date: string,
    value: number,
    event: React.MouseEvent
  ) => {
    if (value > 0) {
      onCellHover(date, value, user.userName, event.clientX, event.clientY);
    }
  };

  return (
    <div className="flex items-center border-b border-gray-200">
      {/* User Info (Fixed) */}
      <div
        className="flex-shrink-0 px-4 py-2 backdrop-blur-md bg-white/50 border-r border-gray-200 sticky left-0 z-10"
        style={{ width: "200px", height: `${cellHeight}px` }}
      >
        <div className="flex items-center gap-2">
          {user.avatarUrl && (
            <img
              src={user.avatarUrl}
              alt={user.userName}
              className="w-6 h-6 rounded-full"
            />
          )}
          <span
            className={`text-sm font-medium truncate ${
              inactive ? "text-gray-400" : "text-gray-900"
            }`}
            title={user.userName}
          >
            {user.userName}
          </span>
          {inactive && (
            <span
              className="text-xs text-gray-400"
              title="No activity in last 30 days"
            >
              ⏸
            </span>
          )}
        </div>
      </div>

      {/* Timeline Cells */}
      <div className="flex">
        {dates.map((date, index) => {
          const dateObj = new Date(date);
          const isInUserRange =
            dateObj >= userStartDate && dateObj <= userEndDate;

          const value = dateValueMap.get(date) || 0;
          const intensity = value > 0 ? getColorIntensity(value, metric) : 0;
          const backgroundColor =
            isInUserRange && value > 0
              ? getMetricColor(metric, intensity)
              : isInUserRange
              ? "rgba(245, 245, 245, 1)"
              : "rgba(255, 255, 255, 1)";

          return (
            <div
              key={index}
              className="border-r border-gray-100 hover:ring-2 hover:ring-purple-400 transition-shadow cursor-pointer"
              style={{
                width: `${cellWidth}px`,
                height: `${cellHeight}px`,
                backgroundColor,
              }}
              onMouseEnter={e => handleCellMouseEnter(date, value, e)}
              onMouseLeave={onCellLeave}
              title={`${date}: ${value}`}
            />
          );
        })}
      </div>
    </div>
  );
}
