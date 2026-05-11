import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getScenario } from "@/lib/pr-config";
import { triggerCodeRabbit, triggerCopilot, resolveScenarioPRs } from "@/lib/github";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { scenarioId } = await req.json();
  const scenario = getScenario(scenarioId);

  if (!scenario) {
    return NextResponse.json({ error: "Invalid scenario" }, { status: 400 });
  }

  const { coderabbitPr, copilotPr } = await resolveScenarioPRs(
    scenario.coderabbitBranch,
    scenario.copilotBranch,
  );

  if (!coderabbitPr || !copilotPr) {
    return NextResponse.json(
      { error: "Open PRs not found for this scenario. Try resetting the environment first." },
      { status: 400 },
    );
  }

  const results = { coderabbit: "pending", copilot: "pending" };

  try {
    await triggerCodeRabbit(coderabbitPr);
    results.coderabbit = "triggered";
  } catch (err) {
    results.coderabbit = `error: ${(err as Error).message}`;
  }

  try {
    await triggerCopilot(copilotPr);
    results.copilot = "triggered";
  } catch (err) {
    results.copilot = `error: ${(err as Error).message}`;
  }

  return NextResponse.json({ triggered: true, results });
}
