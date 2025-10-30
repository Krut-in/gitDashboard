"use client";

import { useEffect, useRef, useState } from "react";

interface ECGHeartbeatProps {
  className?: string;
  color?: string;
  glowColor?: string;
  sweepDuration?: number;
  sweepInterval?: number;
  lineWidth?: number;
  pauseOnHover?: boolean;
  startOffset?: number;
  onSweepStart?: () => void;
}

/**
 * ECG Heartbeat Animation Component
 *
 * Renders an ECG-style heartbeat waveform with a sweeping beam effect.
 * The line is invisible by default and becomes illuminated as a beam of light passes through it.
 *
 * @param className - CSS classes for the canvas container
 * @param color - Color of the ECG line (default: #10b981)
 * @param glowColor - Color of the glow effect (default: #10b981)
 * @param sweepDuration - Duration of the sweep animation in ms (default: 2500)
 * @param sweepInterval - Time between sweeps in ms (default: 3500)
 * @param lineWidth - Width of the ECG line (default: 2)
 * @param pauseOnHover - Pause animation when parent element is hovered (default: false)
 * @param startOffset - Left offset in pixels to start the ECG (e.g., to skip the icon area) (default: 0)
 * @param onSweepStart - Callback function called when a new sweep starts
 */
export function ECGHeartbeat({
  className = "",
  color = "#10b981",
  glowColor = "#10b981",
  sweepDuration = 2500,
  sweepInterval = 3500,
  lineWidth = 2,
  pauseOnHover = false,
  startOffset = 0,
  onSweepStart,
}: ECGHeartbeatProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const onSweepStartRef = useRef(onSweepStart);
  const [isPaused, setIsPaused] = useState(false);

  // Update the ref when callback changes, but don't restart animation
  useEffect(() => {
    onSweepStartRef.current = onSweepStart;
  }, [onSweepStart]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size with device pixel ratio for crisp rendering
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Handle hover pause if enabled
    const handleMouseEnter = () => {
      if (pauseOnHover) setIsPaused(true);
    };

    const handleMouseLeave = () => {
      if (pauseOnHover) setIsPaused(false);
    };

    const parentElement = canvas.parentElement;
    if (pauseOnHover && parentElement) {
      parentElement.addEventListener("mouseenter", handleMouseEnter);
      parentElement.addEventListener("mouseleave", handleMouseLeave);
    }

    // ECG heartbeat path (normalized 0-1 for x, 0-1 for y)
    // Mimics a realistic ECG waveform with P, Q, R, S, T waves
    const ecgPath: [number, number][] = [
      [0, 0.5],
      [0.08, 0.5],
      [0.1, 0.5],
      [0.12, 0.35], // P wave start
      [0.14, 0.5], // P wave end
      [0.16, 0.5],
      [0.18, 0.5],
      [0.2, 0.5],
      [0.22, 0.53], // Q wave
      [0.235, 0.05], // R wave (sharp spike up)
      [0.25, 0.65], // S wave (dip down)
      [0.27, 0.5],
      [0.29, 0.5],
      [0.32, 0.5],
      [0.34, 0.42], // T wave start
      [0.36, 0.5], // T wave end
      [0.38, 0.5],
      [0.5, 0.5], // Flat baseline
      [0.58, 0.5],
      [0.6, 0.5],
      [0.62, 0.35], // Second P wave
      [0.64, 0.5],
      [0.66, 0.5],
      [0.68, 0.5],
      [0.7, 0.5],
      [0.72, 0.53], // Second Q wave
      [0.735, 0.05], // Second R wave
      [0.75, 0.65], // Second S wave
      [0.77, 0.5],
      [0.79, 0.5],
      [0.82, 0.5],
      [0.84, 0.42], // Second T wave
      [0.86, 0.5],
      [0.88, 0.5],
      [1, 0.5],
    ];

    let sweepPosition = 0;
    let lastSweepTime = Date.now();
    let isAnimating = false;
    let pauseStartTime = 0;
    let pausedDuration = 0;
    let hasCalledCallback = false;

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const currentTime = Date.now();

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Handle pause state
      if (isPaused) {
        if (pauseStartTime === 0) {
          pauseStartTime = currentTime;
        }
        // Keep drawing the current state but don't update sweep position
        animationRef.current = requestAnimationFrame(animate);
        return;
      } else if (pauseStartTime > 0) {
        // Resume from pause - adjust timing
        pausedDuration = currentTime - pauseStartTime;
        lastSweepTime += pausedDuration;
        pauseStartTime = 0;
        pausedDuration = 0;
      }

      // Update sweep position
      const timeSinceLastSweep = currentTime - lastSweepTime;

      if (timeSinceLastSweep < sweepDuration) {
        // Currently sweeping
        isAnimating = true;
        sweepPosition = timeSinceLastSweep / sweepDuration;
      } else if (timeSinceLastSweep >= sweepInterval) {
        // Start new sweep
        lastSweepTime = currentTime;
        sweepPosition = 0;
        isAnimating = true;

        // Trigger sweep start callback only once per sweep
        if (onSweepStartRef.current && !hasCalledCallback) {
          hasCalledCallback = true;
          onSweepStartRef.current();
        }
      } else {
        // Waiting between sweeps
        sweepPosition = 1;
        isAnimating = false;
        hasCalledCallback = false; // Reset flag for next sweep
      }

      // Configure line drawing
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Draw the ECG line segment by segment
      const effectiveWidth = width - startOffset;

      for (let i = 0; i < ecgPath.length - 1; i++) {
        const [x1, y1] = ecgPath[i];
        const [x2, y2] = ecgPath[i + 1];

        const startX = startOffset + x1 * effectiveWidth;
        const startY = y1 * height;
        const endX = startOffset + x2 * effectiveWidth;
        const endY = y2 * height;

        // Calculate if this segment should be illuminated
        const segmentStart = x1;
        const segmentEnd = x2;
        const sweepEnd = sweepPosition;
        const sweepWidth = 0.15; // Width of the illuminated region
        const sweepStart = Math.max(0, sweepPosition - sweepWidth);

        let opacity = 0;

        // Check if segment is within the sweep region
        if (segmentEnd <= sweepEnd && segmentStart >= sweepStart) {
          // Fully illuminated
          opacity = 1;
        } else if (segmentStart < sweepEnd && segmentEnd > sweepStart) {
          // Partially illuminated
          const overlapStart = Math.max(segmentStart, sweepStart);
          const overlapEnd = Math.min(segmentEnd, sweepEnd);
          const coverage = overlapEnd - overlapStart;
          const segmentLength = segmentEnd - segmentStart;
          opacity = Math.min(1, coverage / segmentLength);

          // Add fade effect at edges
          const distanceFromSweepCenter = Math.abs(
            (segmentStart + segmentEnd) / 2 - sweepPosition
          );
          const fadeMultiplier = 1 - distanceFromSweepCenter / sweepWidth;
          opacity *= Math.max(0, fadeMultiplier);
        }

        // Draw segment
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);

        if (opacity > 0.05) {
          // Illuminated segment without glow
          ctx.strokeStyle = color;
          ctx.globalAlpha = opacity;
        } else {
          // Very faint baseline (barely visible)
          ctx.strokeStyle = color;
          ctx.globalAlpha = 0.03;
        }

        ctx.stroke();
      }

      // Reset global alpha
      ctx.globalAlpha = 1;

      // Continue animation
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      const parentElement = canvas.parentElement;
      if (pauseOnHover && parentElement) {
        parentElement.removeEventListener("mouseenter", handleMouseEnter);
        parentElement.removeEventListener("mouseleave", handleMouseLeave);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [
    color,
    glowColor,
    sweepDuration,
    sweepInterval,
    lineWidth,
    pauseOnHover,
    isPaused,
    startOffset,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
