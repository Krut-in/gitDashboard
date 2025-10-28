/**
 * Metric Type Toggle Component
 *
 * Toggle for switching between different metrics:
 * - Commits, Additions, Deletions, Net Lines
 */

"use client";

import { METRICS, METRIC_COLORS, type MetricType } from "@/lib/constants";

interface MetricToggleProps {
  selectedMetric: MetricType;
  onMetricChange: (metric: MetricType) => void;
  availableMetrics?: MetricType[];
  className?: string;
}

const metricLabels: Record<MetricType, string> = {
  [METRICS.COMMITS]: "Commits",
  [METRICS.ADDITIONS]: "Lines Added",
  [METRICS.DELETIONS]: "Lines Removed",
  [METRICS.NET_LINES]: "Net Lines",
};

const metricColors: Record<MetricType, string> = {
  [METRICS.COMMITS]: METRIC_COLORS.commits.hex,
  [METRICS.ADDITIONS]: METRIC_COLORS.additions.hex,
  [METRICS.DELETIONS]: METRIC_COLORS.deletions.hex,
  [METRICS.NET_LINES]: METRIC_COLORS.netLines.hex,
};

export function MetricToggle({
  selectedMetric,
  onMetricChange,
  availableMetrics,
  className = "",
}: MetricToggleProps) {
  const metrics = availableMetrics || [
    METRICS.COMMITS,
    METRICS.ADDITIONS,
    METRICS.DELETIONS,
    METRICS.NET_LINES,
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-gray-700">Metric:</span>
      <div className="inline-flex flex-wrap gap-2">
        {metrics.map(metric => (
          <button
            key={metric}
            onClick={() => onMetricChange(metric)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all border-2 ${
              selectedMetric === metric
                ? "text-white shadow-md"
                : "bg-white/50 backdrop-blur-md text-gray-700 hover:text-gray-900 hover:bg-white/80"
            }`}
            style={{
              backgroundColor:
                selectedMetric === metric ? metricColors[metric] : undefined,
              borderColor:
                selectedMetric === metric
                  ? metricColors[metric]
                  : "rgba(255, 255, 255, 0.3)",
            }}
          >
            {metricLabels[metric]}
          </button>
        ))}
      </div>
    </div>
  );
}
