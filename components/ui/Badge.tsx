/**
 * Badge Component
 *
 * A versatile badge/tag component for labels, status indicators, and inline code.
 * Supports multiple variants and sizes for different use cases.
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "backdrop-blur-md bg-white/60 border border-white/30 text-gray-900",
        primary:
          "bg-gradient-to-r from-purple-600 to-blue-600 text-white border-none",
        secondary: "bg-secondary text-secondary-foreground border border-input",
        success: "bg-green-100 text-green-800 border border-green-200",
        warning: "bg-yellow-100 text-yellow-800 border border-yellow-200",
        danger: "bg-red-100 text-red-800 border border-red-200",
        outline: "border border-input text-gray-700 hover:bg-accent",
        code: "backdrop-blur-md bg-white/40 border border-white/30 text-gray-900 font-mono",
      },
      size: {
        sm: "px-2 py-0.5 text-xs rounded",
        default: "px-3 py-1 text-sm rounded-lg",
        lg: "px-4 py-1.5 text-base rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /**
   * Whether this badge represents code/technical content
   * When true, renders as <code> element for better semantics
   */
  asCode?: boolean;
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, asCode = false, ...props }, ref) => {
    const classes = badgeVariants({ variant, size, className });

    // Use <code> element for code variant for better semantics
    if (asCode || variant === "code") {
      return <code ref={ref} className={classes} {...props} />;
    }

    // Use <span> for inline display (better than div)
    return <span ref={ref} className={classes} {...props} />;
  }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
