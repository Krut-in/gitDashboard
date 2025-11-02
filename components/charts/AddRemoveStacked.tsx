/**
 * Add/Remove Stacked Bar Chart Component
 *
 * Displays a stacked horizontal bar chart showing additions and deletions
 * for each contributor. Helps visualize the balance of added vs removed code.
 * Uses Chart.js with react-chartjs-2.
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
import { METRIC_COLORS } from "@/lib/constants";

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
  additions: number;
  deletions: number;
}

interface AddRemoveStackedProps {
  contributors: Contributor[];
  maxContributors?: number;
}

export function AddRemoveStacked({
  contributors,
  maxContributors = 10,
}: AddRemoveStackedProps) {
  // Sort by total changes and take top N
  const topContributors = [...contributors]
    .sort((a, b) => b.additions + b.deletions - (a.additions + a.deletions))
    .slice(0, maxContributors);

  const data = {
    labels: topContributors.map(c => c.githubLogin || c.name),
    datasets: [
      {
        label: "Additions",
        data: topContributors.map(c => c.additions),
        backgroundColor: METRIC_COLORS.additions.rgba(0.8),
        borderColor: METRIC_COLORS.additions.rgb,
        borderWidth: 1,
      },
      {
        label: "Deletions",
        data: topContributors.map(c => c.deletions),
        backgroundColor: METRIC_COLORS.deletions.rgba(0.8),
        borderColor: METRIC_COLORS.deletions.rgb,
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
        position: "top" as const,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || "";
            return `${label}: ${formatNumber(context.parsed.x)} lines`;
          },
        },
      },
    },
    scales: {
      x: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          callback: function (value: any) {
            return formatNumber(value);
          },
        },
      },
      y: {
        stacked: true,
      },
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Additions vs Deletions</CardTitle>
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
