/**
 * User Contributions Section Component
 *
 * Accordion container displaying all users:
 * - Vertical list of user cards
 * - Only ONE user expanded at a time
 * - First user expanded by default
 * - Auto-collapse others when expanding a new user
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { UserContributionCard } from "./UserContributionCard";
import type { UserContribution } from "@/lib/types";

interface UserContributionsSectionProps {
  users: UserContribution[];
}

export function UserContributionsSection({
  users,
}: UserContributionsSectionProps) {
  // Track which user is expanded (by userId)
  const [expandedUserId, setExpandedUserId] = useState<string | null>(
    users.length > 0 ? users[0].userId : null
  );

  const handleToggle = (userId: string) => {
    setExpandedUserId(expandedUserId === userId ? null : userId);
  };

  if (users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Individual Contributors</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-center py-8">
            No contributor data available
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort users by first commit date (ascending)
  const sortedUsers = [...users].sort((a, b) =>
    a.lifetimeStats.firstCommit.localeCompare(b.lifetimeStats.firstCommit)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Individual Contributors</CardTitle>
          <div className="text-sm text-gray-600">
            {sortedUsers.length} contributor
            {sortedUsers.length !== 1 ? "s" : ""}
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Click on a contributor to view detailed activity patterns and
          contribution history
        </p>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {sortedUsers.map(user => (
            <UserContributionCard
              key={user.userId}
              user={user}
              isExpanded={expandedUserId === user.userId}
              onToggle={() => handleToggle(user.userId)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
