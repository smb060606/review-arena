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

// Trigger CodeRabbit review by posting a comment
export async function triggerCodeRabbit(prNumber: number) {
  return githubFetch(`/issues/${prNumber}/comments`, {
    method: "POST",
    body: JSON.stringify({ body: "@coderabbitai review" }),
  });
}

// Trigger Copilot review by requesting as reviewer
export async function triggerCopilot(prNumber: number) {
  return githubFetch(`/pulls/${prNumber}/requested_reviewers`, {
    method: "POST",
    body: JSON.stringify({ reviewers: ["copilot"] }),
  });
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

// Get CodeRabbit review comments
export async function getCodeRabbitComments(prNumber: number) {
  const [issueComments, reviewComments] = await Promise.all([
    githubFetch(`/issues/${prNumber}/comments`),
    githubFetch(`/pulls/${prNumber}/comments`),
  ]);

  const crIssueComments = issueComments.filter(
    (c: { user?: { login?: string } }) => c.user?.login?.includes("coderabbit")
  );
  const crReviewComments = reviewComments.filter(
    (c: { user?: { login?: string } }) => c.user?.login?.includes("coderabbit")
  );

  return { issueComments: crIssueComments, reviewComments: crReviewComments };
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
