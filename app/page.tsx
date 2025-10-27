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
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Github className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">GitDash</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a
                href="#features"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-300"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-300"
              >
                How it Works
              </a>
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
                className="bg-black hover:bg-gray-800 text-white"
              >
                Sign In
              </Button>
            </form>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="inline-block">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full text-sm text-gray-700">
                <Zap className="w-4 h-4 text-orange-500" />
                <span>Analyze • Visualize • Optimize</span>
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
              Effortlessly Organize
              <br />
              and Simplify Your
              <br />
              <span className="text-gray-900">GitHub Analytics</span>
            </h1>

            <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
              Automatically track your repositories, contributions, and
              branches. Gain insights into your development workflow and achieve
              your project goals.
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
                  className="bg-black hover:bg-gray-800 text-white px-8 py-6 text-base rounded-xl"
                >
                  Get Started
                </Button>
              </form>
              <Button
                size="lg"
                className="bg-gray-900 hover:bg-gray-800 text-white border-2 border-gray-900 px-8 py-6 text-base rounded-xl transition-all duration-300"
              >
                Explore Features →
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-3 pt-4">
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
          <div className="relative">
            <div className="bg-gray-50 rounded-3xl p-8 border border-gray-200">
              <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
                {/* Mock Dashboard Preview */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-black rounded-full"></div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          Repository Overview
                        </div>
                        <div className="text-xs text-gray-500">
                          Last updated: 2 min ago
                        </div>
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="text-2xl font-bold text-gray-900">
                        247
                      </div>
                      <div className="text-xs text-gray-500">Total Commits</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
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
                    <div className="h-24 bg-gray-50 rounded-lg flex items-end gap-1 p-2">
                      <div
                        className="flex-1 bg-gray-300 rounded-sm"
                        style={{ height: "40%" }}
                      ></div>
                      <div
                        className="flex-1 bg-gray-300 rounded-sm"
                        style={{ height: "70%" }}
                      ></div>
                      <div
                        className="flex-1 bg-black rounded-sm"
                        style={{ height: "100%" }}
                      ></div>
                      <div
                        className="flex-1 bg-gray-300 rounded-sm"
                        style={{ height: "60%" }}
                      ></div>
                      <div
                        className="flex-1 bg-gray-300 rounded-sm"
                        style={{ height: "45%" }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Card */}
            <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 border border-gray-200">
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

      {/* Trusted By Section */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 mb-8">TRUSTED BY</p>
          <div className="flex justify-center items-center gap-12 flex-wrap opacity-50">
            <Github className="w-20 h-8" />
            <Code2 className="w-20 h-8" />
            <GitBranch className="w-20 h-8" />
            <BarChart3 className="w-20 h-8" />
            <TrendingUp className="w-20 h-8" />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section
        id="how-it-works"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20"
      >
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            The Dashboard showcases multiple analyses
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Seamlessly integrate with your existing workflow. Connect your
            GitHub account and start analyzing your repositories instantly.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <GitBranch className="w-8 h-8 text-gray-900" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Branch Analysis
            </h3>
            <p className="text-sm text-gray-600">
              Deep dive into any branch with commit history and contributor
              stats
            </p>
          </div>

          {/* Feature 3 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-900" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Visual Charts
            </h3>
            <p className="text-sm text-gray-600">
              Beautiful, interactive charts for commits and activity heatmaps
            </p>
          </div>

          {/* Feature 4 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-8 h-8 text-gray-900" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Export Reports
            </h3>
            <p className="text-sm text-gray-600">
              Generate and download CSV reports for detailed analytics
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
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
                  Krutin
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
