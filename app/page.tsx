/**
 * Landing Page (Public)
 *
 * This is the home page that visitors see when they first arrive.
 * Features a modern, visually appealing design with direct GitHub OAuth authentication.
 * No intermediate sign-in page - clicking the button takes users directly to GitHub.
 */

import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import {
  Github,
  BarChart3,
  GitBranch,
  Users,
  TrendingUp,
  Code2,
  Lock,
  Zap,
  ArrowRight,
  CheckCircle2,
  Linkedin,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-64 h-64 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-64 h-64 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-6000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 backdrop-blur-md bg-white/30 border-b border-white/20 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center shadow-lg">
                <Github className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">GitDash</span>
            </div>
            <form
              action={async () => {
                "use server";
                await signIn("github", { redirectTo: "/dashboard" });
              }}
            >
              <Button
                type="submit"
                size="sm"
                className="backdrop-blur-md bg-black/80 hover:bg-black/90 text-white flex items-center gap-2 shadow-lg border border-white/20"
              >
                <Github className="w-4 h-4" />
                Sign in with GitHub
              </Button>
            </form>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-transparent max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-6 relative z-10">
            <div className="inline-block">
              <div className="flex items-center gap-2 px-4 py-2 backdrop-blur-md bg-white/40 rounded-full text-sm text-gray-800 shadow-lg border border-white/30">
                <Zap className="w-4 h-4 text-orange-500" />
                <span>Analyze • Visualize • Optimize</span>
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
              Effortlessly Organize and Simplify Your GitHub Analytics
            </h1>

            <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
              Track your repositories, contributions, and branches. Gain
              insights into your development workflow and achieve your project
              goals.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <form
                action={async () => {
                  "use server";
                  await signIn("github", { redirectTo: "/dashboard" });
                }}
              >
                <Button
                  type="submit"
                  size="lg"
                  className="backdrop-blur-md bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-6 text-base rounded-xl flex items-center gap-2 shadow-xl border border-white/20 transition-all duration-300"
                >
                  <Github className="w-5 h-5" />
                  Get Started
                </Button>
              </form>
              <a href="#how-it-works">
                <Button
                  size="lg"
                  className="backdrop-blur-md bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white px-8 py-6 text-base rounded-xl flex items-center gap-2 shadow-xl border border-white/20 transition-all duration-300"
                >
                  Explore Features →
                </Button>
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-green-500 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-orange-500 border-2 border-white"></div>
              </div>
              <div className="text-sm">
                <div className="font-semibold text-gray-900">50k Downloads</div>
                <div className="text-gray-500">
                  Trusted by developers worldwide
                </div>
              </div>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative z-10">
            <div className="backdrop-blur-md bg-white/30 rounded-3xl p-8 border border-white/40 shadow-2xl">
              <div className="backdrop-blur-lg bg-white/50 rounded-2xl shadow-lg p-6 space-y-6 border border-white/60">
                {/* Mock Dashboard Preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full shadow-lg"></div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          Repository Overview
                        </div>
                        <div className="text-xs text-gray-500">
                          Last updated: 2 min ago
                        </div>
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full shadow-lg"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="backdrop-blur-sm bg-white/60 rounded-xl p-4 border border-white/50 shadow-md">
                      <div className="text-2xl font-bold text-gray-900">
                        247
                      </div>
                      <div className="text-xs text-gray-500">Total Commits</div>
                    </div>
                    <div className="backdrop-blur-sm bg-white/60 rounded-xl p-4 border border-white/50 shadow-md">
                      <div className="text-2xl font-bold text-gray-900">12</div>
                      <div className="text-xs text-gray-500">Contributors</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Repository Activity</span>
                      <span className="text-gray-900 font-semibold">
                        +24% this week
                      </span>
                    </div>
                    <div className="h-24 backdrop-blur-sm bg-white/40 rounded-lg flex items-end gap-1 p-2 border border-white/50">
                      <div
                        className="flex-1 bg-gradient-to-t from-gray-400 to-gray-300 rounded-sm"
                        style={{ height: "40%" }}
                      ></div>
                      <div
                        className="flex-1 bg-gradient-to-t from-gray-400 to-gray-300 rounded-sm"
                        style={{ height: "70%" }}
                      ></div>
                      <div
                        className="flex-1 bg-gradient-to-t from-purple-600 to-blue-600 rounded-sm shadow-lg"
                        style={{ height: "100%" }}
                      ></div>
                      <div
                        className="flex-1 bg-gradient-to-t from-gray-400 to-gray-300 rounded-sm"
                        style={{ height: "60%" }}
                      ></div>
                      <div
                        className="flex-1 bg-gradient-to-t from-gray-400 to-gray-300 rounded-sm"
                        style={{ height: "45%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Card */}
            <div className="absolute -bottom-6 -left-6 backdrop-blur-md bg-white/50 rounded-2xl shadow-xl p-4 border border-white/60">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    All Systems Go
                  </div>
                  <div className="text-xs text-gray-500">100% Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="relative bg-transparent py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 relative z-10">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              The Dashboard showcases multiple analyses
            </h2>
            <p className="text-gray-700 max-w-2xl mx-auto">
              Seamlessly integrate with your existing workflow. Connect your
              GitHub account and start analyzing your repositories instantly.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            {/* Feature 1 */}
            <div className="text-center backdrop-blur-md bg-white/40 rounded-2xl p-6 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <GitBranch className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Branch Analysis
              </h3>
              <p className="text-sm text-gray-700">
                Deep dive into any branch with commit history and contributor
                stats
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center backdrop-blur-md bg-white/40 rounded-2xl p-6 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Visual Charts
              </h3>
              <p className="text-sm text-gray-700">
                Beautiful, interactive charts for commits and activity heatmaps
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center backdrop-blur-md bg-white/40 rounded-2xl p-6 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Export Reports
              </h3>
              <p className="text-sm text-gray-700">
                Generate and download CSV reports for detailed analytics
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative backdrop-blur-md bg-white/30 border-t border-white/20 py-10 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                <Github className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">GitDash</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Created by</span>
                <a
                  href="https://www.linkedin.com/in/krutin31"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 font-semibold text-gray-900 hover:text-blue-600 transition-colors duration-300"
                >
                  <Linkedin className="w-4 h-4" />
                  Krutin Rathod
                </a>
              </div>
              <p className="text-sm text-gray-500">
                Built with Next.js, powered by GitHub API • © 2025 All rights
                reserved
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
