"use client";

import { SCENARIOS, PROJECT_CONTEXT } from "@/lib/pr-config";
import Link from "next/link";
import { useState } from "react";
import { ToolsBanner } from "@/components/ToolsBanner";

const CATEGORY_COLORS: Record<string, string> = {
  Security: "bg-red-900/30 text-red-300 border-red-800",
  Logic: "bg-purple-900/30 text-purple-300 border-purple-800",
  Performance: "bg-yellow-900/30 text-yellow-300 border-yellow-800",
  "Best Practice": "bg-blue-900/30 text-blue-300 border-blue-800",
};

export default function DashboardPage() {
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetResult, setResetResult] = useState<{
    closed: string[];
    created: string[];
    errors: string[];
  } | null>(null);

  async function handleReset() {
    setResetting(true);
    setResetResult(null);
    try {
      const res = await fetch("/api/environment/reset", { method: "POST" });
      const data = await res.json();
      setResetResult(data);
    } catch {
      setResetResult({ closed: [], created: [], errors: ["Network error during reset"] });
    }
    setResetting(false);
    setShowResetConfirm(false);
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <ToolsBanner />

      {/* What is this page */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-3">Code Review Comparison</h1>
        <p className="text-[var(--muted-foreground)] max-w-3xl">
          This tool lets you see how two AI code review tools &mdash; CodeRabbit and GitHub
          Copilot &mdash; perform on the exact same code changes. Each tool reviews its own
          isolated copy of the pull request so neither can see the other&apos;s findings.
          After both reviews complete, an independent AI analysis compares what each tool caught.
        </p>
      </div>

      {/* About the project being reviewed */}
      <div className="mb-8 p-6 bg-[var(--card)] border border-[var(--border)] rounded-xl">
        <h2 className="text-lg font-semibold mb-3">The project being reviewed</h2>
        <div className="grid grid-cols-[1fr_auto] gap-6">
          <div className="space-y-3 text-sm text-[var(--muted-foreground)]">
            <p>
              <span className="font-medium text-[var(--foreground)]">{PROJECT_CONTEXT.name}</span> &mdash; {PROJECT_CONTEXT.description}
            </p>
            <p>
              <span className="font-medium text-[var(--foreground)]">Tech stack:</span> {PROJECT_CONTEXT.techStack}
            </p>
            <p>
              <span className="font-medium text-[var(--foreground)]">Current state of the codebase (main branch):</span>{" "}
              {PROJECT_CONTEXT.baselineState}
            </p>
          </div>
          <a
            href={PROJECT_CONTEXT.repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="self-start text-sm px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)] transition-colors whitespace-nowrap"
          >
            View on GitHub &rarr;
          </a>
        </div>
      </div>

      {/* How it works — moved above scenarios */}
      <div className="mb-8 p-6 bg-[var(--card)] border border-[var(--border)] rounded-xl">
        <h3 className="font-semibold mb-3">How it works</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--muted-foreground)]">
          <li><span className="font-medium text-[var(--foreground)]">Pick a scenario</span> &mdash; each one is a pull request that adds a new feature to the TeamForge API, with realistic bugs intentionally injected into the code</li>
          <li><span className="font-medium text-[var(--foreground)]">Trigger reviews</span> &mdash; this sends the PR to both CodeRabbit and GitHub Copilot simultaneously, each reviewing their own isolated copy</li>
          <li><span className="font-medium text-[var(--foreground)]">Wait for results</span> &mdash; both tools analyze the code independently (typically 5-7 minutes each)</li>
          <li><span className="font-medium text-[var(--foreground)]">Compare findings</span> &mdash; see what each tool found side-by-side, then generate a neutral AI analysis of their performance</li>
          <li><span className="font-medium text-[var(--foreground)]">Reset &amp; repeat</span> &mdash; after reviewing the results, reset the environment to start fresh with new pull requests</li>
        </ol>
      </div>

      {/* Scenarios */}
      <h2 className="text-lg font-semibold mb-4">Choose a scenario to compare</h2>
      <div className="grid gap-6 mb-8">
        {SCENARIOS.map((scenario) => {
          const bugsByCategory: Record<string, number> = {};
          for (const bug of scenario.injectedBugs) {
            bugsByCategory[bug.category] = (bugsByCategory[bug.category] || 0) + 1;
          }

          return (
            <Link
              key={scenario.id}
              href={`/scenario/${scenario.id}`}
              className="block bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--accent)] transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xs text-[var(--muted-foreground)] mb-1">
                    Scenario {scenario.id} of {SCENARIOS.length}
                  </div>
                  <h3 className="text-xl font-semibold">{scenario.title}</h3>
                </div>
                <div className="text-sm font-mono bg-[var(--muted)] px-3 py-1 rounded-lg shrink-0">
                  {scenario.injectedBugs.length} bugs injected
                </div>
              </div>

              <p className="text-sm text-[var(--muted-foreground)] mb-3">
                {scenario.description}
              </p>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-xs font-medium text-[var(--foreground)]">Before this PR:</span>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-2">{scenario.beforeState}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-[var(--foreground)]">What this PR adds:</span>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5 line-clamp-2">{scenario.whatThePrDoes}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {Object.entries(bugsByCategory).map(([category, count]) => (
                  <span
                    key={category}
                    className={`text-xs px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[category] || "bg-gray-900/30 text-gray-300 border-gray-800"}`}
                  >
                    {category}: {count}
                  </span>
                ))}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Reset environment */}
      <div className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-xl">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold mb-1">Reset Comparison Environment</h3>
            <p className="text-sm text-[var(--muted-foreground)] max-w-2xl">
              Already ran a comparison? Reset the environment to start fresh. This is useful when you want
              to re-run the comparison from scratch or demo the tool to someone new.
            </p>
          </div>
          {!showResetConfirm && !resetResult && (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="shrink-0 px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
            >
              Reset Environment
            </button>
          )}
        </div>

        {/* Confirmation */}
        {showResetConfirm && (
          <div className="mt-4 p-4 bg-[var(--muted)] rounded-lg border border-yellow-800/50">
            <p className="text-sm font-medium text-yellow-400 mb-2">Are you sure?</p>
            <p className="text-sm text-[var(--muted-foreground)] mb-1">Resetting will:</p>
            <ul className="text-sm text-[var(--muted-foreground)] list-disc list-inside mb-4 space-y-1">
              <li><span className="font-medium text-[var(--foreground)]">Close</span> all 6 open pull requests on GitHub (without merging them)</li>
              <li><span className="font-medium text-[var(--foreground)]">Discard</span> all review comments that CodeRabbit and Copilot posted on those PRs</li>
              <li><span className="font-medium text-[var(--foreground)]">Create</span> 6 fresh pull requests from the same branches with the same code</li>
              <li>The new PRs will have <span className="font-medium text-[var(--foreground)]">no reviews yet</span>, ready for a new comparison run</li>
            </ul>
            <p className="text-xs text-[var(--muted-foreground)] mb-4">
              The underlying code and bugs are unchanged &mdash; only the PRs and their review comments are replaced.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                disabled={resetting}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {resetting ? "Resetting..." : "Confirm Reset"}
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm hover:bg-[var(--muted)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Reset result */}
        {resetResult && (
          <div className="mt-4 p-4 bg-[var(--muted)] rounded-lg">
            <p className="text-sm font-medium text-green-400 mb-3">Environment reset complete</p>

            {resetResult.closed.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-[var(--foreground)] mb-1">Closed PRs (reviews discarded):</p>
                <ul className="text-xs text-[var(--muted-foreground)] space-y-0.5">
                  {resetResult.closed.map((pr, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></span>
                      {pr}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {resetResult.created.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-[var(--foreground)] mb-1">New PRs created (ready for review):</p>
                <ul className="text-xs text-[var(--muted-foreground)] space-y-0.5">
                  {resetResult.created.map((pr, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0"></span>
                      {pr}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {resetResult.errors.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-red-400 mb-1">Errors:</p>
                <ul className="text-xs text-red-300 space-y-0.5">
                  {resetResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-3 text-xs text-[var(--muted-foreground)]">
              Fresh PRs are ready. Pick a scenario above to start a new comparison.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
