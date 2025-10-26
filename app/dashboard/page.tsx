/**
 * Dashboard Home Page (Protected)
 *
 * Main dashboard view shown after successful authentication.
 * Displays a welcome message and provides links to view repositories.
 * This page requires authentication - unauthenticated users are redirected.
 */

import { requireAuth } from "@/lib/auth";
import { NavBar } from "@/components/NavBar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { GitBranch, Star, GitPullRequest } from "lucide-react";

export default async function DashboardPage() {
  const session = await requireAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar user={session.user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {session.user.name || session.user.username}!
            </h1>
            <p className="mt-2 text-gray-600">
              Here's an overview of your GitHub contributions and activity.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Repositories
                </CardTitle>
                <GitBranch className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">
                  Total repositories
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Stars
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">
                  Across all repositories
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pull Requests
                </CardTitle>
                <GitPullRequest className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">
                  Open pull requests
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>
                Your dashboard is ready. Start exploring your GitHub data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                This dashboard will display your repositories, contributions,
                and insights. Additional features will be available in the next
                phase.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
