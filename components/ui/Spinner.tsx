/**
 * Spinner Component
 *
 * A loading spinner to show when data is being fetched.
 * Provides visual feedback during asynchronous operations.
 * Features a gradient design matching the application theme.
 */

import * as React from "react";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "w-5 h-5 border-2",
  md: "w-10 h-10 border-3",
  lg: "w-16 h-16 border-4",
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
        className={`${sizeClasses[size]} border-purple-200 border-t-purple-600 rounded-full animate-spin`}
        style={{
          borderRightColor: "rgb(147 51 234)",
          borderBottomColor: "rgb(59 130 246)",
        }}
      />
    </div>
  );
}
