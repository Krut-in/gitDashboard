/**
 * Branch Selector Component
 *
 * Displays a list of branches for a selected repository.
 * Allows users to select a branch for contribution analysis.
 * Fetches data from the /api/github/branches endpoint.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GitBranch, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Spinner } from "./ui/Spinner";
import { Branch } from "@/lib/types";

interface BranchSelectorProps {
  owner: string;
  repo: string;
}

export function BranchSelector({ owner, repo }: BranchSelectorProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBranches();
  }, [owner, repo]);

  async function fetchBranches() {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/github/branches?owner=${encodeURIComponent(
          owner
        )}&repo=${encodeURIComponent(repo)}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch branches");
      }

      const data = await response.json();
      setBranches(data.branches);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Select a Branch</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center space-y-4">
              <Spinner size="lg" />
              <p className="text-gray-600">Loading branches...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-800 mb-4">Error: {error}</p>
          <Button onClick={() => fetchBranches()} variant="outline">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select a Branch to Analyze</CardTitle>
      </CardHeader>
      <CardContent>
        {branches.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            No branches found in this repository.
          </p>
        ) : (
          <div className="space-y-2">
            {branches.map(branch => (
              <Link
                key={branch.name}
                href={`/dashboard/repo/${owner}/${repo}/branch/${encodeURIComponent(
                  branch.name
                )}`}
              >
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 hover:border-primary transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <GitBranch className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{branch.name}</p>
                      <p className="text-sm text-gray-500">
                        {branch.commit.sha.substring(0, 7)}
                      </p>
                    </div>
                  </div>
                  {branch.protected && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Shield className="w-4 h-4" />
                      <span>Protected</span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
