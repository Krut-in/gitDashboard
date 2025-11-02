/**
 * Footer Component
 *
 * Displays footer information including branding, creator credits, and copyright.
 * Uses Sunset Code design palette for consistent theming.
 * Reusable across all pages (landing, dashboard, etc.)
 */

import Link from "next/link";
import { Github, Linkedin } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative backdrop-blur-md bg-gradient-to-r from-orange-50/40 via-sky-50/40 to-teal-50/40 border-t border-white/30 py-10 shadow-lg mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-600 to-amber-600 rounded-lg flex items-center justify-center shadow-lg">
              <Github className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-orange-600 to-sky-600 bg-clip-text text-transparent">
              GitDash
            </span>
          </div>

          {/* Creator Info */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Created by</span>
              <a
                href="https://www.linkedin.com/in/krutin31"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-semibold text-gray-900 hover:text-sky-600 transition-colors duration-300"
              >
                <Linkedin className="w-4 h-4" />
                Krutin Rathod
              </a>
            </div>
            <p className="text-sm text-gray-500 text-center">
              Built with Next.js, powered by GitHub API • © 2025 All rights
              reserved
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
