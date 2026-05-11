import { Scenario } from "@/types/reviews";

export const SCENARIOS: Scenario[] = [
  {
    id: 1,
    title: "Deployment Pipeline Management",
    description:
      "This PR adds deployment pipeline management with rollback support to the TeamForge API. It implements deployment CRUD operations, status webhooks, deployment history with filtering, and statistics endpoints. The changes touch authentication middleware, database queries, and error handling across multiple files.",
    prTitle: "feat: Add deployment pipeline management with rollback support",
    injectedBugs: [
      { description: "SQL injection in deployment history filter", category: "Security", severity: "CRITICAL" },
      { description: "JWT secret hardcoded as fallback for service accounts", category: "Security", severity: "HIGH" },
      { description: "Missing authorization check on rollback endpoint", category: "Security", severity: "HIGH" },
      { description: "Race condition in deployment status update", category: "Logic", severity: "HIGH" },
      { description: "Off-by-one in version calculation", category: "Logic", severity: "MEDIUM" },
      { description: "Rollback selects oldest deployment instead of newest", category: "Logic", severity: "HIGH" },
      { description: "Null pointer when deployment has no changelog", category: "Logic", severity: "MEDIUM" },
      { description: "N+1 query in deployment list", category: "Performance", severity: "MEDIUM" },
      { description: "Unbounded query for stats calculation", category: "Performance", severity: "MEDIUM" },
      { description: "Migration index doesn't match comments", category: "Performance", severity: "LOW" },
      { description: "Webhook secret logged in plaintext", category: "Best Practice", severity: "MEDIUM" },
      { description: "Error response leaks stack trace to client", category: "Best Practice", severity: "MEDIUM" },
    ],
    coderabbitBranch: "feature/deployment-pipeline-coderabbit",
    copilotBranch: "feature/deployment-pipeline-copilot",
    coderabbitPrNumber: 1,
    copilotPrNumber: 2,
  },
  {
    id: 2,
    title: "Incident Management System",
    description:
      "This PR implements the full incident management lifecycle including severity-based routing, SLA tracking with breach notifications, incident timeline, search with filtering, and metrics endpoints. Changes span service logic, database queries, state machine implementation, and a background monitoring process.",
    prTitle: "feat: Implement incident management with severity-based routing and SLA tracking",
    injectedBugs: [
      { description: "Stored XSS via incident title/description", category: "Security", severity: "CRITICAL" },
      { description: "IDOR in incident assignment — no team membership check", category: "Security", severity: "HIGH" },
      { description: "Timing attack in SLA API key comparison", category: "Security", severity: "LOW" },
      { description: "SLA calculation uses wrong timezone", category: "Logic", severity: "HIGH" },
      { description: "Status machine crashes on CLOSED state", category: "Logic", severity: "MEDIUM" },
      { description: "Escalation check doesn't filter resolved incidents", category: "Logic", severity: "MEDIUM" },
      { description: "Timeline query missing orderBy clause", category: "Logic", severity: "LOW" },
      { description: "Search returns duplicate results from joins", category: "Logic", severity: "MEDIUM" },
      { description: "Memory leak from setInterval in SLA monitor", category: "Performance", severity: "HIGH" },
      { description: "findMany + .length instead of count() for metrics", category: "Performance", severity: "MEDIUM" },
      { description: "N+1 in incident list with assignee lookup", category: "Performance", severity: "MEDIUM" },
      { description: "Hardcoded SLA thresholds instead of config", category: "Best Practice", severity: "LOW" },
      { description: "Missing validation middleware on PUT route", category: "Best Practice", severity: "MEDIUM" },
    ],
    coderabbitBranch: "feature/incident-management-coderabbit",
    copilotBranch: "feature/incident-management-copilot",
    coderabbitPrNumber: 3,
    copilotPrNumber: 4,
  },
  {
    id: 3,
    title: "Analytics & Reporting Dashboard",
    description:
      "This PR adds team analytics, reporting endpoints, and CSV export capabilities. It implements velocity metrics, project health scores, contribution reports, change failure rate calculations, an in-memory caching layer, and API key authentication for programmatic access. The changes introduce new services, modify authentication, and add export functionality.",
    prTitle: "feat: Add team analytics, reporting endpoints, and CSV export",
    injectedBugs: [
      { description: "API key exposed in URL query parameters", category: "Security", severity: "HIGH" },
      { description: "Prototype pollution in filter parser", category: "Security", severity: "CRITICAL" },
      { description: "CSV injection — no formula character escaping", category: "Security", severity: "HIGH" },
      { description: "SSRF via unvalidated callback URL", category: "Security", severity: "HIGH" },
      { description: "Division by zero in velocity calculation", category: "Logic", severity: "MEDIUM" },
      { description: "Change failure rate counts rollbacks in denominator", category: "Logic", severity: "MEDIUM" },
      { description: "Date range off by one day", category: "Logic", severity: "LOW" },
      { description: "Cache key missing teamId — cross-team data leakage", category: "Logic", severity: "HIGH" },
      { description: "Sync CSV generation blocks event loop", category: "Performance", severity: "HIGH" },
      { description: "Cache with no TTL, size limit, or eviction", category: "Performance", severity: "MEDIUM" },
      { description: "Extensive any type usage defeating TypeScript safety", category: "Best Practice", severity: "LOW" },
      { description: "console.log instead of structured logger", category: "Best Practice", severity: "LOW" },
      { description: "Magic numbers in analytics calculations", category: "Best Practice", severity: "LOW" },
      { description: "Test file contains staging database credentials", category: "Best Practice", severity: "MEDIUM" },
    ],
    coderabbitBranch: "feature/analytics-dashboard-coderabbit",
    copilotBranch: "feature/analytics-dashboard-copilot",
    coderabbitPrNumber: 5,
    copilotPrNumber: 6,
  },
];

export function getScenario(id: number): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
