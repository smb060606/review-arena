const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const GITHUB_OWNER = process.env.GITHUB_OWNER!;
const GITHUB_REPO = process.env.GITHUB_REPO!;

const BASE_URL = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

async function githubFetch(path: string, options: RequestInit = {}) {
  const url = path.startsWith("http") ? path : `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
      ...options.headers,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${body}`);
  }

  return res.json();
}

// Look up the open PR number for a given head branch
// Branch names are stable; PR numbers change after each reset
export async function findOpenPRByBranch(branch: string): Promise<number | null> {
  const prs = await githubFetch(`/pulls?state=open&head=${GITHUB_OWNER}:${branch}`);
  if (prs.length === 0) return null;
  return prs[0].number;
}

// Resolve both PR numbers for a scenario's branches
export async function resolveScenarioPRs(
  coderabbitBranch: string,
  copilotBranch: string,
): Promise<{ coderabbitPr: number | null; copilotPr: number | null }> {
  const [coderabbitPr, copilotPr] = await Promise.all([
    findOpenPRByBranch(coderabbitBranch),
    findOpenPRByBranch(copilotBranch),
  ]);
  return { coderabbitPr, copilotPr };
}

// Trigger CodeRabbit review by posting a comment
export async function triggerCodeRabbit(prNumber: number) {
  return githubFetch(`/issues/${prNumber}/comments`, {
    method: "POST",
    body: JSON.stringify({ body: "@coderabbitai review" }),
  });
}

// Trigger Copilot review via gh CLI
// Copilot cannot be requested via the REST API — only gh CLI (v2.88.0+) supports it.
// See: https://github.blog/changelog/2026-03-11-request-copilot-code-review-from-github-cli/
export async function triggerCopilot(prNumber: number): Promise<{ success: boolean; error?: string }> {
  const { exec } = await import("child_process");
  const { promisify } = await import("util");
  const execAsync = promisify(exec);

  try {
    await execAsync(
      `gh pr edit ${prNumber} --add-reviewer @copilot --repo ${GITHUB_OWNER}/${GITHUB_REPO}`,
    );
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to request Copilot review: ${message}`);
  }
}

// Check CodeRabbit status via Check Runs API
export async function getCodeRabbitCheckRuns(prNumber: number) {
  // Get the PR to find the head SHA
  const pr = await githubFetch(`/pulls/${prNumber}`);
  const sha = pr.head.sha;

  // Get check runs for this commit
  const checkRuns = await githubFetch(`/commits/${sha}/check-runs`);
  const crCheckRun = checkRuns.check_runs?.find(
    (run: { app?: { slug?: string }; name?: string }) =>
      run.app?.slug === "coderabbitai" || run.name?.toLowerCase().includes("coderabbit")
  );

  return crCheckRun || null;
}

// Check Copilot review status
export async function getCopilotReviews(prNumber: number) {
  const reviews = await githubFetch(`/pulls/${prNumber}/reviews`);
  return reviews.filter(
    (r: { user?: { login?: string; type?: string } }) =>
      r.user?.login?.includes("copilot") || r.user?.type === "Bot"
  );
}

// Parse "Additional comments" embedded in CodeRabbit's review body
function parseAdditionalComments(reviewBody: string): { path: string; line: string; body: string }[] {
  const results: { path: string; line: string; body: string }[] = [];
  const additionalMatch = reviewBody.match(/Additional comments[\s\S]*?<\/details>\s*<\/blockquote>\s*<\/details>/);
  if (!additionalMatch) return results;

  const section = additionalMatch[0];
  // Match each file's comments: <summary>filename (count)</summary> ... `line-range`: **body**
  const filePattern = /<summary>([^<]+?)\s*\(\d+\)<\/summary><blockquote>([\s\S]*?)<\/blockquote><\/details>/g;
  let fileMatch;
  while ((fileMatch = filePattern.exec(section)) !== null) {
    const filePath = fileMatch[1].trim();
    const fileContent = fileMatch[2];
    // Match individual comments: `line-range`: **title** \n description
    const commentPattern = /`(\d+(?:-\d+)?)`:?\s*\*\*(.*?)\*\*([\s\S]*?)(?=`\d|$)/g;
    let commentMatch;
    while ((commentMatch = commentPattern.exec(fileContent)) !== null) {
      const lineRange = commentMatch[1];
      const title = commentMatch[2].trim();
      const description = commentMatch[3].trim().replace(/<\/blockquote>[\s\S]*$/, '').trim();
      const body = description ? `**${title}**\n${description}` : `**${title}**`;
      results.push({ path: filePath, line: lineRange, body });
    }
  }
  return results;
}

// Get CodeRabbit review comments
export async function getCodeRabbitComments(prNumber: number) {
  const [issueComments, reviewComments, reviews] = await Promise.all([
    githubFetch(`/issues/${prNumber}/comments`),
    githubFetch(`/pulls/${prNumber}/comments`),
    githubFetch(`/pulls/${prNumber}/reviews`),
  ]);

  const crIssueComments = issueComments.filter(
    (c: { user?: { login?: string } }) => c.user?.login?.includes("coderabbit")
  );
  const crReviewComments = reviewComments.filter(
    (c: { user?: { login?: string } }) => c.user?.login?.includes("coderabbit")
  );

  // Extract additional comments from CodeRabbit's review body
  const crReview = reviews.find(
    (r: { user?: { login?: string } }) => r.user?.login?.includes("coderabbit")
  );
  const additionalComments = crReview ? parseAdditionalComments(crReview.body || "") : [];
  // Convert to the same shape as inline review comments
  const additionalAsComments = additionalComments.map((c) => ({
    path: c.path,
    line: parseInt(c.line.split("-")[0]),
    body: c.body,
    user: { login: "coderabbitai[bot]" },
    created_at: crReview?.submitted_at || "",
  }));

  return {
    issueComments: crIssueComments,
    reviewComments: [...crReviewComments, ...additionalAsComments],
  };
}

// Get Copilot review comments
export async function getCopilotComments(prNumber: number) {
  const [reviews, reviewComments] = await Promise.all([
    githubFetch(`/pulls/${prNumber}/reviews`),
    githubFetch(`/pulls/${prNumber}/comments`),
  ]);

  const copilotReviews = reviews.filter(
    (r: { user?: { login?: string; type?: string } }) =>
      r.user?.login?.includes("copilot") || r.user?.type === "Bot"
  );
  const copilotComments = reviewComments.filter(
    (c: { user?: { login?: string; type?: string } }) =>
      c.user?.login?.includes("copilot") || c.user?.type === "Bot"
  );

  return { reviews: copilotReviews, reviewComments: copilotComments };
}

// Check if Copilot is a requested reviewer (assigned but hasn't finished)
export async function isCopilotRequested(prNumber: number): Promise<boolean> {
  const data = await githubFetch(`/pulls/${prNumber}/requested_reviewers`);
  return data.users?.some(
    (u: { login?: string }) => u.login?.toLowerCase() === "copilot"
  ) ?? false;
}

// Close a PR
export async function closePullRequest(prNumber: number) {
  return githubFetch(`/pulls/${prNumber}`, {
    method: "PATCH",
    body: JSON.stringify({ state: "closed" }),
  });
}

// Create a PR
export async function createPullRequest(head: string, title: string, body: string) {
  return githubFetch(`/pulls`, {
    method: "POST",
    body: JSON.stringify({ head, base: "main", title, body }),
  });
}

// List open PRs
export async function listOpenPRs() {
  return githubFetch(`/pulls?state=open`);
}
