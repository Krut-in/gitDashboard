/**
 * User Weekly Bar Chart Component
 *
 * Displays weekly commits and net lines on a dual-axis bar chart:
 * - Y-axis (center): Week labels
 * - Negative Y-axis (left): Commits count (green bars)
 * - Positive Y-axis (right): Net lines (orange/pink bars)
 * - Covers user's lifetime (first to last commit)
 * - Hover tooltip with week details
 */

"use client";

import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { METRIC_COLORS } from "@/lib/constants";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface UserWeeklyBarChartProps {
  weeklyStats: { week: string; commits: number; netLines: number }[];
  firstCommit: string;
  lastCommit: string;
}

export function UserWeeklyBarChart({
  weeklyStats,
  firstCommit,
  lastCommit,
}: UserWeeklyBarChartProps) {
  // Prepare labels (show week start date)
  const labels = weeklyStats.map(w => {
    const date = new Date(w.week);
    return `Week of ${date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })}`;
  });

  // Prepare data
  const chartData = {
    labels,
    datasets: [
      {
        label: "Commits",
        data: weeklyStats.map(w => -w.commits), // Negative for left side
        backgroundColor: METRIC_COLORS.commits.rgba(0.8),
        borderColor: METRIC_COLORS.commits.hex,
        borderWidth: 1,
        barThickness: 20,
      },
      {
        label: "Net Lines",
        data: weeklyStats.map(w => w.netLines), // Positive for right side
        backgroundColor: METRIC_COLORS.netLines.rgba(0.8),
        borderColor: METRIC_COLORS.netLines.hex,
        borderWidth: 1,
        barThickness: 20,
      },
    ],
  };

  const options: any = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top" as const,
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        callbacks: {
          label: (context: any) => {
            const label = context.dataset.label || "";
            const value = Math.abs(context.parsed.x);

            if (label === "Commits") {
              return `Commits: ${value}`;
            } else {
              const netLines = context.parsed.x;
              return `Net Lines: ${
                netLines >= 0 ? "+" : ""
              }${netLines.toLocaleString()}`;
            }
          },
        },
      },
    },
    scales: {
      x: {
        stacked: false,
        grid: {
          color: "rgba(0, 0, 0, 0.05)",
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: (value: number | string) => {
            const num = typeof value === "number" ? value : parseFloat(value);
            return Math.abs(num).toLocaleString();
          },
        },
        title: {
          display: true,
          text: "← Commits | Net Lines →",
          font: {
            size: 12,
            weight: "bold",
          },
        },
      },
      y: {
        stacked: false,
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 10,
          },
          autoSkip: true,
          maxTicksLimit: 20,
        },
      },
    },
  };

  if (weeklyStats.length === 0) {
    return (
      <div className="py-8 text-center text-gray-600">
        No weekly data available
      </div>
    );
  }

  const totalCommits = weeklyStats.reduce((sum, w) => sum + w.commits, 0);
  const totalNetLines = weeklyStats.reduce((sum, w) => sum + w.netLines, 0);

  return (
    <div className="space-y-4">
      {/* Date Range Info */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div>
          <span className="font-medium">First Commit:</span>{" "}
          {new Date(firstCommit).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
        <div>
          <span className="font-medium">Last Commit:</span>{" "}
          {new Date(lastCommit).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: `${Math.max(400, weeklyStats.length * 25)}px` }}>
        <Bar data={chartData} options={options} />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="p-3 backdrop-blur-md bg-white/50 rounded-lg border border-white/30">
          <p className="text-sm text-gray-600">Total Weekly Commits</p>
          <p className="text-2xl font-bold text-metric-commits">
            {totalCommits}
          </p>
        </div>
        <div className="p-3 backdrop-blur-md bg-white/50 rounded-lg border border-white/30">
          <p className="text-sm text-gray-600">Total Net Lines</p>
          <p
            className={`text-2xl font-bold ${
              totalNetLines >= 0 ? "text-metric-net" : "text-metric-deletions"
            }`}
          >
            {totalNetLines >= 0 ? "+" : ""}
            {totalNetLines.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
