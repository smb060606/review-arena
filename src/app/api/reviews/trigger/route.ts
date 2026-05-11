import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getScenario } from "@/lib/pr-config";
import { triggerCodeRabbit, triggerCopilot } from "@/lib/github";

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

  if (!scenario.coderabbitPrNumber || !scenario.copilotPrNumber) {
    return NextResponse.json(
      { error: "PR numbers not configured. Please set PR numbers in pr-config.ts" },
      { status: 400 },
    );
  }

  const results = { coderabbit: "pending", copilot: "pending" };

  try {
    await triggerCodeRabbit(scenario.coderabbitPrNumber);
    results.coderabbit = "triggered";
  } catch (err) {
    results.coderabbit = `error: ${(err as Error).message}`;
  }

  try {
    await triggerCopilot(scenario.copilotPrNumber);
    results.copilot = "triggered";
  } catch (err) {
    results.copilot = `error: ${(err as Error).message}`;
  }

  return NextResponse.json({ triggered: true, results });
}
