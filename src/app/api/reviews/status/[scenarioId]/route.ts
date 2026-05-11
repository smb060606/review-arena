import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getScenario } from "@/lib/pr-config";
import { resolveScenarioPRs, getCodeRabbitCheckRuns, getCopilotReviews, getCodeRabbitComments } from "@/lib/github";
import { ScenarioStatus, ReviewToolStatus } from "@/types/reviews";

export async function GET(
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

  const { coderabbitPr, copilotPr } = await resolveScenarioPRs(
    scenario.coderabbitBranch,
    scenario.copilotBranch,
  );

  let crStatus: ReviewToolStatus = "idle";
  let crCommentCount = 0;
  let crCheckRunId: number | undefined;

  let copilotStatus: ReviewToolStatus = "idle";
  let copilotReviewCount = 0;

  // Check CodeRabbit via Check Runs API
  try {
    if (coderabbitPr) {
      const checkRun = await getCodeRabbitCheckRuns(coderabbitPr);
      if (checkRun) {
        crCheckRunId = checkRun.id;
        if (checkRun.status === "completed") {
          crStatus = "complete";
        } else if (checkRun.status === "in_progress") {
          crStatus = "in_progress";
        } else {
          crStatus = "pending";
        }
      } else {
        // Fallback: check for review comments
        const comments = await getCodeRabbitComments(coderabbitPr);
        const hasWalkthrough = comments.issueComments.some(
          (c: { body?: string }) => c.body?.includes("## Walkthrough"),
        );
        // Filter out non-review comments (e.g. "Review skipped", config notices)
        const reviewComments = comments.issueComments.filter(
          (c: { body?: string }) =>
            c.body && !c.body.includes("Review skipped") && !c.body.includes("skip review"),
        );
        crCommentCount = reviewComments.length + comments.reviewComments.length;
        crStatus = hasWalkthrough ? "complete" : crCommentCount > 0 ? "in_progress" : "idle";
      }
    }
  } catch {
    crStatus = "error";
  }

  // Check Copilot via Reviews API
  try {
    if (copilotPr) {
      const reviews = await getCopilotReviews(copilotPr);
      copilotReviewCount = reviews.length;
      if (reviews.some((r: { state?: string }) => r.state === "COMMENTED" || r.state === "CHANGES_REQUESTED")) {
        copilotStatus = "complete";
      } else if (copilotReviewCount > 0) {
        copilotStatus = "in_progress";
      }
    }
  } catch {
    copilotStatus = "error";
  }

  const status: ScenarioStatus = {
    coderabbit: {
      prNumber: coderabbitPr || 0,
      status: crStatus,
      commentCount: crCommentCount,
      checkRunId: crCheckRunId,
    },
    copilot: {
      prNumber: copilotPr || 0,
      status: copilotStatus,
      reviewCount: copilotReviewCount,
    },
  };

  return NextResponse.json(status);
}
