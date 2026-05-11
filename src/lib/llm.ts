import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { ComparisonAnalysis, ScenarioResults } from "@/types/reviews";
import { Scenario } from "@/types/reviews";

const LLM_PROVIDER = process.env.LLM_PROVIDER || "anthropic";

function buildAnalysisPrompt(scenario: Scenario, results: ScenarioResults): string {
  return `You are a neutral code review analyst. You have been given the findings from two AI code review tools (CodeRabbit and GitHub Copilot) reviewing the same pull request.

Your job is to provide a fair, balanced analysis comparing their findings. Do NOT favor either tool.

## PR Context
**Title:** ${scenario.prTitle}
**Description:** ${scenario.description}

## CodeRabbit Findings
**Summary comment:**
${results.coderabbit.summary}

**Inline comments (${results.coderabbit.inlineComments.length} total):**
${results.coderabbit.inlineComments.map((c) => `- [${c.path || "general"}${c.line ? `:${c.line}` : ""}] ${c.body.substring(0, 300)}`).join("\n")}

## GitHub Copilot Findings
**Summary comment:**
${results.copilot.summary}

**Inline comments (${results.copilot.inlineComments.length} total):**
${results.copilot.inlineComments.map((c) => `- [${c.path || "general"}${c.line ? `:${c.line}` : ""}] ${c.body.substring(0, 300)}`).join("\n")}

## Instructions
1. Identify findings that both tools agree on (overlap)
2. Identify unique findings from each tool
3. Assess the severity and correctness of each finding
4. Note any false positives from either tool
5. Provide an overall assessment of each tool's review quality
6. Be completely neutral — do not favor either tool

Respond with valid JSON matching this structure:
{
  "overlapping_findings": [{"description": "...", "severity": "...", "category": "..."}],
  "coderabbit_unique": [{"description": "...", "severity": "...", "category": "..."}],
  "copilot_unique": [{"description": "...", "severity": "...", "category": "..."}],
  "false_positives": [{"tool": "...", "finding": "..."}],
  "quality_assessment": {"coderabbit": "...", "copilot": "..."},
  "summary": "..."
}`;
}

export async function generateAnalysis(
  scenario: Scenario,
  results: ScenarioResults,
): Promise<ComparisonAnalysis> {
  const prompt = buildAnalysisPrompt(scenario, results);

  let rawResponse: string;

  if (LLM_PROVIDER === "anthropic") {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });
    const textBlock = message.content.find((b) => b.type === "text");
    rawResponse = textBlock ? textBlock.text : "";
  } else {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 4096,
      response_format: { type: "json_object" },
    });
    rawResponse = completion.choices[0]?.message?.content || "";
  }

  // Parse JSON from response (handle markdown code blocks)
  const jsonMatch = rawResponse.match(/```json\n?([\s\S]*?)\n?```/) ||
                    rawResponse.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : rawResponse;

  try {
    return JSON.parse(jsonStr) as ComparisonAnalysis;
  } catch {
    return {
      overlapping_findings: [],
      coderabbit_unique: [],
      copilot_unique: [],
      false_positives: [],
      quality_assessment: { coderabbit: "Analysis failed", copilot: "Analysis failed" },
      summary: rawResponse,
    };
  }
}
