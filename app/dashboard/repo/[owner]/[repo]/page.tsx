/**
 * Repository Details Page
 *
 * Displays branches for a selected repository.
 * User can select a branch to run contribution analysis.
 */

import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BranchSelector } from "@/components/BranchSelector";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";

interface RepoPageProps {
  params: {
    owner: string;
    repo: string;
  };
}

export default function RepoPage({ params }: RepoPageProps) {
  const { owner, repo } = params;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 relative overflow-hidden">
      {/* Static Background Orbs - No Animation for Performance */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <Link href="/dashboard/repositories">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 mb-4 backdrop-blur-md bg-white/40 hover:bg-white/60 border-white/30"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Repositories
            </Button>
          </Link>

          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {owner} / {repo}
          </h1>
          <p className="text-lg text-gray-600">
            Select a branch to analyze contributions
          </p>
        </div>

        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center py-12">
              <Spinner size="lg" />
              <p className="mt-4 text-gray-600">Loading branches...</p>
            </div>
          }
        >
          <BranchSelector owner={owner} repo={repo} />
        </Suspense>
      </div>
    </div>
  );
}
