/**
 * Progress Panel Component
 *
 * Connects to the Server-Sent Events (SSE) stream to display real-time
 * progress updates during repository analysis.
 * Shows progress bar, percentage, current status, and event log.
 */

"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { AlertTriangle, CheckCircle, Loader } from "lucide-react";

interface ProgressEvent {
  type: "progress" | "complete" | "error";
  percent: number;
  message: string;
  currentPage?: number;
  totalPages?: number;
  processedCommits?: number;
  totalCommits?: number;
}

interface ProgressPanelProps {
  owner: string;
  repo: string;
  branch: string;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export function ProgressPanel({
  owner,
  repo,
  branch,
  onComplete,
  onError,
}: ProgressPanelProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<
    "idle" | "running" | "complete" | "error"
  >("idle");
  const [message, setMessage] = useState("Initializing...");
  const [logs, setLogs] = useState<ProgressEvent[]>([]);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    connectToStream();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [owner, repo, branch]);

  function connectToStream() {
    const url = `/api/github/analyze/stream?owner=${encodeURIComponent(
      owner
    )}&repo=${encodeURIComponent(repo)}&branch=${encodeURIComponent(branch)}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    setStatus("running");

    eventSource.onmessage = event => {
      try {
        const data: ProgressEvent = JSON.parse(event.data);

        setProgress(data.percent);
        setMessage(data.message);
        setLogs(prev => [...prev, data]);

        if (data.type === "complete") {
          setStatus("complete");
          eventSource.close();
          if (onComplete) {
            onComplete();
          }
        } else if (data.type === "error") {
          setStatus("error");
          eventSource.close();
          if (onError) {
            onError(data.message);
          }
        }
      } catch (error) {
        console.error("Failed to parse SSE event:", error);
      }
    };

    eventSource.onerror = error => {
      console.error("SSE connection error:", error);
      setStatus("error");
      setMessage("Connection lost");
      eventSource.close();

      if (onError) {
        onError("Connection to server lost");
      }
    };
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status === "running" && <Loader className="w-5 h-5 animate-spin" />}
          {status === "complete" && (
            <CheckCircle className="w-5 h-5 text-green-600" />
          )}
          {status === "error" && (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          )}
          Analysis Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{message}</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                status === "complete"
                  ? "bg-green-600"
                  : status === "error"
                  ? "bg-red-600"
                  : "bg-primary"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Event Log */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Event Log</h4>
          <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto space-y-1">
            {logs.length === 0 ? (
              <p className="text-sm text-gray-500">Waiting for events...</p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={`text-sm ${
                    log.type === "error"
                      ? "text-red-600"
                      : log.type === "complete"
                      ? "text-green-600"
                      : "text-gray-700"
                  }`}
                >
                  <span className="text-gray-400 mr-2">
                    [{new Date().toLocaleTimeString()}]
                  </span>
                  {log.message}
                  {log.currentPage && log.totalPages && (
                    <span className="ml-2 text-gray-500">
                      (Page {log.currentPage}/{log.totalPages})
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Status Message */}
        {status === "complete" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-800">
              ✓ Analysis completed successfully! Results are now available
              below.
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              ✗ Analysis failed. Please try again or check the logs.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
