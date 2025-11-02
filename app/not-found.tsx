/**
 * Custom 404 Not Found Page
 *
 * This page is displayed when users navigate to a non-existent route.
 * Features a modern, engaging design with animations and clear navigation back to home.
 */

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Home, Search, ArrowRight, Github } from "lucide-react";

export default function NotFound() {
  return (
    <div className="h-screen w-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 relative overflow-hidden flex items-center justify-center">
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-60 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Animated 404 Number */}
        <div className="mb-3 sm:mb-4">
          <h1 className="text-[100px] sm:text-[130px] lg:text-[160px] font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 leading-none animate-pulse-slow select-none">
            404
          </h1>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-1/4 left-1/4 animate-float">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-lg shadow-lg transform rotate-12"></div>
        </div>
        <div className="absolute top-1/3 right-1/4 animate-float animation-delay-2000">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full shadow-lg"></div>
        </div>
        <div className="absolute bottom-1/4 left-1/3 animate-float animation-delay-4000">
          <Github className="w-10 h-10 text-purple-400 opacity-30" />
        </div>

        {/* Message Section */}
        <div className="space-y-3 mb-6">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            Oops! Page Not Found
          </h2>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto">
            The page you're looking for seems to have taken a detour. Don't
            worry, even the best developers get lost sometimes! 🚀
          </p>
        </div>

        {/* Search Suggestions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-4 sm:p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Search className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-700">
              Here's what you can do:
            </h3>
          </div>
          <ul className="text-left max-w-md mx-auto space-y-2">
            <li className="flex items-start gap-2 text-gray-600 text-sm sm:text-base">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                1
              </span>
              <span>Check if the URL is typed correctly</span>
            </li>
            <li className="flex items-start gap-2 text-gray-600 text-sm sm:text-base">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-pink-400 to-purple-500 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                2
              </span>
              <span>Return to the homepage and start fresh</span>
            </li>
            <li className="flex items-start gap-2 text-gray-600 text-sm sm:text-base">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gradient-to-r from-purple-400 to-indigo-500 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                3
              </span>
              <span>Explore your GitHub repositories</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center mb-4">
          <Link href="/">
            <Button
              size="lg"
              className="group bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 hover:from-orange-600 hover:via-pink-600 hover:to-purple-700 text-white font-semibold px-6 py-4 text-base shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Home
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          <Link href="/dashboard">
            <Button
              size="lg"
              variant="outline"
              className="group border-2 border-gray-300 hover:border-purple-400 bg-white/80 backdrop-blur-sm text-gray-700 hover:text-purple-600 font-semibold px-6 py-4 text-base shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Github className="w-4 h-4 mr-2" />
              Go to Dashboard
            </Button>
          </Link>
        </div>

        {/* Fun Error Code */}
        <div className="text-xs sm:text-sm text-gray-400 font-mono">
          Error Code: ROUTE_NOT_FOUND_404
        </div>
      </div>
    </div>
  );
}
