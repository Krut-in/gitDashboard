/**
 * Net Lines Bar Chart Component
 *
 * Displays a horizontal bar chart showing top contributors by net lines added.
 * Net lines = additions - deletions.
 * Uses Chart.js with react-chartjs-2 for rendering.
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
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { formatNumber } from "@/lib/format";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Contributor {
  name: string;
  githubLogin: string | null;
  netLines: number;
}

interface NetLinesBarProps {
  contributors: Contributor[];
  maxContributors?: number;
}

export function NetLinesBar({
  contributors,
  maxContributors = 10,
}: NetLinesBarProps) {
  // Sort by net lines and take top N
  const topContributors = [...contributors]
    .sort((a, b) => b.netLines - a.netLines)
    .slice(0, maxContributors);

  const data = {
    labels: topContributors.map(c => c.githubLogin || c.name),
    datasets: [
      {
        label: "Net Lines",
        data: topContributors.map(c => c.netLines),
        backgroundColor: topContributors.map(c =>
          c.netLines >= 0 ? "rgba(34, 197, 94, 0.8)" : "rgba(239, 68, 68, 0.8)"
        ),
        borderColor: topContributors.map(c =>
          c.netLines >= 0 ? "rgb(34, 197, 94)" : "rgb(239, 68, 68)"
        ),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    indexAxis: "y" as const,
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
        callbacks: {
          label: function (context: any) {
            return `Net Lines: ${formatNumber(context.parsed.x)}`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return formatNumber(value);
          },
        },
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Contributors by Net Lines</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          style={{ height: `${Math.max(300, topContributors.length * 40)}px` }}
        >
          <Bar data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
