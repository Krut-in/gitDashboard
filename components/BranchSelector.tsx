/**
 * Branch Selector Component
 *
 * Displays a paginated list of branches for a selected repository.
 * Main branch is pinned at the top with a quick access button.
 * Shows 10 branches per page with pagination controls.
 * Fetches data from the /api/github/branches endpoint.
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { GitBranch, Shield, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Button } from "./ui/Button";
import { Spinner } from "./ui/Spinner";
import { Branch } from "@/lib/types";

interface BranchSelectorProps {
  owner: string;
  repo: string;
}

const BRANCHES_PER_PAGE = 10;

export function BranchSelector({ owner, repo }: BranchSelectorProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchBranches();
  }, [owner, repo]);

  async function fetchBranches() {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/github/branches?owner=${encodeURIComponent(
          owner
        )}&repo=${encodeURIComponent(repo)}&per_page=100`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch branches");
      }

      const data = await response.json();
      
      // Sort branches: main/master first, then alphabetically
      const sortedBranches = [...data.branches].sort((a, b) => {
        const isAMain = a.name === 'main' || a.name === 'master';
        const isBMain = b.name === 'main' || b.name === 'master';
        
        if (isAMain && !isBMain) return -1;
        if (!isAMain && isBMain) return 1;
        
        // If both are main/master, prefer 'main'
        if (isAMain && isBMain) {
          return a.name === 'main' ? -1 : 1;
        }
        
        return a.name.localeCompare(b.name);
      });
      
      setBranches(sortedBranches);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  // Pagination logic
  const { mainBranch, otherBranches, paginatedBranches, totalPages } = useMemo(() => {
    const main = branches.find(b => b.name === 'main' || b.name === 'master');
    const others = branches.filter(b => b.name !== 'main' && b.name !== 'master');
    
    const startIndex = (currentPage - 1) * BRANCHES_PER_PAGE;
    const endIndex = startIndex + BRANCHES_PER_PAGE;
    const paginated = others.slice(startIndex, endIndex);
    
    return {
      mainBranch: main,
      otherBranches: others,
      paginatedBranches: paginated,
      totalPages: Math.ceil(others.length / BRANCHES_PER_PAGE)
    };
  }, [branches, currentPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const renderBranchCard = (branch: Branch, isMain = false) => (
    <Link
      key={branch.name}
      href={`/dashboard/repo/${owner}/${repo}/branch/${encodeURIComponent(
        branch.name
      )}`}
    >
      <div className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 hover:border-primary transition-colors cursor-pointer ${
        isMain ? 'bg-blue-50 border-blue-300 hover:bg-blue-100' : ''
      }`}>
        <div className="flex items-center gap-3">
          {isMain ? (
            <Star className="w-5 h-5 text-blue-600 fill-blue-600" />
          ) : (
            <GitBranch className="w-5 h-5 text-gray-400" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <p className={`font-medium ${isMain ? 'text-blue-900' : 'text-gray-900'}`}>
                {branch.name}
              </p>
              {isMain && (
                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">
                  Default
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {branch.commit.sha.substring(0, 7)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {branch.protected && (
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Shield className="w-4 h-4" />
              <span>Protected</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select a Branch to Analyze</CardTitle>
        <p className="text-sm text-gray-600 mt-1">
          {branches.length} {branches.length === 1 ? 'branch' : 'branches'} available
        </p>
      </CardHeader>
      <CardContent>
        {branches.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            No branches found in this repository.
          </p>
        ) : (
          <div className="space-y-6">
            {/* Main/Master Branch - Pinned at Top */}
            {mainBranch && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4 text-blue-600" />
                  Default Branch
                </h3>
                {renderBranchCard(mainBranch, true)}
              </div>
            )}

            {/* Other Branches */}
            {otherBranches.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">
                  All Branches
                </h3>
                <div className="space-y-2">
                  {paginatedBranches.map(branch => renderBranchCard(branch))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between border-t pt-4">
                    <div className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages} ({otherBranches.length} branches)
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </Button>
                      
                      {/* Page Numbers */}
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              className="min-w-[40px]"
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        variant="outline"
                        size="sm"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
