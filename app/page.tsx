/**
 * Landing Page (Public)
 *
 * This is the home page that visitors see when they first arrive.
 * Features a modern, visually appealing design with direct GitHub OAuth authentication.
 * No intermediate sign-in page - clicking the button takes users directly to GitHub.
 */

import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { ECGBadge } from "@/components/ECGBadge";
import { RotatingFeatureCards } from "@/components/RotatingFeatureCards";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { featureCards } from "@/lib/feature-cards-data";
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
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-sky-50 to-teal-50 relative overflow-hidden">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-64 h-64 bg-amber-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-64 h-64 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-sky-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-6000"></div>
      </div>

      {/* Navigation */}
      <NavBar />

      {/* Hero Section */}
      <section className="relative bg-transparent max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-6 relative z-10">
            <ECGBadge />

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
                  className="backdrop-blur-md bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-8 py-6 text-base rounded-xl flex items-center gap-2 shadow-xl border border-white/20 transition-all duration-300 hover-elevate"
                >
                  <Github className="w-5 h-5" />
                  Get Started
                </Button>
              </form>
              <a href="#how-it-works">
                <Button
                  size="lg"
                  className="backdrop-blur-md bg-gradient-to-r from-sky-500 to-teal-500 hover:from-sky-600 hover:to-teal-600 text-white px-8 py-6 text-base rounded-xl flex items-center gap-2 shadow-xl border border-white/20 transition-all duration-300 hover-elevate"
                >
                  Explore Features →
                </Button>
              </a>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-orange-500 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-sky-500 border-2 border-white"></div>
                <div className="w-8 h-8 rounded-full bg-teal-500 border-2 border-white"></div>
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
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-600 to-amber-600 rounded-full shadow-lg"></div>
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          Repository Overview
                        </div>
                        <div className="text-xs text-gray-500">
                          Last updated: 2 min ago
                        </div>
                      </div>
                    </div>
                    <div className="w-2 h-2 bg-teal-500 rounded-full shadow-lg"></div>
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
                        className="flex-1 bg-gradient-to-t from-orange-600 to-sky-500 rounded-sm shadow-lg"
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
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-teal-600" />
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

          <RotatingFeatureCards
            features={featureCards}
            rotationInterval={15000}
          />
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
