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
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Link href="/dashboard/repositories">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 mb-4 backdrop-blur-md !bg-gradient-to-r !from-orange-600 !to-orange-700 !text-white hover:!text-white hover:!bg-gradient-to-r hover:!from-orange-700 hover:!to-orange-800 !border-none shadow-lg hover:shadow-orange-500/50 hover:scale-[1.02] transition-all duration-300"
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
  );
}
