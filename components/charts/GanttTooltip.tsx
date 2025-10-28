/**
 * Gantt Chart Tooltip Component
 *
 * Displays detailed information on hover:
 * - Date
 * - Metric value
 * - User name
 */

"use client";

import { formatDateForTooltip } from "@/lib/gantt-utils";
import { METRICS, type MetricType } from "@/lib/constants";

interface GanttTooltipProps {
  visible: boolean;
  x: number;
  y: number;
  date: string;
  value: number;
  userName: string;
  metric: MetricType;
}

const metricLabels: Record<MetricType, string> = {
  [METRICS.COMMITS]: "Commits",
  [METRICS.ADDITIONS]: "Lines Added",
  [METRICS.DELETIONS]: "Lines Removed",
  [METRICS.NET_LINES]: "Net Lines",
};

export function GanttTooltip({
  visible,
  x,
  y,
  date,
  value,
  userName,
  metric,
}: GanttTooltipProps) {
  if (!visible) return null;

  const formattedDate = formatDateForTooltip(date);
  const metricLabel = metricLabels[metric];
  const valueDisplay =
    metric === METRICS.NET_LINES && value >= 0
      ? `+${value.toLocaleString()}`
      : value.toLocaleString();

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{
        left: `${x + 10}px`,
        top: `${y - 10}px`,
        transform: "translateY(-100%)",
      }}
    >
      <div className="backdrop-blur-md bg-gray-900/90 text-white px-3 py-2 rounded-lg shadow-lg border border-white/10">
        <div className="text-xs font-semibold mb-1">{userName}</div>
        <div className="text-xs text-gray-300">{formattedDate}</div>
        <div className="text-sm font-bold mt-1">
          {metricLabel}: {valueDisplay}
        </div>
      </div>
    </div>
  );
}
