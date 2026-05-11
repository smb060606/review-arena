import { SCENARIOS } from "@/lib/pr-config";
import Link from "next/link";

const SEVERITY_COLORS: Record<string, string> = {
  CRITICAL: "text-red-400",
  HIGH: "text-orange-400",
  MEDIUM: "text-yellow-400",
  LOW: "text-blue-400",
};

const CATEGORY_COLORS: Record<string, string> = {
  Security: "bg-red-900/30 text-red-300 border-red-800",
  Logic: "bg-purple-900/30 text-purple-300 border-purple-800",
  Performance: "bg-yellow-900/30 text-yellow-300 border-yellow-800",
  "Best Practice": "bg-blue-900/30 text-blue-300 border-blue-800",
};

export default function DashboardPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-3">Code Review Comparison</h1>
        <p className="text-[var(--muted-foreground)] max-w-2xl">
          Select a scenario below to trigger AI code reviews from CodeRabbit and
          GitHub Copilot on identical pull requests. Both tools review the same
          code independently, then we compare their findings.
        </p>
      </div>

      <div className="grid gap-6">
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
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs text-[var(--muted-foreground)] mb-1">
                    Scenario {scenario.id}
                  </div>
                  <h2 className="text-xl font-semibold">{scenario.title}</h2>
                </div>
                <div className="text-sm font-mono bg-[var(--muted)] px-3 py-1 rounded-lg">
                  {scenario.injectedBugs.length} bugs
                </div>
              </div>

              <p className="text-[var(--muted-foreground)] text-sm mb-4 line-clamp-2">
                {scenario.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {Object.entries(bugsByCategory).map(([category, count]) => (
                  <span
                    key={category}
                    className={`text-xs px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[category] || "bg-gray-900/30 text-gray-300 border-gray-800"}`}
                  >
                    {category}: {count}
                  </span>
                ))}
              </div>

              <div className="text-xs text-[var(--muted-foreground)]">
                <span className="font-medium text-[var(--foreground)]">PR:</span>{" "}
                {scenario.prTitle}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-10 p-6 bg-[var(--card)] border border-[var(--border)] rounded-xl">
        <h3 className="font-semibold mb-3">How it works</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--muted-foreground)]">
          <li>Select a scenario to review</li>
          <li>Click &quot;Trigger Reviews&quot; to start both CodeRabbit and GitHub Copilot</li>
          <li>Each tool reviews its own copy of the PR (isolated, no cross-contamination)</li>
          <li>Once both reviews complete, view the findings side-by-side</li>
          <li>An AI-generated neutral analysis compares what each tool found</li>
        </ol>
      </div>
    </div>
  );
}
