/**
 * Commits Over Time Line Chart Component
 *
 * Displays a line chart showing commit frequency over time.
 * Groups commits by day and shows the trend of development activity.
 * Uses Chart.js with react-chartjs-2.
 */

"use client";

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
import { formatDateShort } from "@/lib/format";
import { METRIC_COLORS } from "@/lib/constants";

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

interface CommitTime {
  date: string;
  timestamp: number;
}

interface CommitsOverTimeProps {
  commitTimes: CommitTime[];
}

export function CommitsOverTime({ commitTimes }: CommitsOverTimeProps) {
  // Group commits by date
  const commitsByDate = new Map<string, number>();

  commitTimes.forEach(commit => {
    const date = new Date(commit.date);
    const dateKey = date.toISOString().split("T")[0];
    commitsByDate.set(dateKey, (commitsByDate.get(dateKey) || 0) + 1);
  });

  // Sort by date
  const sortedDates = Array.from(commitsByDate.keys()).sort();
  const commitCounts = sortedDates.map(date => commitsByDate.get(date) || 0);

  const data = {
    labels: sortedDates.map(date => formatDateShort(date)),
    datasets: [
      {
        label: "Commits",
        data: commitCounts,
        borderColor: METRIC_COLORS.commits.rgb,
        backgroundColor: METRIC_COLORS.commits.rgba(0.1),
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const options = {
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
      },
    },
    scales: {
      x: {
        display: true,
        ticks: {
          maxTicksLimit: 10,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
    interaction: {
      mode: "nearest" as const,
      axis: "x" as const,
      intersect: false,
    },
  };

  if (sortedDates.length === 0) {
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
        <CardTitle>Commits Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div style={{ height: "300px" }}>
          <Line data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
