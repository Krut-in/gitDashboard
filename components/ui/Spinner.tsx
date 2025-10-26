/**
 * Spinner Component
 *
 * A loading spinner to show when data is being fetched.
 * Provides visual feedback during asynchronous operations.
 */

import * as React from "react";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-4 h-4 border-2",
  md: "w-8 h-8 border-2",
  lg: "w-12 h-12 border-3",
};

export function Spinner({
  size = "md",
  className = "",
  ...props
}: SpinnerProps) {
  return (
    <div
      className={`flex items-center justify-center ${className}`}
      {...props}
      role="status"
      aria-label="Loading"
    >
      <div
        className={`${sizeClasses[size]} border-gray-300 border-t-primary rounded-full animate-spin`}
      />
    </div>
  );
}
