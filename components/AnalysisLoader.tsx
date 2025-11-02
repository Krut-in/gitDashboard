/**
 * Analysis Loader Component
 *
 * Enhanced loading component for repository analysis.
 * Shows progress stages with meaningful messages and estimated progress.
 * Provides better UX during long-running analysis operations.
 */

"use client";

import { useEffect, useState } from "react";
import { Spinner } from "./ui/Spinner";
import { GitBranch, Code2, Users, BarChart3 } from "lucide-react";

interface AnalysisLoaderProps {
  startTime: number;
}

const STAGES = [
  {
    icon: GitBranch,
    message: "Connecting to repository...",
    duration: 2000,
  },
  {
    icon: Code2,
    message: "Fetching commit history...",
    duration: 5000,
  },
  {
    icon: Users,
    message: "Analyzing contributors...",
    duration: 8000,
  },
  {
    icon: BarChart3,
    message: "Processing statistics...",
    duration: 12000,
  },
  {
    icon: Code2,
    message: "Hang on! We're crawling through your entire codebase...",
    duration: Infinity,
  },
];

export function AnalysisLoader({ startTime }: AnalysisLoaderProps) {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedTime(Math.floor(elapsed / 1000));

      // Calculate progress based on elapsed time
      const estimatedTotal = 30000; // 30 seconds estimated
      const calculatedProgress = Math.min(
        95,
        Math.floor((elapsed / estimatedTotal) * 100)
      );
      setProgress(calculatedProgress);

      // Update stage based on elapsed time
      let newStage = 0;
      let accumulatedTime = 0;
      for (let i = 0; i < STAGES.length; i++) {
        accumulatedTime += STAGES[i].duration;
        if (elapsed < accumulatedTime) {
          newStage = i;
          break;
        }
        newStage = Math.min(i + 1, STAGES.length - 1);
      }
      setCurrentStage(newStage);
    }, 500);

    return () => clearInterval(interval);
  }, [startTime]);

  const CurrentIcon = STAGES[currentStage].icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="backdrop-blur-md bg-white/60 border border-white/30 rounded-2xl p-8 shadow-xl max-w-md w-full">
        {/* Spinner */}
        <div className="flex justify-center mb-6">
          <Spinner size="lg" />
        </div>

        {/* Current Stage Message */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <CurrentIcon className="w-6 h-6 text-orange-600" />
          <p className="text-lg font-medium text-gray-900">
            {STAGES[currentStage].message}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-orange-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-orange-600 to-sky-600 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2 text-sm text-gray-600">
            <span>{progress}% complete</span>
            <span>{elapsedTime}s elapsed</span>
          </div>
        </div>

        {/* Stage Indicators */}
        <div className="flex justify-between items-center mt-6">
          {STAGES.slice(0, 4).map((stage, index) => (
            <div
              key={index}
              className={`flex flex-col items-center gap-1 ${
                index <= currentStage ? "opacity-100" : "opacity-30"
              } transition-opacity duration-300`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index <= currentStage
                    ? "bg-gradient-to-r from-orange-600 to-sky-600"
                    : "bg-gray-300"
                }`}
              >
                <stage.icon className="w-4 h-4 text-white" />
              </div>
            </div>
          ))}
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Large repositories may take several minutes to analyze.
          <br />
          Please keep this page open.
        </p>
      </div>
    </div>
  );
}
