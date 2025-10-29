/**
 * Lines Changed Timeline Chart
 *
 * Displays lines added, removed, and net lines over time:
 * - Green line: Lines added
 * - Red line: Lines removed
 * - Pink area: Net lines (filled area chart)
 * - Time range toggle
 * - Dual Y-axis if needed for scale differences
 */

"use client";

import { useState, useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { TimelineSelector } from "./TimelineSelector";
import { aggregateTimeline } from "@/lib/aggregation";
import {
  METRIC_COLORS,
  DEFAULT_TIME_RANGE,
  type TimeRange,
} from "@/lib/constants";
import type { DailyMetric } from "@/lib/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LinesChangedTimelineProps {
  dailyMetrics: DailyMetric[];
}

export function LinesChangedTimeline({
  dailyMetrics,
}: LinesChangedTimelineProps) {
  const [selectedRange, setSelectedRange] =
    useState<TimeRange>(DEFAULT_TIME_RANGE);

  // Track visibility of each data series - Net Lines hidden by default
  const [visibleLines, setVisibleLines] = useState({
    added: true,
    deleted: true,
    net: false,
  });

  // Aggregate data based on selected time range
  const aggregatedData = useMemo(() => {
    if (dailyMetrics.length === 0) return [];
    return aggregateTimeline(dailyMetrics, selectedRange);
  }, [dailyMetrics, selectedRange]);

  // Toggle visibility of a data series
  const handleLegendClick = (dataKey: "added" | "deleted" | "net") => {
    setVisibleLines(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey],
    }));
  };

  // Detect single data point for enhanced visibility
  const isSingleDataPoint = aggregatedData.length === 1;

  // Prepare chart data - only include visible datasets
  const chartData = useMemo(() => {
    const datasets = [];

    if (visibleLines.added) {
      datasets.push({
        label: "Lines Added",
        data: aggregatedData.map(d => d.additions),
        borderColor: METRIC_COLORS.additions.hex,
        backgroundColor: METRIC_COLORS.additions.rgba(0.05),
        fill: false,
        tension: 0.4,
        pointRadius: isSingleDataPoint ? 8 : 3,
        pointHoverRadius: isSingleDataPoint ? 10 : 5,
        pointBackgroundColor: METRIC_COLORS.additions.hex,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        yAxisID: "y",
      });
    }

    if (visibleLines.deleted) {
      datasets.push({
        label: "Lines Removed",
        data: aggregatedData.map(d => d.deletions),
        borderColor: METRIC_COLORS.deletions.hex,
        backgroundColor: METRIC_COLORS.deletions.rgba(0.05),
        fill: false,
        tension: 0.4,
        pointRadius: isSingleDataPoint ? 8 : 3,
        pointHoverRadius: isSingleDataPoint ? 10 : 5,
        pointBackgroundColor: METRIC_COLORS.deletions.hex,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        yAxisID: "y",
      });
    }

    if (visibleLines.net) {
      datasets.push({
        label: "Net Lines",
        data: aggregatedData.map(d => d.netLines),
        borderColor: METRIC_COLORS.netLines.hex,
        backgroundColor: METRIC_COLORS.netLines.rgba(0.2),
        fill: true,
        tension: 0.4,
        pointRadius: isSingleDataPoint ? 8 : 4,
        pointHoverRadius: isSingleDataPoint ? 10 : 6,
        pointBackgroundColor: METRIC_COLORS.netLines.hex,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        yAxisID: "y",
      });
    }

    return {
      labels: aggregatedData.map(d => d.label),
      datasets,
    };
  }, [aggregatedData, visibleLines, isSingleDataPoint]);

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        left: isSingleDataPoint ? 80 : 10,
        right: isSingleDataPoint ? 80 : 10,
        top: 10,
        bottom: 10,
      },
    },
    plugins: {
      legend: {
        display: false, // We'll use custom legend for better interactivity
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: "index" as const,
        intersect: false,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: {
          size: 14,
          weight: "bold",
        },
        bodyFont: {
          size: 13,
        },
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            return `${label}: ${
              value >= 0 ? "+" : ""
            }${value.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 45,
          minRotation: 0,
          font: {
            size: 11,
          },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: (value: number | string) => {
            const num = typeof value === "number" ? value : parseFloat(value);
            return num >= 0 ? `+${num.toLocaleString()}` : num.toLocaleString();
          },
        },
        title: {
          display: true,
          text: "Lines Changed",
          font: {
            size: 12,
            weight: "bold",
          },
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  };

  if (dailyMetrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lines Changed Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-8">
            No line change data available
          </p>
        </CardContent>
      </Card>
    );
  }

  const totalAdditions = aggregatedData.reduce(
    (sum, d) => sum + d.additions,
    0
  );
  const totalDeletions = aggregatedData.reduce(
    (sum, d) => sum + d.deletions,
    0
  );
  const totalNet = aggregatedData.reduce((sum, d) => sum + d.netLines, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle>Lines Changed Over Time</CardTitle>
          <TimelineSelector
            selectedRange={selectedRange}
            onRangeChange={setSelectedRange}
          />
        </div>
      </CardHeader>
      <CardContent>
        {/* Custom Interactive Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-4 pb-4 border-b border-gray-200">
          <button
            onClick={() => handleLegendClick("added")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 cursor-pointer ${
              visibleLines.added
                ? "opacity-100 hover:bg-gray-50"
                : "opacity-40 hover:opacity-60"
            }`}
            style={{
              textDecoration: visibleLines.added ? "none" : "line-through",
            }}
          >
            <span
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: METRIC_COLORS.additions.hex }}
            />
            <span className="text-sm font-medium text-gray-700">
              Lines Added
            </span>
          </button>

          <button
            onClick={() => handleLegendClick("deleted")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 cursor-pointer ${
              visibleLines.deleted
                ? "opacity-100 hover:bg-gray-50"
                : "opacity-40 hover:opacity-60"
            }`}
            style={{
              textDecoration: visibleLines.deleted ? "none" : "line-through",
            }}
          >
            <span
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: METRIC_COLORS.deletions.hex }}
            />
            <span className="text-sm font-medium text-gray-700">
              Lines Removed
            </span>
          </button>

          <button
            onClick={() => handleLegendClick("net")}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 cursor-pointer ${
              visibleLines.net
                ? "opacity-100 hover:bg-gray-50"
                : "opacity-40 hover:opacity-60"
            }`}
            style={{
              textDecoration: visibleLines.net ? "none" : "line-through",
            }}
          >
            <span
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: METRIC_COLORS.netLines.hex }}
            />
            <span className="text-sm font-medium text-gray-700">Net Lines</span>
          </button>
        </div>

        <div style={{ height: "400px" }}>
          <Line data={chartData} options={options} />
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="p-4 backdrop-blur-md bg-white/50 rounded-lg border border-white/30">
            <p className="text-sm text-gray-600 mb-2">Total Added</p>
            <p className="text-2xl font-bold text-metric-additions">
              +{totalAdditions.toLocaleString()}
            </p>
          </div>
          <div className="p-4 backdrop-blur-md bg-white/50 rounded-lg border border-white/30">
            <p className="text-sm text-gray-600 mb-2">Total Removed</p>
            <p className="text-2xl font-bold text-metric-deletions">
              -{totalDeletions.toLocaleString()}
            </p>
          </div>
          <div className="p-4 backdrop-blur-md bg-white/50 rounded-lg border border-white/30">
            <p className="text-sm text-gray-600 mb-2">Net Change</p>
            <p
              className={`text-2xl font-bold ${
                totalNet >= 0 ? "text-metric-net" : "text-metric-deletions"
              }`}
            >
              {totalNet >= 0 ? "+" : ""}
              {totalNet.toLocaleString()}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
