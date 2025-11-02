/**
 * Rotating Feature Cards Component
 *
 * This component displays a rotating carousel of feature cards with typewriter animations.
 * Three cards are shown at a time, rotating through all available features every 15 seconds.
 * Each card includes an icon, title, and description that animate with a typewriter effect.
 *
 * Features:
 * - Displays 3 cards at a time from a pool of 12 features
 * - Automatic rotation every 15 seconds (configurable)
 * - Typewriter animation for title and description text
 * - Smooth transitions between card sets
 * - Maintains existing styling and hover effects
 * - Responsive grid layout
 */

"use client";

import { useState, useEffect } from "react";
import {
  GitBranch,
  BarChart3,
  TrendingUp,
  Clock,
  Calendar,
  Activity,
  Sparkles,
  MessageSquare,
  Zap,
  Users,
  GitMerge,
  Gauge,
  LucideIcon,
} from "lucide-react";
import { useTypewriter } from "@/lib/hooks/useTypewriter";
import { IconName } from "@/lib/feature-cards-data";

interface FeatureCardData {
  title: string;
  description: string;
  iconName: IconName;
  gradientFrom: string;
  gradientTo: string;
}

interface FeatureCardProps {
  feature: FeatureCardData;
  cardKey: string;
}

/**
 * Icon mapping for serialization compatibility with Next.js
 * Maps string icon names to actual Lucide React icon components
 *
 * IMPORTANT: Icon names must match exactly with Lucide React exports
 */
const iconMap: Record<IconName, LucideIcon> = {
  GitBranch: GitBranch,
  BarChart3: BarChart3,
  TrendingUp: TrendingUp,
  Clock: Clock,
  Calendar: Calendar,
  Activity: Activity,
  Sparkles: Sparkles,
  MessageSquare: MessageSquare,
  Zap: Zap,
  Users: Users,
  GitMerge: GitMerge,
  Gauge: Gauge,
};

/**
 * Individual Feature Card Component
 *
 * Displays a single feature with typewriter animation for title and description.
 * The card maintains its appearance while text animates character by character.
 *
 * @param feature - The feature data including title, description, icon, and colors
 * @param cardKey - Unique key to force re-render when card changes
 */
function FeatureCard({ feature, cardKey }: FeatureCardProps) {
  const { displayText: displayTitle, isAnimating: isTitleAnimating } =
    useTypewriter({
      text: feature.title,
      eraseSpeed: 35,
      typeSpeed: 45,
      delayBetweenEraseAndType: 200,
    });

  const { displayText: displayDescription } = useTypewriter({
    text: feature.description,
    eraseSpeed: 25,
    typeSpeed: 30,
    delayBetweenEraseAndType: 400,
  });

  // Get the icon component from the map, with fallback to GitBranch
  const Icon = iconMap[feature.iconName] || GitBranch;

  // Ensure icon exists before rendering
  if (!Icon) {
    console.error(`Icon not found for: ${feature.iconName}`);
    return null;
  }

  // Extract gradient colors for inline styles (Tailwind JIT won't work with dynamic classes)
  const gradientFromColor = feature.gradientFrom.replace("from-", "");
  const gradientToColor = feature.gradientTo.replace("to-", "");

  // Map Tailwind color names to actual color values
  const getColorValue = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      "orange-500": "#f97316",
      "orange-600": "#ea580c",
      "sky-500": "#0ea5e9",
      "sky-600": "#0284c7",
      "teal-400": "#2dd4bf",
      "teal-500": "#14b8a6",
      "teal-600": "#0d9488",
      "amber-500": "#f59e0b",
      "cyan-500": "#06b6d4",
      "emerald-500": "#10b981",
      "blue-500": "#3b82f6",
      "green-500": "#22c55e",
      "yellow-500": "#eab308",
      "red-500": "#ef4444",
    };
    return colorMap[colorName] || "#f97316"; // Default to orange
  };

  const gradientStyle = {
    backgroundImage: `linear-gradient(to bottom right, ${getColorValue(
      gradientFromColor
    )}, ${getColorValue(gradientToColor)})`,
  };

  return (
    <div className="text-center backdrop-blur-md bg-white/40 rounded-2xl p-6 border border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 min-h-[220px] flex flex-col">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
        style={gradientStyle}
      >
        {Icon && <Icon className="w-8 h-8 text-white" />}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-2 min-h-[28px]">
        {displayTitle}
        {isTitleAnimating && <span className="animate-pulse ml-0.5">|</span>}
      </h3>
      <p className="text-sm text-gray-700 flex-1 min-h-[60px]">
        {displayDescription}
      </p>
    </div>
  );
}

interface RotatingFeatureCardsProps {
  features: FeatureCardData[];
  rotationInterval?: number;
}

/**
 * Main Rotating Feature Cards Container Component
 *
 * Manages the rotation of feature cards, displaying 3 at a time and cycling
 * through all available features at regular intervals.
 *
 * Features:
 * 1. Calculates which 3 cards to display based on current rotation index
 * 2. Rotates to the next set every rotationInterval milliseconds
 * 3. Smooth fade-out and fade-in transitions between card sets
 * 4. Uses unique keys to ensure proper re-rendering and animation reset
 * 5. Handles edge cases like wrapping around to the beginning
 *
 * Animation Flow:
 * - Fade out current cards (500ms)
 * - Change card set
 * - Fade in new cards (500ms)
 *
 * @param features - Array of all feature cards to rotate through
 * @param rotationInterval - Time in ms between rotations (default: 15000)
 */
export function RotatingFeatureCards({
  features,
  rotationInterval = 15000,
}: RotatingFeatureCardsProps) {
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayCards, setDisplayCards] = useState<FeatureCardData[]>([]);

  // Get current 3 cards to display
  const getCurrentCardSet = (index: number) => {
    const totalCards = features.length;
    const cards: FeatureCardData[] = [];

    for (let i = 0; i < 3; i++) {
      const cardIndex = (index * 3 + i) % totalCards;
      cards.push(features[cardIndex]);
    }

    return cards;
  };

  // Initialize display cards on mount
  useEffect(() => {
    setDisplayCards(getCurrentCardSet(0));
  }, []);

  // Rotate to next set automatically with fade transition
  useEffect(() => {
    const maxSets = Math.ceil(features.length / 3);

    const interval = setInterval(() => {
      // Start fade-out transition
      setIsTransitioning(true);

      // After fade-out completes, change cards and fade-in
      setTimeout(() => {
        const nextIndex = (currentSetIndex + 1) % maxSets;
        setCurrentSetIndex(nextIndex);
        setDisplayCards(getCurrentCardSet(nextIndex));

        // Trigger fade-in by ending transition
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50); // Small delay to ensure CSS transition triggers
      }, 500); // Match CSS transition duration
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [features.length, rotationInterval, currentSetIndex]);

  return (
    <div className="grid md:grid-cols-3 gap-8 relative z-10">
      {displayCards.map((feature, index) => (
        <div
          key={`card-${currentSetIndex}-${index}-${feature.title}`}
          className={`transition-all duration-500 ease-in-out transform ${
            isTransitioning
              ? "opacity-0 scale-95 translate-y-2"
              : "opacity-100 scale-100 translate-y-0"
          }`}
        >
          <FeatureCard
            feature={feature}
            cardKey={`card-${currentSetIndex}-${index}`}
          />
        </div>
      ))}
    </div>
  );
}
