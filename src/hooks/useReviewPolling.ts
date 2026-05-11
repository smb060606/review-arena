"use client";

import { useState, useEffect, useCallback } from "react";
import { ScenarioStatus } from "@/types/reviews";

export function useReviewPolling(scenarioId: number, polling: boolean) {
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

  // Always fetch once on mount to resolve PR numbers
  useEffect(() => {
    poll();
  }, [poll]);

  // Continue polling at interval only when enabled
  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(poll, 12000);
    return () => clearInterval(interval);
  }, [polling, poll]);

  const isComplete =
    status?.coderabbit.status === "complete" &&
    status?.copilot.status === "complete";

  return { status, isComplete, error, refresh: poll };
}
