/**
 * Activity Heatmap Component
 *
 * Displays a weekly activity heatmap showing commit frequency by day of week.
 * Helps visualize patterns in development activity (e.g., weekdays vs weekends).
 * Uses a custom grid-based visualization with color intensity.
 */

"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { getHeatmapColor } from "@/lib/format";

interface CommitTime {
  date: string;
  timestamp: number;
}

interface ActivityHeatmapProps {
  commitTimes: CommitTime[];
}

export function ActivityHeatmap({ commitTimes }: ActivityHeatmapProps) {
  const weekdayData = useMemo(() => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const commitsByDay = new Map<number, number>();

    // Count commits by day of week
    commitTimes.forEach(commit => {
      const date = new Date(commit.date);
      const dayOfWeek = date.getDay();
      commitsByDay.set(dayOfWeek, (commitsByDay.get(dayOfWeek) || 0) + 1);
    });

    const maxCommits = Math.max(...Array.from(commitsByDay.values()), 1);

    return days.map((day, index) => ({
      day,
      commits: commitsByDay.get(index) || 0,
      color: getHeatmapColor(commitsByDay.get(index) || 0, maxCommits),
    }));
  }, [commitTimes]);

  const hourlyData = useMemo(() => {
    const commitsByHour = new Map<number, number>();

    // Count commits by hour of day
    commitTimes.forEach(commit => {
      const date = new Date(commit.date);
      const hour = date.getUTCHours();
      commitsByHour.set(hour, (commitsByHour.get(hour) || 0) + 1);
    });

    const maxCommits = Math.max(...Array.from(commitsByHour.values()), 1);

    return Array.from({ length: 24 }, (_, hour) => ({
      hour,
      commits: commitsByHour.get(hour) || 0,
      color: getHeatmapColor(commitsByHour.get(hour) || 0, maxCommits),
    }));
  }, [commitTimes]);

  if (commitTimes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Heatmap</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-8">
            No activity data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Heatmap</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Day of Week Heatmap */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Commits by Day of Week
          </h4>
          <div className="grid grid-cols-7 gap-2">
            {weekdayData.map(({ day, commits, color }) => (
              <div key={day} className="text-center">
                <div
                  className={`${color} rounded-lg p-4 mb-2 transition-colors hover:opacity-80`}
                  title={`${day}: ${commits} commits`}
                >
                  <p className="text-2xl font-bold text-gray-800">{commits}</p>
                </div>
                <p className="text-xs text-gray-600">{day.substring(0, 3)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hour of Day Heatmap */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Commits by Hour (UTC)
          </h4>
          <div className="grid grid-cols-12 gap-1">
            {hourlyData.map(({ hour, commits, color }) => (
              <div
                key={hour}
                className={`${color} rounded p-2 text-center transition-colors hover:opacity-80`}
                title={`${hour}:00 - ${commits} commits`}
              >
                <p className="text-xs font-medium text-gray-800">{hour}</p>
                <p className="text-xs text-gray-600">{commits}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 pt-4">
          <span className="text-sm text-gray-600">Less</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 bg-gray-100 rounded"></div>
            <div className="w-4 h-4 bg-teal-200 rounded"></div>
            <div className="w-4 h-4 bg-teal-300 rounded"></div>
            <div className="w-4 h-4 bg-teal-400 rounded"></div>
            <div className="w-4 h-4 bg-teal-500 rounded"></div>
            <div className="w-4 h-4 bg-teal-600 rounded"></div>
          </div>
          <span className="text-sm text-gray-600">More</span>
        </div>
      </CardContent>
    </Card>
  );
}
