"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { SCENARIOS } from "@/lib/pr-config";
import { ScenarioResults, ComparisonAnalysis } from "@/types/reviews";

type LLMProvider = "anthropic" | "openai";

export default function ComparePage() {
  const params = useParams();
  const router = useRouter();
  const scenarioId = parseInt(params.scenarioId as string);
  const scenario = SCENARIOS.find((s) => s.id === scenarioId);

  const [results, setResults] = useState<ScenarioResults | null>(null);
  const [analysis, setAnalysis] = useState<(ComparisonAnalysis & { analyzedBy?: string }) | null>(null);
  const [loadingResults, setLoadingResults] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [error, setError] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<LLMProvider>("anthropic");

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch(`/api/reviews/results/${scenarioId}`);
        if (!res.ok) throw new Error("Failed to fetch results");
        setResults(await res.json());
      } catch (err) {
        setError((err as Error).message);
      }
      setLoadingResults(false);
    }
    fetchResults();
  }, [scenarioId]);

  async function handleAnalyze() {
    setLoadingAnalysis(true);
    setError("");
    try {
      const res = await fetch(`/api/reviews/analyze/${scenarioId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selectedProvider }),
      });
      if (!res.ok) throw new Error("Failed to generate analysis");
      setAnalysis(await res.json());
    } catch (err) {
      setError((err as Error).message);
    }
    setLoadingAnalysis(false);
  }

  if (!scenario) {
    return <div className="max-w-6xl mx-auto px-6 py-10 text-center"><h1 className="text-2xl font-bold">Scenario not found</h1></div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-2 text-sm text-[var(--muted-foreground)]">
        <button onClick={() => router.push("/dashboard")} className="hover:text-[var(--foreground)]">Dashboard</button>
        {" / "}
        <button onClick={() => router.push(`/scenario/${scenarioId}`)} className="hover:text-[var(--foreground)]">Scenario {scenario.id}</button>
        {" / "}
        Comparison
      </div>

      <h1 className="text-2xl font-bold mb-2">Comparison: {scenario.title}</h1>

      {error && <p className="text-[var(--destructive)] mb-4">{error}</p>}

      {loadingResults ? (
        <div className="text-[var(--muted-foreground)] py-10 text-center">Loading review results...</div>
      ) : results ? (
        <>
          {/* Side-by-side results */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {/* CodeRabbit */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
              <h3 className="font-semibold text-purple-400 mb-3">CodeRabbit</h3>
              <div className="text-sm text-[var(--muted-foreground)] mb-2">
                {results.coderabbit.rawCommentCount} total comments
              </div>
              <div className="text-sm mb-4 max-h-60 overflow-y-auto whitespace-pre-wrap bg-[var(--muted)] p-3 rounded-lg">
                {results.coderabbit.summary.substring(0, 1000)}
                {results.coderabbit.summary.length > 1000 && "..."}
              </div>
              <h4 className="text-sm font-medium mb-2">Inline Comments ({results.coderabbit.inlineComments.length})</h4>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {results.coderabbit.inlineComments.map((c, i) => (
                  <div key={i} className="text-xs bg-[var(--muted)] p-2 rounded">
                    {c.path && <div className="font-mono text-purple-300">{c.path}{c.line ? `:${c.line}` : ""}</div>}
                    <div className="text-[var(--muted-foreground)] mt-1">{c.body.substring(0, 200)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Copilot */}
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
              <h3 className="font-semibold text-blue-400 mb-3">GitHub Copilot</h3>
              <div className="text-sm text-[var(--muted-foreground)] mb-2">
                {results.copilot.rawCommentCount} total comments
              </div>
              <div className="text-sm mb-4 max-h-60 overflow-y-auto whitespace-pre-wrap bg-[var(--muted)] p-3 rounded-lg">
                {results.copilot.summary.substring(0, 1000)}
                {results.copilot.summary.length > 1000 && "..."}
              </div>
              <h4 className="text-sm font-medium mb-2">Inline Comments ({results.copilot.inlineComments.length})</h4>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {results.copilot.inlineComments.map((c, i) => (
                  <div key={i} className="text-xs bg-[var(--muted)] p-2 rounded">
                    {c.path && <div className="font-mono text-blue-300">{c.path}{c.line ? `:${c.line}` : ""}</div>}
                    <div className="text-[var(--muted-foreground)] mt-1">{c.body.substring(0, 200)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Analysis */}
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5">
            <h3 className="font-semibold mb-1">AI-Generated Neutral Analysis</h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-5">
              The LLM below is used only to read and compare the reviews that CodeRabbit and GitHub Copilot
              already completed. It does not influence or participate in the code reviews themselves &mdash;
              those are performed independently by each tool on their own copy of the PR.
            </p>

            {!analysis && (
              <div className="flex items-end gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Analysis model</label>
                  <div className="flex rounded-lg border border-[var(--border)] overflow-hidden">
                    <button
                      onClick={() => setSelectedProvider("anthropic")}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        selectedProvider === "anthropic"
                          ? "bg-[var(--accent)] text-white"
                          : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      Claude (Anthropic)
                    </button>
                    <button
                      onClick={() => setSelectedProvider("openai")}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        selectedProvider === "openai"
                          ? "bg-[var(--accent)] text-white"
                          : "bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                      }`}
                    >
                      GPT-4o (OpenAI)
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={loadingAnalysis}
                  className="px-5 py-2 bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {loadingAnalysis ? "Analyzing..." : "Generate Analysis"}
                </button>
              </div>
            )}

            {loadingAnalysis && (
              <div className="text-[var(--muted-foreground)] text-center py-8">
                Analyzing findings from both tools using {selectedProvider === "anthropic" ? "Claude" : "GPT-4o"}... This may take 30-60 seconds.
              </div>
            )}

            {analysis && (
              <div className="space-y-6">
                <div className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)] px-3 py-1.5 rounded-lg inline-block">
                  Analysis generated by {analysis.analyzedBy === "anthropic" ? "Claude (Anthropic)" : "GPT-4o (OpenAI)"}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-green-400 mb-2">Summary</h4>
                  <p className="text-sm text-[var(--muted-foreground)]">{analysis.summary}</p>
                </div>

                {analysis.overlapping_findings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-yellow-400 mb-2">
                      Overlapping Findings ({analysis.overlapping_findings.length})
                    </h4>
                    <div className="space-y-1">
                      {analysis.overlapping_findings.map((f, i) => (
                        <div key={i} className="text-xs bg-[var(--muted)] p-2 rounded flex gap-2">
                          <span className="text-yellow-400 font-mono w-16 shrink-0">{f.severity}</span>
                          <span>{f.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.coderabbit_unique.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-purple-400 mb-2">
                      CodeRabbit Only ({analysis.coderabbit_unique.length})
                    </h4>
                    <div className="space-y-1">
                      {analysis.coderabbit_unique.map((f, i) => (
                        <div key={i} className="text-xs bg-[var(--muted)] p-2 rounded flex gap-2">
                          <span className="text-purple-400 font-mono w-16 shrink-0">{f.severity}</span>
                          <span>{f.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.copilot_unique.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-blue-400 mb-2">
                      Copilot Only ({analysis.copilot_unique.length})
                    </h4>
                    <div className="space-y-1">
                      {analysis.copilot_unique.map((f, i) => (
                        <div key={i} className="text-xs bg-[var(--muted)] p-2 rounded flex gap-2">
                          <span className="text-blue-400 font-mono w-16 shrink-0">{f.severity}</span>
                          <span>{f.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[var(--muted)] p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-purple-400 mb-2">CodeRabbit Assessment</h4>
                    <p className="text-sm text-[var(--muted-foreground)]">{analysis.quality_assessment.coderabbit}</p>
                  </div>
                  <div className="bg-[var(--muted)] p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-400 mb-2">Copilot Assessment</h4>
                    <p className="text-sm text-[var(--muted-foreground)]">{analysis.quality_assessment.copilot}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
