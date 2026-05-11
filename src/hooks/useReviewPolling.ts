"use client";

import { useState, useEffect, useCallback } from "react";
import { ScenarioStatus } from "@/types/reviews";

export function useReviewPolling(scenarioId: number, triggered: boolean) {
  const [status, setStatus] = useState<ScenarioStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews/status/${scenarioId}`);
      if (!res.ok) {
        setError("Failed to check status");
        return;
      }
      const data = await res.json();
      setStatus(data);
      setError(null);
    } catch {
      setError("Network error while polling");
    }
  }, [scenarioId]);

  // Always fetch once on mount to get current state
  useEffect(() => {
    poll();
  }, [poll]);

  // Auto-detect if reviews are active from the fetched status
  const reviewsActive = triggered ||
    (status?.coderabbit.status !== undefined && status.coderabbit.status !== "idle") ||
    (status?.copilot.status !== undefined && status.copilot.status !== "idle");

  const isComplete =
    status?.coderabbit.status === "complete" &&
    status?.copilot.status === "complete";

  // Poll continuously when reviews are active but not yet complete
  useEffect(() => {
    if (!reviewsActive || isComplete) return;
    const interval = setInterval(poll, 12000);
    return () => clearInterval(interval);
  }, [reviewsActive, isComplete, poll]);

  return { status, isComplete, error, refresh: poll };
}
