import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // Heatmap color classes - ensuring all intensity levels are included
    'bg-gray-100',
    'bg-purple-200', 'bg-purple-400', 'bg-purple-500', 'bg-purple-600',
    'bg-emerald-200', 'bg-emerald-400', 'bg-emerald-500', 'bg-emerald-600',
    'bg-red-200', 'bg-red-400', 'bg-red-500', 'bg-red-600',
    'bg-sky-200', 'bg-sky-400', 'bg-sky-500', 'bg-sky-600',
    'bg-teal-200', 'bg-teal-400', 'bg-teal-500', 'bg-teal-600',
    'bg-orange-200', 'bg-orange-400', 'bg-orange-500', 'bg-orange-600',
    'bg-amber-200', 'bg-amber-400', 'bg-amber-500', 'bg-amber-600',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Custom metric colors for charts and visualizations - Bright vibrant theme
        'metric-commits': '#9333ea', // purple-600
        'metric-additions': '#10b981', // emerald-500
        'metric-deletions': '#ef4444', // red-500
        'metric-net': '#0ea5e9', // sky-500
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
};

export default config;
