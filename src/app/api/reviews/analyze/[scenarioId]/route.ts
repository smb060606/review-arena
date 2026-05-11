import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getScenario } from "@/lib/pr-config";
import { resolveScenarioPRs, getCodeRabbitComments, getCopilotComments } from "@/lib/github";
import { generateAnalysis, LLMProvider } from "@/lib/llm";
import { ScenarioResults, ReviewComment } from "@/types/reviews";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ scenarioId: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { scenarioId } = await params;
  const body = await req.json().catch(() => ({}));
  const provider = (body.provider as LLMProvider) || undefined;
  const scenario = getScenario(parseInt(scenarioId));

  if (!scenario) {
    return NextResponse.json({ error: "Invalid scenario" }, { status: 400 });
  }

  const { coderabbitPr, copilotPr } = await resolveScenarioPRs(
    scenario.coderabbitBranch,
    scenario.copilotBranch,
  );

  if (!coderabbitPr || !copilotPr) {
    return NextResponse.json(
      { error: "Open PRs not found for this scenario." },
      { status: 400 },
    );
  }

  // Fetch results from both tools
  const crComments = await getCodeRabbitComments(coderabbitPr);
  const copilotComments = await getCopilotComments(copilotPr);

  const crSummary = crComments.issueComments.find(
    (c: { body?: string }) => c.body?.includes("## Walkthrough"),
  );

  const results: ScenarioResults = {
    coderabbit: {
      summary: crSummary?.body || "No summary available",
      inlineComments: crComments.reviewComments.map(
        (c: { path?: string; line?: number; body?: string; user?: { login?: string }; created_at?: string }) => ({
          path: c.path,
          line: c.line,
          body: c.body || "",
          author: c.user?.login || "coderabbit",
          createdAt: c.created_at || "",
        }),
      ) as ReviewComment[],
      rawCommentCount: crComments.reviewComments.length,
    },
    copilot: {
      summary: copilotComments.reviews[0]?.body || "",
      inlineComments: copilotComments.reviewComments.map(
        (c: { path?: string; line?: number; body?: string; user?: { login?: string }; created_at?: string }) => ({
          path: c.path,
          line: c.line,
          body: c.body || "",
          author: c.user?.login || "copilot",
          createdAt: c.created_at || "",
        }),
      ) as ReviewComment[],
      rawCommentCount: copilotComments.reviewComments.length,
    },
  };

  const analysis = await generateAnalysis(scenario, results, provider);

  return NextResponse.json({ ...analysis, analyzedBy: provider || process.env.LLM_PROVIDER || "anthropic" });
}
