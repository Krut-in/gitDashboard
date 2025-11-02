/**
 * GitHub-Style Contribution Heatmap Component
 *
 * Displays a 7x26 grid showing contributions over 6 months:
 * - Rows: Days of week (Sun-Sat)
 * - Columns: Weeks (approx 26 for 6 months)
 * - Color intensity based on activity level (5 levels: 0-4)
 * - Month labels on top
 * - Weekday labels on left (Mon, Wed, Fri)
 * - Interactive hover tooltip with detailed date and count information
 * - Navigation buttons for previous/next 6 months with proper boundary checks
 * - Vibrant color schemes with progressive intensity shading
 */

"use client";

import { useState, useMemo } from "react";
import {
  generate6MonthGrid,
  getMonthLabels,
  createDateMap,
  getDateValue,
  getMaxValue,
  getHeatmapIntensity,
  getHeatmapColorClass,
  navigate6MonthWindow,
  canNavigate,
} from "@/lib/heatmap-utils";
import { HEATMAP_CONFIG } from "@/lib/constants";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ContributionHeatmapProps {
  title: string;
  dailyData: { date: string; count: number }[];
  colorScheme:
    | "green"
    | "orange"
    | "red"
    | "amber"
    | "teal"
    | "sky"
    | "purple"
    | "emerald";
  firstCommitDate: string;
  lastCommitDate: string;
}

const weekdayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

export function ContributionHeatmap({
  title,
  dailyData,
  colorScheme,
  firstCommitDate,
  lastCommitDate,
}: ContributionHeatmapProps) {
  const [endDate, setEndDate] = useState(new Date(lastCommitDate));

  // Generate grid for current 6-month window
  const grid = useMemo(() => generate6MonthGrid(endDate), [endDate]);

  // Create date map for efficient lookups
  const dateMap = useMemo(() => createDateMap(dailyData), [dailyData]);

  // Calculate max value for intensity normalization
  const maxValue = useMemo(() => getMaxValue(dailyData), [dailyData]);

  // Get month labels
  const monthLabels = useMemo(() => getMonthLabels(grid), [grid]);

  // Calculate date range for display
  const startDate = useMemo(() => {
    const start = new Date(endDate);
    start.setMonth(start.getMonth() - 6);
    return start;
  }, [endDate]);

  // Navigation handlers
  const handlePrevious = () => {
    if (canNavigate(endDate, "prev", firstCommitDate, lastCommitDate)) {
      setEndDate(navigate6MonthWindow(endDate, "prev"));
    }
  };

  const handleNext = () => {
    if (canNavigate(endDate, "next", firstCommitDate, lastCommitDate)) {
      setEndDate(navigate6MonthWindow(endDate, "next"));
    }
  };

  const canGoPrev = canNavigate(
    endDate,
    "prev",
    firstCommitDate,
    lastCommitDate
  );
  const canGoNext = canNavigate(
    endDate,
    "next",
    firstCommitDate,
    lastCommitDate
  );

  return (
    <div className="space-y-3">
      {/* Title and Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
          <span className="text-xs text-gray-500">
            {startDate.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}{" "}
            -{" "}
            {endDate.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-md p-1">
          <button
            onClick={handlePrevious}
            disabled={!canGoPrev}
            className={`p-1.5 rounded-md transition-all ${
              !canGoPrev
                ? "opacity-30 cursor-not-allowed bg-transparent"
                : "hover:bg-white hover:shadow-sm active:scale-95 text-gray-700 hover:text-gray-900"
            }`}
            title="Previous 6 months"
            aria-label="View previous 6 months"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className={`p-1.5 rounded-md transition-all ${
              !canGoNext
                ? "opacity-30 cursor-not-allowed bg-transparent"
                : "hover:bg-white hover:shadow-sm active:scale-95 text-gray-700 hover:text-gray-900"
            }`}
            title="Next 6 months"
            aria-label="View next 6 months"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="flex gap-1">
        {/* Weekday Labels */}
        <div className="flex flex-col gap-1 pr-2">
          {weekdayLabels.map((label, index) => (
            <div
              key={index}
              className="flex items-center justify-end text-xs text-gray-600"
              style={{ height: `${HEATMAP_CONFIG.CELL_SIZE}px` }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Grid Container */}
        <div className="flex-1">
          {/* Month Labels */}
          <div className="flex gap-1 mb-1 relative" style={{ height: "16px" }}>
            {monthLabels.map(({ label, weekIndex }) => (
              <div
                key={weekIndex}
                className="absolute text-xs text-gray-600 font-medium"
                style={{
                  left: `${
                    weekIndex *
                    (HEATMAP_CONFIG.CELL_SIZE + HEATMAP_CONFIG.CELL_GAP)
                  }px`,
                }}
              >
                {label}
              </div>
            ))}
          </div>

          {/* Grid Cells */}
          <div className="flex gap-1">
            {grid.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((date, dayIndex) => {
                  const value = getDateValue(dateMap, date);
                  const intensity = getHeatmapIntensity(value, maxValue);
                  const colorClass = getHeatmapColorClass(
                    intensity,
                    colorScheme
                  );

                  // Format date for display
                  const dateStr = date.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  // Determine metric label based on title
                  let metricLabel = "contributions";
                  if (title.includes("Commits")) metricLabel = "commits";
                  else if (title.includes("Added")) metricLabel = "lines added";
                  else if (title.includes("Removed"))
                    metricLabel = "lines removed";
                  else if (title.includes("Net")) metricLabel = "net lines";

                  // Create detailed tooltip
                  const tooltipText =
                    value === 0
                      ? `${dateStr}\nNo ${metricLabel}`
                      : `${dateStr}\n${value.toLocaleString()} ${metricLabel}`;

                  return (
                    <div
                      key={dayIndex}
                      className={`${colorClass} border border-gray-300 rounded-sm cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-blue-500 hover:scale-110 transition-all duration-150 relative group`}
                      style={{
                        width: `${HEATMAP_CONFIG.CELL_SIZE}px`,
                        height: `${HEATMAP_CONFIG.CELL_SIZE}px`,
                      }}
                      title={tooltipText}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-gray-600 pt-2">
        <span className="font-medium">Less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map(level => (
            <div
              key={level}
              className={`${getHeatmapColorClass(
                level,
                colorScheme
              )} border border-gray-300 rounded-sm transition-transform hover:scale-125`}
              style={{
                width: `${HEATMAP_CONFIG.CELL_SIZE}px`,
                height: `${HEATMAP_CONFIG.CELL_SIZE}px`,
              }}
              title={`Intensity level ${level}`}
            />
          ))}
        </div>
        <span className="font-medium">More</span>
      </div>
    </div>
  );
}
