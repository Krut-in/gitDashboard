/**
 * Feature Cards Data Configuration
 * 
 * This file contains all feature card data for the landing page rotating carousel.
 * Each feature represents a key capability of the GitDash dashboard.
 * 
 * The icon names are strings rather than components to ensure compatibility with
 * Next.js server-side rendering and client component serialization.
 * 
 * Features are displayed in rotation, 3 at a time, showcasing the full range
 * of dashboard capabilities to landing page visitors.
 */

/**
 * Available icon names from lucide-react
 * These correspond to actual icon components imported in RotatingFeatureCards
 */
export type IconName = 
  | 'GitBranch'
  | 'BarChart3'
  | 'TrendingUp'
  | 'Clock'
  | 'Calendar'
  | 'Activity'
  | 'Sparkles'
  | 'MessageSquare'
  | 'Zap'
  | 'Users'
  | 'GitMerge'
  | 'Gauge';

/**
 * Feature Card Data Interface
 * 
 * @property title - Short, descriptive title for the feature (shown in bold)
 * @property description - Detailed description of the feature capability
 * @property iconName - Name of the Lucide icon to display
 * @property gradientFrom - Tailwind gradient start color class (e.g., 'from-purple-500')
 * @property gradientTo - Tailwind gradient end color class (e.g., 'to-blue-500')
 */
export interface FeatureCardData {
  title: string;
  description: string;
  iconName: IconName;
  gradientFrom: string;
  gradientTo: string;
}

/**
 * Complete Feature Cards Array
 * 
 * Contains 12 feature cards that showcase different aspects of the GitDash dashboard.
 * Cards rotate in sets of 3, providing comprehensive coverage of all major features.
 * 
 * Each feature includes:
 * - A descriptive title
 * - Detailed capability description
 * - Unique icon for visual identification
 * - Gradient colors matching the overall design system
 */
export const featureCards: FeatureCardData[] = [
  {
    title: 'Branch Analysis',
    description: 'Deep dive into any branch with commit history and contributor stats',
    iconName: 'GitBranch',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-blue-500',
  },
  {
    title: 'Visual Charts',
    description: 'Beautiful, interactive charts for commits and activity heatmaps',
    iconName: 'BarChart3',
    gradientFrom: 'from-pink-500',
    gradientTo: 'to-orange-500',
  },
  {
    title: 'Export Reports',
    description: 'Generate and download CSV reports for detailed analytics',
    iconName: 'TrendingUp',
    gradientFrom: 'from-green-500',
    gradientTo: 'to-teal-500',
  },
  {
    title: 'Advanced Timeline Analysis',
    description: 'Complete repository history with time range toggles and aggregated metrics',
    iconName: 'Clock',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-cyan-500',
  },
  {
    title: 'Gantt Charts',
    description: 'Visualize contribution timelines with interactive Gantt charts showing user activity',
    iconName: 'Calendar',
    gradientFrom: 'from-indigo-500',
    gradientTo: 'to-purple-500',
  },
  {
    title: 'Activity Heatmaps',
    description: 'GitHub-style heatmaps showing commit activity patterns over time',
    iconName: 'Activity',
    gradientFrom: 'from-green-400',
    gradientTo: 'to-emerald-500',
  },
  {
    title: 'AI Manager Report',
    description: 'AI-powered insights with team health scores and actionable recommendations',
    iconName: 'Sparkles',
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-fuchsia-500',
  },
  {
    title: 'Commit Message Analysis',
    description: 'Analyze commit message quality, patterns, and writing styles',
    iconName: 'MessageSquare',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-500',
  },
  {
    title: 'Multiple Analysis Modes',
    description: 'Choose from Blame, Commits, GitHub API, or Hybrid modes for accurate attribution',
    iconName: 'Zap',
    gradientFrom: 'from-yellow-500',
    gradientTo: 'to-red-500',
  },
  {
    title: 'Real-time Progress Streaming',
    description: 'Live progress updates during analysis with Server-Sent Events',
    iconName: 'Gauge',
    gradientFrom: 'from-cyan-500',
    gradientTo: 'to-blue-500',
  },
  {
    title: 'User Contribution Insights',
    description: 'Individual user metrics with weekly breakdowns and contribution patterns',
    iconName: 'Users',
    gradientFrom: 'from-rose-500',
    gradientTo: 'to-pink-500',
  },
  {
    title: 'Collaboration Patterns',
    description: 'Identify solo contributors, team dynamics, and file collaboration metrics',
    iconName: 'GitMerge',
    gradientFrom: 'from-teal-500',
    gradientTo: 'to-green-500',
  },
];
