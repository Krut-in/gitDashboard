/**
 * Enhanced Commits Timeline Chart
 *
 * Displays commits over time with:
 * - Time range toggle (Year/Quarter/Month/Week)
 * - Aggregated data based on selected range
 * - Full repository history
 * - Hover tooltips with top contributor
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
import { aggregateTimeline, getRecentTimeRange } from "@/lib/aggregation";
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

interface CommitsTimelineProps {
  dailyMetrics: DailyMetric[];
}

export function CommitsTimeline({ dailyMetrics }: CommitsTimelineProps) {
  const [selectedRange, setSelectedRange] =
    useState<TimeRange>(DEFAULT_TIME_RANGE);

  // Aggregate data based on selected time range
  const aggregatedData = useMemo(() => {
    if (dailyMetrics.length === 0) return [];
    return aggregateTimeline(dailyMetrics, selectedRange);
  }, [dailyMetrics, selectedRange]);

  // Prepare chart data
  const chartData = useMemo(() => {
    return {
      labels: aggregatedData.map(d => d.label),
      datasets: [
        {
          label: "Commits",
          data: aggregatedData.map(d => d.commits),
          borderColor: METRIC_COLORS.commits.hex,
          backgroundColor: METRIC_COLORS.commits.rgba(0.1),
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: METRIC_COLORS.commits.hex,
          pointBorderColor: "#fff",
          pointBorderWidth: 2,
        },
      ],
    };
  }, [aggregatedData]);

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
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
            const dataIndex = context.dataIndex;
            const item = aggregatedData[dataIndex];
            const lines = [`Commits: ${item.commits}`];

            if (item.topContributor) {
              lines.push(`Top Contributor: ${item.topContributor}`);
            }

            return lines;
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
          stepSize: 1,
          font: {
            size: 11,
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
          <CardTitle>Commits Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-8">
            No commit data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <CardTitle>Commits Over Time</CardTitle>
          <TimelineSelector
            selectedRange={selectedRange}
            onRangeChange={setSelectedRange}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height: "400px" }}>
          <Line data={chartData} options={options} />
        </div>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="p-3 backdrop-blur-md bg-white/50 rounded-lg border border-white/30">
            <p className="text-sm text-gray-600">Total Commits</p>
            <p className="text-2xl font-bold text-metric-commits">
              {aggregatedData.reduce((sum, d) => sum + d.commits, 0)}
            </p>
          </div>
          <div className="p-3 backdrop-blur-md bg-white/50 rounded-lg border border-white/30">
            <p className="text-sm text-gray-600">Periods</p>
            <p className="text-2xl font-bold text-gray-900">
              {aggregatedData.length}
            </p>
          </div>
          <div className="p-3 backdrop-blur-md bg-white/50 rounded-lg border border-white/30">
            <p className="text-sm text-gray-600">Avg per Period</p>
            <p className="text-2xl font-bold text-gray-900">
              {aggregatedData.length > 0
                ? Math.round(
                    aggregatedData.reduce((sum, d) => sum + d.commits, 0) /
                      aggregatedData.length
                  )
                : 0}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
