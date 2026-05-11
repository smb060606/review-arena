export type ReviewToolStatus = "idle" | "pending" | "in_progress" | "complete" | "error";

export interface ToolReviewStatus {
  prNumber: number;
  status: ReviewToolStatus;
  commentCount?: number;
  reviewCount?: number;
  checkRunId?: number;
  error?: string;
}

export interface ScenarioStatus {
  coderabbit: ToolReviewStatus;
  copilot: ToolReviewStatus;
}

export interface ReviewComment {
  path?: string;
  line?: number;
  body: string;
  author: string;
  createdAt: string;
}

export interface ToolReviewResults {
  summary: string;
  inlineComments: ReviewComment[];
  rawCommentCount: number;
}

export interface ScenarioResults {
  coderabbit: ToolReviewResults;
  copilot: ToolReviewResults;
}

export interface AnalysisFinding {
  description: string;
  severity: string;
  category: string;
  file?: string;
  line?: number;
}

export interface ComparisonAnalysis {
  overlapping_findings: AnalysisFinding[];
  coderabbit_unique: AnalysisFinding[];
  copilot_unique: AnalysisFinding[];
  false_positives: { tool: string; finding: string }[];
  quality_assessment: {
    coderabbit: string;
    copilot: string;
  };
  summary: string;
}

export interface Scenario {
  id: number;
  title: string;
  description: string;
  prTitle: string;
  injectedBugs: {
    description: string;
    category: string;
    severity: string;
  }[];
  coderabbitBranch: string;
  copilotBranch: string;
  coderabbitPrNumber: number;
  copilotPrNumber: number;
}
