/**
 * ProgressBar Component
 *
 * A reusable progress bar component with consistent styling.
 * Supports different variants and sizes for various use cases.
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

const progressContainerVariants = cva("w-full rounded-full overflow-hidden", {
  variants: {
    variant: {
      default: "backdrop-blur-sm bg-white/40 border border-white/20",
      solid: "bg-gray-200",
      subtle: "bg-gray-100",
    },
    size: {
      sm: "h-1.5",
      default: "h-2.5",
      lg: "h-3",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

const progressBarVariants = cva(
  "h-full transition-all duration-300 ease-out rounded-full",
  {
    variants: {
      barStyle: {
        gradient: "bg-gradient-to-r from-purple-600 to-blue-600",
        solid: "bg-primary",
        success: "bg-green-500",
        warning: "bg-yellow-500",
        danger: "bg-red-500",
      },
    },
    defaultVariants: {
      barStyle: "gradient",
    },
  }
);

export interface ProgressBarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressContainerVariants>,
    VariantProps<typeof progressBarVariants> {
  value: number;
  max?: number;
  showLabel?: boolean;
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      className,
      variant,
      size,
      barStyle,
      value,
      max = 100,
      showLabel = false,
      ...props
    },
    ref
  ) => {
    // Validate and sanitize input values to prevent NaN or invalid percentages
    const safeValue = typeof value === "number" && !isNaN(value) ? value : 0;
    const safeMax =
      typeof max === "number" && !isNaN(max) && max > 0 ? max : 100;
    const percentage = Math.min(Math.max((safeValue / safeMax) * 100, 0), 100);

    return (
      <div className="w-full" ref={ref} {...props}>
        <div
          className={progressContainerVariants({ variant, size, className })}
        >
          <div
            className={progressBarVariants({ barStyle })}
            style={{ width: `${percentage}%` }}
            role="progressbar"
            aria-valuenow={value}
            aria-valuemin={0}
            aria-valuemax={max}
            aria-label={
              showLabel ? `${Math.round(percentage)}% complete` : undefined
            }
          />
        </div>
        {showLabel && (
          <p className="text-sm font-medium text-gray-600 mt-2 text-center">
            {Math.round(percentage)}%
          </p>
        )}
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";

export { ProgressBar, progressContainerVariants, progressBarVariants };
