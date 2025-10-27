/**
 * Landing Page (Public)
 *
 * This is the home page that visitors see when they first arrive.
 * Features a modern, visually appealing design with direct GitHub OAuth authentication.
 * No intermediate sign-in page - clicking the button takes users directly to GitHub.
 */

import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Github, BarChart3, GitBranch, Users, TrendingUp } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-cyan-950 to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm text-white/90 border border-white/20">
              <BarChart3 className="w-4 h-4" />
              <span>Analyze • Visualize • Optimize</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight">
              GitHub Contribution
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                Dashboard
              </span>
            </h1>

            {/* Subtitle */}
            <p className="max-w-2xl mx-auto text-xl sm:text-2xl text-gray-300 leading-relaxed">
              Unlock powerful insights from your repositories. Track
              contributions, visualize activity patterns, and make data-driven
              decisions.
            </p>

            {/* CTA Button */}
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: "/dashboard" });
              }}
              className="flex justify-center pt-4"
            >
              <Button
                type="submit"
                size="lg"
                className="gap-3 text-lg px-8 py-6 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-2xl shadow-cyan-500/50 transition-all duration-300 transform hover:scale-105"
              >
                <Github className="w-6 h-6" />
                Get Started with GitHub
              </Button>
            </form>

            {/* Trust Badge */}
            <p className="text-sm text-gray-400">
              🔒 Secure OAuth authentication • No passwords stored
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature Card 1 */}
          <div className="group relative bg-white/5 backdrop-blur-lg p-8 rounded-2xl border border-white/10 hover:border-cyan-500/50 transition-all duration-300 hover:transform hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center mb-4">
                <GitBranch className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Branch Analysis
              </h3>
              <p className="text-gray-400 text-sm">
                Deep dive into any branch with commit history, contributor
                stats, and timeline visualization.
              </p>
            </div>
          </div>

          {/* Feature Card 2 */}
          <div className="group relative bg-white/5 backdrop-blur-lg p-8 rounded-2xl border border-white/10 hover:border-cyan-500/50 transition-all duration-300 hover:transform hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="w-12 h-12 bg-teal-500/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Team Insights
              </h3>
              <p className="text-gray-400 text-sm">
                Track team contributions with detailed metrics on commits,
                additions, and deletions.
              </p>
            </div>
          </div>

          {/* Feature Card 3 */}
          <div className="group relative bg-white/5 backdrop-blur-lg p-8 rounded-2xl border border-white/10 hover:border-cyan-500/50 transition-all duration-300 hover:transform hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Visual Charts
              </h3>
              <p className="text-gray-400 text-sm">
                Beautiful, interactive charts for commits over time, activity
                heatmaps, and code changes.
              </p>
            </div>
          </div>

          {/* Feature Card 4 */}
          <div className="group relative bg-white/5 backdrop-blur-lg p-8 rounded-2xl border border-white/10 hover:border-cyan-500/50 transition-all duration-300 hover:transform hover:scale-105">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-lime-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">
                Export Reports
              </h3>
              <p className="text-gray-400 text-sm">
                Generate and download CSV reports for contributors, commits, and
                detailed analytics.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-gray-400 text-sm">
          Built with Next.js, powered by GitHub API
        </p>
      </div>
    </div>
  );
}
