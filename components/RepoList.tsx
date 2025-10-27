/**
 * Repository List Component
 *
 * Displays a searchable and filterable list of GitHub repositories.
 * Allows users to select a repository to analyze.
 * Fetches data from the /api/github/repos endpoint with pagination.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, GitBranch, Star, Lock, Unlock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Spinner } from "./ui/Spinner";
import { Repository } from "@/lib/types";
import { formatRelativeTime, formatNumber } from "@/lib/format";

export function RepoList() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPrivate, setFilterPrivate] = useState<
    "all" | "public" | "private"
  >("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetchRepos();
  }, [page]);

  async function fetchRepos() {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/github/repos?page=${page}&per_page=30`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch repositories");
      }

      const data = await response.json();
      setRepos(data.repositories);
      setHasMore(data.pagination.hasNext);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  const filteredRepos = repos.filter(repo => {
    const matchesSearch =
      repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filterPrivate === "all" ||
      (filterPrivate === "private" && repo.private) ||
      (filterPrivate === "public" && !repo.private);
    return matchesSearch && matchesFilter;
  });

  if (loading && repos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="backdrop-blur-md bg-white/60 border border-white/30 rounded-2xl p-8 shadow-lg text-center space-y-4">
          <Spinner size="lg" />
          <div>
            <p className="text-lg font-medium text-gray-900">
              Loading repositories...
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Fetching your GitHub repositories
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <p className="text-red-800">Error: {error}</p>
          <Button onClick={() => fetchRepos()} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search repositories..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 backdrop-blur-md bg-white/50 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterPrivate === "all" ? "default" : "outline"}
                onClick={() => setFilterPrivate("all")}
                size="sm"
                className={
                  filterPrivate === "all"
                    ? "backdrop-blur-md bg-gradient-to-r from-purple-600 to-blue-600"
                    : "backdrop-blur-md bg-white/40 border-white/30"
                }
              >
                All
              </Button>
              <Button
                variant={filterPrivate === "public" ? "default" : "outline"}
                onClick={() => setFilterPrivate("public")}
                size="sm"
                className={
                  filterPrivate === "public"
                    ? "backdrop-blur-md bg-gradient-to-r from-purple-600 to-blue-600"
                    : "backdrop-blur-md bg-white/40 border-white/30"
                }
              >
                Public
              </Button>
              <Button
                variant={filterPrivate === "private" ? "default" : "outline"}
                onClick={() => setFilterPrivate("private")}
                size="sm"
                className={
                  filterPrivate === "private"
                    ? "backdrop-blur-md bg-gradient-to-r from-purple-600 to-blue-600"
                    : "backdrop-blur-md bg-white/40 border-white/30"
                }
              >
                Private
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Repository List */}
      <div className="grid gap-4">
        {filteredRepos.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-600">
              No repositories found matching your criteria.
            </CardContent>
          </Card>
        ) : (
          filteredRepos.map(repo => (
            <Link
              key={repo.id}
              href={`/dashboard/repo/${repo.full_name.split("/")[0]}/${
                repo.full_name.split("/")[1]
              }`}
            >
              <Card className="hover:shadow-xl hover:bg-white/70 transition-all cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {repo.name}
                        </h3>
                        {repo.private ? (
                          <Lock className="w-4 h-4 text-gray-500" />
                        ) : (
                          <Unlock className="w-4 h-4 text-gray-500" />
                        )}
                      </div>

                      {repo.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {repo.description}
                        </p>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {repo.language && (
                          <span className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full bg-gradient-to-r from-purple-500 to-blue-500"></span>
                            {repo.language}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4" />
                          {formatNumber(repo.stargazers_count)}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitBranch className="w-4 h-4" />
                          {formatNumber(repo.forks_count)}
                        </span>
                        <span>
                          Updated {formatRelativeTime(repo.updated_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {(page > 1 || hasMore) && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="backdrop-blur-md bg-white/40 hover:bg-white/60 border-white/30"
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-gray-700 backdrop-blur-md bg-white/40 rounded-lg border border-white/30">
            Page {page}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(p => p + 1)}
            disabled={!hasMore || loading}
            className="backdrop-blur-md bg-white/40 hover:bg-white/60 border-white/30"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
