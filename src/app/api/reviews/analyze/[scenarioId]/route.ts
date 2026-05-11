import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getScenario } from "@/lib/pr-config";
import { getCodeRabbitComments, getCopilotComments } from "@/lib/github";
import { generateAnalysis } from "@/lib/llm";
import { ScenarioResults, ReviewComment } from "@/types/reviews";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ scenarioId: string }> },
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { scenarioId } = await params;
  const scenario = getScenario(parseInt(scenarioId));

  if (!scenario) {
    return NextResponse.json({ error: "Invalid scenario" }, { status: 400 });
  }

  // Fetch results from both tools
  const crComments = await getCodeRabbitComments(scenario.coderabbitPrNumber);
  const copilotComments = await getCopilotComments(scenario.copilotPrNumber);

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
      rawCommentCount: crComments.issueComments.length + crComments.reviewComments.length,
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
      rawCommentCount: copilotComments.reviews.length + copilotComments.reviewComments.length,
    },
  };

  const analysis = await generateAnalysis(scenario, results);

  return NextResponse.json(analysis);
}
