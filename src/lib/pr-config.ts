import { Scenario } from "@/types/reviews";

export const REPO_URL = "https://github.com/smb060606/teamforge-api";

export function prUrl(prNumber: number) {
  return `${REPO_URL}/pull/${prNumber}`;
}

export const PROJECT_CONTEXT = {
  name: "TeamForge API",
  description:
    "TeamForge is a REST API for managing engineering teams, projects, deployments, and incidents. Think of it as the backend for an internal developer platform — similar to tools like Backstage, Port, or Cortex.",
  techStack: "Node.js, TypeScript, Express.js, Prisma ORM, PostgreSQL",
  baselineState:
    "The main branch has a clean, working codebase with four fully implemented modules: user authentication (JWT-based), user management, team management, and project management. All routes have proper middleware for authentication, role-based authorization, input validation, rate limiting, and error handling. The deployments, incidents, and analytics modules exist as empty stubs waiting to be implemented.",
  repoUrl: "https://github.com/smb060606/teamforge-api",
};

export const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: "Deployment Pipeline Management",
    description:
      "A developer on the team has implemented the deployment management module. This PR adds the ability to create deployments, track their status through webhooks, view deployment history, calculate statistics, and rollback failed deployments. It also adds service account authentication so CI/CD systems can update deployment status.",
    beforeState:
      "The deployments module is an empty stub — just a single route returning 501 Not Implemented. The authentication middleware only supports regular user JWT tokens. The database schema already has the Deployment model defined but no API endpoints exist to interact with it.",
    whatThePrDoes:
      "Adds 7 new API endpoints for deployment management (create, list, get, update status, rollback, stats, history). Modifies the auth middleware to support service account tokens for webhook callbacks. Adds a webhook signature validation service. Includes a raw SQL query for advanced deployment history filtering.",
    filesChanged: [
      "src/modules/deployments/deployments.service.ts (new — core business logic)",
      "src/modules/deployments/deployments.controller.ts (new — request handlers)",
      "src/modules/deployments/deployments.schema.ts (new — input validation)",
      "src/modules/deployments/deployments.routes.ts (modified — was empty stub)",
      "src/modules/deployments/webhook.service.ts (new — webhook processing)",
      "src/middleware/auth.ts (modified — adds service account auth path)",
      "prisma/migrations/002_add_deployment_indexes.sql (new)",
    ],
    prTitle: "feat: Add deployment pipeline management with rollback support",
    injectedBugs: [
      { description: "SQL injection in deployment history filter — raw SQL query uses string interpolation instead of parameterized queries", category: "Security", severity: "CRITICAL" },
      { description: "JWT secret hardcoded as fallback — if the SA_JWT_SECRET env var is missing, a predictable string is used", category: "Security", severity: "HIGH" },
      { description: "Missing authorization check on rollback endpoint — any authenticated user can rollback any project's deployment", category: "Security", severity: "HIGH" },
      { description: "Race condition in deployment status update — reads status then updates in a separate query without a transaction", category: "Logic", severity: "HIGH" },
      { description: "Off-by-one in version calculation — new deployment gets version N instead of N+1", category: "Logic", severity: "MEDIUM" },
      { description: "Rollback selects oldest deployment instead of newest — sort order is ascending instead of descending", category: "Logic", severity: "HIGH" },
      { description: "Null pointer when deployment has no changelog — calls .split() on a nullable field without checking", category: "Logic", severity: "MEDIUM" },
      { description: "N+1 query in deployment list — loops through each deployment to fetch related data instead of using a join", category: "Performance", severity: "MEDIUM" },
      { description: "Unbounded query for stats — loads all deployments into memory instead of using aggregate queries", category: "Performance", severity: "MEDIUM" },
      { description: "Migration index doesn't match comments — comments describe a composite index but SQL creates a single-column one", category: "Performance", severity: "LOW" },
      { description: "Webhook secret logged in plaintext — the secret value is included in structured log output", category: "Best Practice", severity: "MEDIUM" },
      { description: "Error response leaks stack trace to client — catch block returns error.stack in the JSON response", category: "Best Practice", severity: "MEDIUM" },
    ],
    coderabbitBranch: "feature/deployment-pipeline-coderabbit",
    copilotBranch: "feature/deployment-pipeline-copilot",
  },
  {
    id: 2,
    title: "Incident Management System",
    description:
      "A developer has built out the incident tracking system. This PR adds the ability to create and manage incidents with severity levels, track SLA compliance, escalate unresolved incidents, maintain an incident timeline of comments and status changes, and search across incidents.",
    beforeState:
      "The incidents module is an empty stub returning 501 Not Implemented. The database schema has Incident and IncidentTimeline models defined but no API endpoints exist. There is no SLA tracking, escalation logic, or incident search functionality anywhere in the codebase.",
    whatThePrDoes:
      "Adds 10 new API endpoints for incident management (CRUD, status transitions, assignment, timeline, search, metrics, escalation checks). Introduces three new service files: SLA tracking with business-hours-aware deadline calculation, an escalation service that checks for SLA breaches, and a timeline service. Adds a state machine for incident status transitions (OPEN \u2192 INVESTIGATING \u2192 MITIGATING \u2192 RESOLVED \u2192 CLOSED).",
    filesChanged: [
      "src/modules/incidents/incidents.service.ts (new — core business logic)",
      "src/modules/incidents/incidents.controller.ts (new — request handlers)",
      "src/modules/incidents/incidents.schema.ts (new — input validation)",
      "src/modules/incidents/incidents.routes.ts (modified — was empty stub)",
      "src/modules/incidents/sla.service.ts (new — SLA deadline calculation and monitoring)",
      "src/modules/incidents/escalation.service.ts (new — SLA breach escalation)",
      "src/modules/incidents/timeline.service.ts (new — incident timeline queries)",
      "prisma/migrations/003_incident_timeline.sql (new)",
    ],
    prTitle: "feat: Implement incident management with severity-based routing and SLA tracking",
    injectedBugs: [
      { description: "Stored XSS via incident title/description — user input stored directly without HTML sanitization", category: "Security", severity: "CRITICAL" },
      { description: "IDOR in incident assignment — accepts any user ID without verifying team membership; reportedById taken from request body instead of auth token", category: "Security", severity: "HIGH" },
      { description: "Timing attack in SLA API key comparison — uses === instead of crypto.timingSafeEqual()", category: "Security", severity: "LOW" },
      { description: "SLA calculation uses wrong timezone — start time is UTC but business hours check uses local time", category: "Logic", severity: "HIGH" },
      { description: "Status machine crashes on CLOSED state — the CLOSED status is missing from the transition map, causing a runtime error", category: "Logic", severity: "MEDIUM" },
      { description: "Escalation check doesn't filter resolved incidents — resolved/closed incidents still trigger escalation alerts", category: "Logic", severity: "MEDIUM" },
      { description: "Timeline query missing orderBy clause — entries returned in insertion order, not chronological", category: "Logic", severity: "LOW" },
      { description: "Search returns duplicate results — incidents matching on both title and timeline appear twice due to a join without distinct", category: "Logic", severity: "MEDIUM" },
      { description: "Memory leak from setInterval in SLA monitor — interval never cleared on shutdown, errors swallowed silently", category: "Performance", severity: "HIGH" },
      { description: "findMany + .length instead of count() — loads all incidents with all timeline entries into memory just to count them", category: "Performance", severity: "MEDIUM" },
      { description: "N+1 in incident list — loops through each incident to fetch assignee instead of using a join", category: "Performance", severity: "MEDIUM" },
      { description: "Hardcoded SLA thresholds — SEV1=4h, SEV2=8h etc. are hardcoded constants instead of configurable values", category: "Best Practice", severity: "LOW" },
      { description: "Missing validation middleware on PUT route — the update endpoint skips input validation unlike every other mutation route", category: "Best Practice", severity: "MEDIUM" },
    ],
    coderabbitBranch: "feature/incident-management-coderabbit",
    copilotBranch: "feature/incident-management-copilot",
  },
  {
    id: 3,
    title: "Analytics & Reporting Dashboard",
    description:
      "A developer has added analytics and reporting capabilities to the API. This PR introduces DORA metrics (deployment velocity, change failure rate), project health scoring, team member contribution tracking, CSV export with webhook delivery, and an in-memory caching layer. It also adds API key authentication for programmatic access.",
    beforeState:
      "The analytics module is an empty stub returning 501 Not Implemented. There are no analytics, reporting, or export endpoints. The authentication middleware only supports JWT bearer tokens — there is no API key authentication. No caching layer exists anywhere in the codebase.",
    whatThePrDoes:
      "Adds 6 new API endpoints for analytics (velocity, change failure rate, project health, contributions, date-range metrics, CSV export). Introduces three new service files: analytics calculations, an in-memory cache, and a CSV export generator with webhook callback support. Modifies the auth middleware to accept API keys via both headers and query parameters. Adds admin-only route protection for sensitive analytics.",
    filesChanged: [
      "src/modules/analytics/analytics.service.ts (new — metrics calculations with filter parsing)",
      "src/modules/analytics/analytics.controller.ts (new — request handlers with export support)",
      "src/modules/analytics/analytics.schema.ts (new — input validation)",
      "src/modules/analytics/analytics.routes.ts (modified — was empty stub)",
      "src/modules/analytics/cache.service.ts (new — in-memory caching layer)",
      "src/modules/analytics/export.service.ts (new — CSV generation and webhook delivery)",
      "src/middleware/auth.ts (modified — adds API key authentication path)",
    ],
    prTitle: "feat: Add team analytics, reporting endpoints, and CSV export",
    injectedBugs: [
      { description: "API key exposed in URL query parameters — keys in URLs get logged in access logs, browser history, and referrer headers", category: "Security", severity: "HIGH" },
      { description: "Prototype pollution in filter parser — deepMerge() doesn't check for __proto__ or constructor keys", category: "Security", severity: "CRITICAL" },
      { description: "CSV injection — user data written to CSV without escaping formula-triggering characters (=, +, -, @)", category: "Security", severity: "HIGH" },
      { description: "SSRF via unvalidated callback URL — the export endpoint fetches arbitrary URLs without blocking internal network addresses", category: "Security", severity: "HIGH" },
      { description: "Division by zero in velocity calculation — Math.floor(days/7) equals 0 for ranges under 7 days, producing Infinity", category: "Logic", severity: "MEDIUM" },
      { description: "Change failure rate counts rollbacks in denominator — inflates total deployment count, deflating the failure percentage", category: "Logic", severity: "MEDIUM" },
      { description: "Date range off by one day — exclusive end at midnight means the entire last day of the range is excluded", category: "Logic", severity: "LOW" },
      { description: "Cache key missing teamId — Team A's cached analytics can be served to Team B if they request the same metric and date range", category: "Logic", severity: "HIGH" },
      { description: "Sync CSV generation blocks event loop — builds entire CSV with O(n\u00B2) string concatenation, blocking all other requests", category: "Performance", severity: "HIGH" },
      { description: "Cache with no TTL, size limit, or eviction — entries live forever and the Map grows unbounded, leaking memory", category: "Performance", severity: "MEDIUM" },
      { description: "Extensive 'any' type usage — 8+ places use TypeScript 'any', defeating the type system's ability to catch errors", category: "Best Practice", severity: "LOW" },
      { description: "console.log instead of structured logger — debug logging uses console.log while the rest of the codebase uses pino", category: "Best Practice", severity: "LOW" },
      { description: "Magic numbers in analytics calculations — unnamed constants like 0.85, 1.5, 30, 999 with no explanation", category: "Best Practice", severity: "LOW" },
      { description: "Test file contains staging database credentials — a comment includes a real connection string with username and password", category: "Best Practice", severity: "MEDIUM" },
    ],
    coderabbitBranch: "feature/analytics-dashboard-coderabbit",
    copilotBranch: "feature/analytics-dashboard-copilot",
  },
];

export function getScenario(id: number): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
