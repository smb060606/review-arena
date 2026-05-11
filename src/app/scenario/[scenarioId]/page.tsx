"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { SCENARIOS, PROJECT_CONTEXT, prUrl } from "@/lib/pr-config";
import { useReviewPolling } from "@/hooks/useReviewPolling";
import { ReviewToolStatus } from "@/types/reviews";
import { ToolsBanner, ToolLabel } from "@/components/ToolsBanner";

const STATUS_CONFIG: Record<ReviewToolStatus, { label: string; color: string; bg: string }> = {
  idle: { label: "Not Started", color: "text-gray-400", bg: "bg-gray-800" },
  pending: { label: "Pending", color: "text-yellow-400", bg: "bg-yellow-900/30" },
  in_progress: { label: "Reviewing...", color: "text-blue-400", bg: "bg-blue-900/30" },
  complete: { label: "Complete", color: "text-green-400", bg: "bg-green-900/30" },
  error: { label: "Error", color: "text-red-400", bg: "bg-red-900/30" },
};

export default function ScenarioPage() {
  const params = useParams();
  const router = useRouter();
  const scenarioId = parseInt(params.scenarioId as string);
  const scenario = SCENARIOS.find((s) => s.id === scenarioId);

  const [triggered, setTriggered] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [triggerError, setTriggerError] = useState("");

  const { status, isComplete, error: pollError } = useReviewPolling(scenarioId, triggered);

  if (!scenario) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10 text-center">
        <h1 className="text-2xl font-bold">Scenario not found</h1>
      </div>
    );
  }

  async function handleTrigger() {
    setTriggering(true);
    setTriggerError("");
    try {
      const res = await fetch("/api/reviews/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setTriggerError(data.error || "Failed to trigger reviews");
        setTriggering(false);
        return;
      }
      setTriggered(true);
    } catch {
      setTriggerError("Network error");
    }
    setTriggering(false);
  }

  // Only show live review status after user triggers — before that, always show "idle"
  const crStatus = triggered ? (status?.coderabbit.status || "idle") : "idle";
  const copilotStatus = triggered ? (status?.copilot.status || "idle") : "idle";

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <ToolsBanner />

      <div className="mb-2 text-sm text-[var(--muted-foreground)]">
        <button onClick={() => router.push("/dashboard")} className="hover:text-[var(--foreground)]">
          Dashboard
        </button>
        {" / "}
        Scenario {scenario.id}
      </div>

      <h1 className="text-2xl font-bold mb-2">{scenario.title}</h1>
      <p className="text-[var(--muted-foreground)] mb-6">{scenario.description}</p>

      {/* PR Context: Before / After / Files */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 mb-6">
        <h3 className="font-semibold mb-4">Pull Request Context</h3>

        <div className="space-y-4 text-sm">
          <div>
            <div className="font-medium text-[var(--foreground)] mb-1">Project being modified</div>
            <p className="text-[var(--muted-foreground)]">
              <a href={PROJECT_CONTEXT.repoUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">{PROJECT_CONTEXT.name}</a>
              {" "}&mdash; {PROJECT_CONTEXT.description} Built with {PROJECT_CONTEXT.techStack}.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[var(--muted)] rounded-lg p-4">
              <div className="font-medium text-[var(--foreground)] mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-500 inline-block"></span>
                Before this PR
              </div>
              <p className="text-[var(--muted-foreground)] text-xs">{scenario.beforeState}</p>
            </div>
            <div className="bg-[var(--muted)] rounded-lg p-4">
              <div className="font-medium text-[var(--foreground)] mb-1 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                What this PR adds
              </div>
              <p className="text-[var(--muted-foreground)] text-xs">{scenario.whatThePrDoes}</p>
            </div>
          </div>

          <div>
            <div className="font-medium text-[var(--foreground)] mb-2">Files changed ({scenario.filesChanged.length})</div>
            <div className="grid gap-1">
              {scenario.filesChanged.map((file, i) => {
                const isNew = file.includes("(new");
                const isModified = file.includes("(modified");
                return (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className={`shrink-0 mt-0.5 px-1.5 py-0.5 rounded font-mono text-[10px] ${
                      isNew ? "bg-green-900/40 text-green-400" :
                      isModified ? "bg-yellow-900/40 text-yellow-400" :
                      "bg-gray-900/40 text-gray-400"
                    }`}>
                      {isNew ? "NEW" : isModified ? "MOD" : "FILE"}
                    </span>
                    <span className="text-[var(--muted-foreground)] font-mono">{file}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bug inventory */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 mb-6">
        <h3 className="font-semibold mb-1">Injected Bugs ({scenario.injectedBugs.length})</h3>
        <p className="text-xs text-[var(--muted-foreground)] mb-4">
          These bugs were deliberately placed in the code. Both review tools will analyze the same code independently
          to see how many they can find.
        </p>
        <div className="grid gap-2">
          {scenario.injectedBugs.map((bug, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className={`w-16 shrink-0 text-xs font-mono ${
                bug.severity === "CRITICAL" ? "text-red-400" :
                bug.severity === "HIGH" ? "text-orange-400" :
                bug.severity === "MEDIUM" ? "text-yellow-400" : "text-blue-400"
              }`}>
                {bug.severity}
              </span>
              <span className="w-24 shrink-0 text-xs text-[var(--muted-foreground)]">{bug.category}</span>
              <span className="text-[var(--muted-foreground)]">{bug.description}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trigger + Status */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Review Status</h3>
          {!triggered && (
            <button
              onClick={handleTrigger}
              disabled={triggering}
              className="px-5 py-2 bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {triggering ? "Triggering..." : "Trigger Reviews"}
            </button>
          )}
          {isComplete && (
            <button
              onClick={() => router.push(`/compare/${scenarioId}`)}
              className="px-5 py-2 bg-green-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              View Comparison
            </button>
          )}
        </div>
        <p className="text-xs text-[var(--muted-foreground)] mb-4">
          Clicking &quot;Trigger Reviews&quot; sends the PR to both tools simultaneously. Each tool reviews its own
          isolated copy &mdash; they cannot see each other&apos;s findings. Reviews typically take 5-7 minutes.
        </p>

        {triggerError && (
          <p className="text-[var(--destructive)] text-sm mb-4">{triggerError}</p>
        )}
        {pollError && (
          <p className="text-[var(--warning)] text-sm mb-4">{pollError}</p>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg border border-[var(--border)] ${STATUS_CONFIG[crStatus].bg}`}>
            <div className="mb-2"><ToolLabel tool="coderabbit" /></div>
            <div className={`font-semibold ${STATUS_CONFIG[crStatus].color}`}>
              {STATUS_CONFIG[crStatus].label}
            </div>
            {status?.coderabbit.commentCount !== undefined && status.coderabbit.commentCount > 0 && (
              <div className="text-xs text-[var(--muted-foreground)] mt-1">
                {status.coderabbit.commentCount} comments
              </div>
            )}
            {status?.coderabbit.prNumber ? (
              <a
                href={prUrl(status.coderabbit.prNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-xs text-[var(--accent)] hover:underline"
              >
                View PR #{status.coderabbit.prNumber} on GitHub &rarr;
              </a>
            ) : null}
          </div>
          <div className={`p-4 rounded-lg border border-[var(--border)] ${STATUS_CONFIG[copilotStatus].bg}`}>
            <div className="mb-2"><ToolLabel tool="copilot" /></div>
            <div className={`font-semibold ${STATUS_CONFIG[copilotStatus].color}`}>
              {STATUS_CONFIG[copilotStatus].label}
            </div>
            {status?.copilot.reviewCount !== undefined && status.copilot.reviewCount > 0 && (
              <div className="text-xs text-[var(--muted-foreground)] mt-1">
                {status.copilot.reviewCount} reviews
              </div>
            )}
            {status?.copilot.prNumber ? (
              <a
                href={prUrl(status.copilot.prNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-xs text-[var(--accent)] hover:underline"
              >
                View PR #{status.copilot.prNumber} on GitHub &rarr;
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
