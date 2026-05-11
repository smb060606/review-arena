import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { SCENARIOS } from "@/lib/pr-config";
import { listOpenPRs, closePullRequest, createPullRequest } from "@/lib/github";

export async function POST() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: { closed: string[]; created: string[]; errors: string[] } = {
    closed: [],
    created: [],
    errors: [],
  };

  // Step 1: Close all open PRs
  try {
    const openPRs = await listOpenPRs();
    for (const pr of openPRs) {
      try {
        await closePullRequest(pr.number);
        results.closed.push(`#${pr.number}: ${pr.title}`);
      } catch (err) {
        results.errors.push(`Failed to close #${pr.number}: ${(err as Error).message}`);
      }
    }
  } catch (err) {
    results.errors.push(`Failed to list open PRs: ${(err as Error).message}`);
  }

  // Step 2: Recreate PRs from branches
  for (const scenario of SCENARIOS) {
    // Create CodeRabbit PR
    try {
      const crPR = await createPullRequest(
        scenario.coderabbitBranch,
        `[CodeRabbit] ${scenario.prTitle}`,
        `${scenario.description}\n\n_This PR is for CodeRabbit review._`,
      );
      results.created.push(`#${crPR.number}: [CodeRabbit] ${scenario.prTitle}`);
    } catch (err) {
      results.errors.push(`Failed to create CR PR for scenario ${scenario.id}: ${(err as Error).message}`);
    }

    // Create Copilot PR
    try {
      const copilotPR = await createPullRequest(
        scenario.copilotBranch,
        `[Copilot] ${scenario.prTitle}`,
        `${scenario.description}\n\n_This PR is for GitHub Copilot review._`,
      );
      results.created.push(`#${copilotPR.number}: [Copilot] ${scenario.prTitle}`);
    } catch (err) {
      results.errors.push(`Failed to create Copilot PR for scenario ${scenario.id}: ${(err as Error).message}`);
    }
  }

  return NextResponse.json(results);
}
