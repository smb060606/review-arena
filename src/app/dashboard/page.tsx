import { SCENARIOS, PROJECT_CONTEXT } from "@/lib/pr-config";
import Link from "next/link";
import { ToolsBanner } from "@/components/ToolsBanner";

const CATEGORY_COLORS: Record<string, string> = {
  Security: "bg-red-900/30 text-red-300 border-red-800",
  Logic: "bg-purple-900/30 text-purple-300 border-purple-800",
  Performance: "bg-yellow-900/30 text-yellow-300 border-yellow-800",
  "Best Practice": "bg-blue-900/30 text-blue-300 border-blue-800",
};

export default function DashboardPage() {
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
      <div className="mb-10 p-6 bg-[var(--card)] border border-[var(--border)] rounded-xl">
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

      {/* Scenarios */}
      <h2 className="text-lg font-semibold mb-4">Choose a scenario to compare</h2>
      <div className="grid gap-6 mb-10">
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

      {/* How it works */}
      <div className="p-6 bg-[var(--card)] border border-[var(--border)] rounded-xl">
        <h3 className="font-semibold mb-3">How it works</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-[var(--muted-foreground)]">
          <li><span className="font-medium text-[var(--foreground)]">Pick a scenario</span> &mdash; each one is a pull request that adds a new feature to the TeamForge API, with realistic bugs intentionally injected into the code</li>
          <li><span className="font-medium text-[var(--foreground)]">Trigger reviews</span> &mdash; this sends the PR to both CodeRabbit and GitHub Copilot simultaneously, each reviewing their own isolated copy</li>
          <li><span className="font-medium text-[var(--foreground)]">Wait for results</span> &mdash; both tools analyze the code independently (typically 1-3 minutes each)</li>
          <li><span className="font-medium text-[var(--foreground)]">Compare findings</span> &mdash; see what each tool found side-by-side, then generate a neutral AI analysis of their performance</li>
        </ol>
      </div>
    </div>
  );
}
