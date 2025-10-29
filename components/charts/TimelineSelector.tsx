/**
 * Timeline Range Selector Component
 *
 * Toggle component for selecting time range granularity:
 * - Year, Quarter, Month, Week
 */

"use client";

import { TIME_RANGES, type TimeRange } from "@/lib/constants";

interface TimelineSelectorProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  className?: string;
}

const rangeLabels: Record<TimeRange, string> = {
  [TIME_RANGES.YEAR]: "Year",
  [TIME_RANGES.QUARTER]: "Quarter",
  [TIME_RANGES.MONTH]: "Month",
  [TIME_RANGES.WEEK]: "Week",
};

export function TimelineSelector({
  selectedRange,
  onRangeChange,
  className = "",
}: TimelineSelectorProps) {
  const ranges: TimeRange[] = [
    TIME_RANGES.YEAR,
    TIME_RANGES.QUARTER,
    TIME_RANGES.MONTH,
    TIME_RANGES.WEEK,
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-gray-700">Time Range:</span>
      <div className="inline-flex rounded-lg backdrop-blur-md bg-white/50 border border-white/30 p-1">
        {ranges.map(range => (
          <button
            key={range}
            onClick={() => onRangeChange(range)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
              selectedRange === range
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                : "text-gray-700 hover:text-gray-900 hover:bg-white/60"
            }`}
          >
            {rangeLabels[range]}
          </button>
        ))}
      </div>
    </div>
  );
}
