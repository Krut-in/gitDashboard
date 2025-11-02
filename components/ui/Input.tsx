/**
 * Input Component
 *
 * A reusable input component with consistent styling matching the design system.
 * Supports various input types and integrates with the glassmorphism theme.
 */

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

const inputVariants = cva(
  "w-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "backdrop-blur-md bg-white/40 border border-white/30 hover:bg-white/50 focus-visible:bg-white/60 focus-visible:border-white/50",
        solid:
          "bg-white border border-input hover:border-ring/50 focus-visible:border-ring",
        ghost:
          "bg-transparent border border-input hover:bg-accent focus-visible:bg-accent focus-visible:border-ring",
      },
      inputSize: {
        default: "h-10 px-4 py-2 text-sm",
        sm: "h-9 px-3 py-2 text-sm",
        lg: "h-11 px-4 py-2 text-base",
      },
      roundedness: {
        default: "rounded-md",
        lg: "rounded-lg",
        full: "rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
      roundedness: "lg",
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, inputSize, roundedness, ...props }, ref) => {
    return (
      <input
        className={inputVariants({
          variant,
          inputSize,
          roundedness,
          className,
        })}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input, inputVariants };
