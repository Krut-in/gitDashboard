/**
 * Landing Page (Public)
 *
 * This is the home page that visitors see when they first arrive.
 * It displays a welcome message and a call-to-action button to sign in with GitHub.
 * Anyone can access this page without authentication.
 */

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Github } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight">
            GitHub Contribution Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            Track your contributions, analyze your repositories, and visualize
            your GitHub activity all in one place.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/sign-in">
            <Button size="lg" className="gap-2">
              <Github className="w-5 h-5" />
              Sign in with GitHub
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg mb-2">Track Contributions</h3>
            <p className="text-gray-600 text-sm">
              Monitor your commits, pull requests, and issues across all
              repositories.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg mb-2">Visualize Activity</h3>
            <p className="text-gray-600 text-sm">
              See beautiful charts and graphs of your GitHub activity over time.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="font-semibold text-lg mb-2">Analyze Repositories</h3>
            <p className="text-gray-600 text-sm">
              Get insights into your repositories including languages and stats.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
