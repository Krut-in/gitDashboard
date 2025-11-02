"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Zap } from "lucide-react";
import { ECGHeartbeat } from "./ECGHeartbeat";

/**
 * ECG Badge Component
 *
 * A visually engaging badge component featuring an ECG heartbeat animation
 * with a Zap icon that pulses with teal color (#14b8a6) from the Sunset Code theme.
 * The animation provides visual feedback when the ECG sweep starts.
 *
 * @component
 * @returns {JSX.Element} Animated ECG badge with heartbeat visualization
 *
 * Features:
 * - ECG heartbeat animation with customizable sweep timing
 * - Synchronized Zap icon glow effect
 * - Teal color scheme (#14b8a6) matching Sunset Code design theme
 * - Glassmorphism styling with backdrop blur
 * - Automatic cleanup of animation timeouts
 */
export function ECGBadge() {
  const [isGlowing, setIsGlowing] = useState(false);
  const glowTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSweepStart = useCallback(() => {
    // Clear any existing timeout to prevent multiple glows
    if (glowTimeoutRef.current) {
      clearTimeout(glowTimeoutRef.current);
    }

    setIsGlowing(true);
    // Remove glow after 1 second
    glowTimeoutRef.current = setTimeout(() => {
      setIsGlowing(false);
      glowTimeoutRef.current = null;
    }, 1000);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (glowTimeoutRef.current) {
        clearTimeout(glowTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="inline-block">
      <div className="group flex items-center gap-2 px-4 py-2 backdrop-blur-md bg-white/40 rounded-full text-sm text-gray-800 shadow-lg border border-white/30 ray-container relative overflow-hidden">
        {/* ECG Heartbeat Animation Background */}
        <div className="absolute inset-0 opacity-100 group-hover:opacity-0 transition-opacity duration-300 pointer-events-none">
          <ECGHeartbeat
            className="w-full h-full"
            color="#14b8a6"
            glowColor="#14b8a6"
            sweepDuration={2500}
            sweepInterval={3500}
            lineWidth={1.5}
            pauseOnHover={true}
            startOffset={32}
            onSweepStart={handleSweepStart}
          />
        </div>
        <Zap
          className={`w-4 h-4 text-teal-500 relative z-10 transition-all duration-300 ${
            isGlowing ? "zap-icon-glow" : "zap-heartbeat"
          }`}
        />
        <span className="relative z-10">Analyze • Visualize • Optimize</span>
      </div>
    </div>
  );
}
