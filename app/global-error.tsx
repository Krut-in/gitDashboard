/**
 * Global Error Boundary
 *
 * Catches errors at the root level of the application.
 * This is a fallback for errors not caught by other error boundaries.
 * Displays a minimal error page when something goes critically wrong.
 */

"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            backgroundColor: "#f9fafb",
          }}
        >
          <div
            style={{
              maxWidth: "28rem",
              width: "100%",
              backgroundColor: "white",
              padding: "2rem",
              borderRadius: "0.5rem",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                marginBottom: "1rem",
              }}
            >
              Something went wrong!
            </h2>
            <p
              style={{
                color: "#6b7280",
                marginBottom: "1.5rem",
              }}
            >
              {error.message || "An unexpected error occurred"}
            </p>
            <button
              onClick={reset}
              style={{
                width: "100%",
                padding: "0.5rem 1rem",
                backgroundColor: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "0.375rem",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: "500",
              }}
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
