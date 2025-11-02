/**
 * GitHub-Style Contribution Heatmap Component
 *
 * Displays a 7x26 grid showing contributions over 6 months:
 * - Rows: Days of week (Sun-Sat)
 * - Columns: Weeks (approx 26 for 6 months)
 * - Color intensity based on activity level
 * - Month labels on top
 * - Weekday labels on left (Mon, Wed, Fri)
 * - Hover tooltip showing date and value
 * - Navigation buttons for previous/next 6 months
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
  colorScheme: "green" | "orange" | "red" | "amber";
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
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevious}
            disabled={!canGoPrev}
            className={`p-1 rounded hover:bg-gray-100 transition-colors ${
              !canGoPrev ? "opacity-30 cursor-not-allowed" : ""
            }`}
            title="Previous 6 months"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className={`p-1 rounded hover:bg-gray-100 transition-colors ${
              !canGoNext ? "opacity-30 cursor-not-allowed" : ""
            }`}
            title="Next 6 months"
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
                  const dateStr = date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });

                  return (
                    <div
                      key={dayIndex}
                      className={`${colorClass} border border-gray-200 rounded-sm cursor-pointer hover:ring-2 hover:ring-teal-400 transition-shadow`}
                      style={{
                        width: `${HEATMAP_CONFIG.CELL_SIZE}px`,
                        height: `${HEATMAP_CONFIG.CELL_SIZE}px`,
                      }}
                      title={`${dateStr}: ${value}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <span>Less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map(level => (
            <div
              key={level}
              className={`${getHeatmapColorClass(
                level,
                colorScheme
              )} border border-gray-200 rounded-sm`}
              style={{
                width: `${HEATMAP_CONFIG.CELL_SIZE}px`,
                height: `${HEATMAP_CONFIG.CELL_SIZE}px`,
              }}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
