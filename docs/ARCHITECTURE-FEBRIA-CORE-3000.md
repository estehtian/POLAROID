# FEBRIA CORE 3000 — Target Architecture

## Product direction

FEBRIA adopts a Cocoon AI-inspired delivery model: connect strategy, custom software, dependable automation, agentic assistance, digital visualization, and operational intelligence. This is a product and architecture reference, not a claim of affiliation or reuse of Cocoon AI proprietary technology.

## Current architectural baseline

- Next.js App Router workspace.
- Existing module registry in `lib/febria/store.ts` is the source of truth for the 13 workspace modules.
- Existing engineering calculations and SVG draft helpers remain in `lib/febria/engines.ts`.
- Browser persistence uses the existing localStorage key `febria-core-3000-store-v1`.
- `ModuleWorkspace` provides the module-level user interface.
- The Fashion Agent added in this phase is a deterministic, local rule engine in `lib/febria/agent.ts`.

## Logical architecture

```text
FEBRIA CORE 3000
├── Experience Layer
│   ├── Workspace Dashboard
│   ├── Pattern Engineering Workspace
│   ├── Fashion Agent Workspace
│   └── Production Overview
├── Domain Services
│   ├── Measurement & Fit
│   ├── Pattern Drafting & Grading
│   ├── Fabric & Marker
│   ├── Project & Production
│   └── Export & Visualization
├── Intelligence Layer
│   ├── Local Fashion Rules (implemented)
│   ├── AI Provider Gateway (planned)
│   ├── Tool/Action Registry (planned)
│   └── Human Review & Safety Gates (planned)
├── Data & Integration Layer
│   ├── Local Browser Store (implemented)
│   ├── Supabase Auth / Postgres / Storage (planned)
│   ├── Audit Events (planned)
│   └── External Pattern/CAD Integrations (planned)
└── Operations
    ├── Build & Type Checks (blocked by missing root project manifest in audited main)
    ├── CI Quality Gates (planned)
    └── Observability & Usage Analytics (planned)
```

## Delivery domains

1. **Pattern Engineering** — structured measurements, parametrically generated drafts, editable pattern geometry, grading rules, fabric consumption, and validated exports.
2. **Fashion Intelligence** — domain-specific assistant that explains decisions, recommends next steps, and calls approved tools only after their contracts and validation exist.
3. **Production Operations** — projects, work orders, task status, quality checkpoints, and operational reporting.
4. **Digital Visualization** — garment preview first; true 3D cloth simulation only after a verified geometry and simulation stack is selected.

## Agent contract

The current `runFashionAgent(question)` function:
- classifies the question into a bounded fashion-work intent;
- returns structured advice, steps, and limitations;
- runs locally without credentials or network access;
- does not call an LLM, browse the web, invoke sub-agents, or mutate project records.

Future AI provider integration must use a server-side provider gateway. API secrets must never be exposed in client components. Tool execution should be allow-listed, input-validated, logged, and require human confirmation for destructive or production-impacting actions.

## Data and security principles

- Keep the existing localStorage key and shape backward compatible until a migration is designed.
- Introduce Supabase through additive server/client modules; never place service-role credentials in browser code.
- Use row-level security for tenant/user-owned records.
- Add roles and audit history before enabling multi-user admin operations.
- Treat measurement profiles and customer records as private data; minimize collection and define retention.
- Store uploaded pattern assets with explicit ownership and access policies.

## Integration sequence

### Phase 1 — Safe foundation (current)
- Preserve the existing repository structure and configuration.
- Correct the workspace type import issue.
- Add a local Fashion Agent rules engine and connect it to the assistant UI.
- Upgrade the workspace dashboard and accurately display module counts and capability status.

### Phase 2 — Engineering reliability
- Recover/verify the root Next.js manifest and app shell from the repository owner before attempting a build.
- Add unit tests for calculations and draft geometry.
- Define garment-specific measurement schemas and grading rule sets.
- Add versioned pattern entities and export validation.

### Phase 3 — Data platform
- Design Supabase schema, migrations, RLS policies, storage buckets, and server-side access.
- Add authentication and role-based authorization.
- Migrate local drafts only with an explicit, reversible import flow.

### Phase 4 — AI agent platform
- Select an AI provider and implement a server-only gateway.
- Add retrieval over approved fashion references and project context.
- Register typed tools for measurement review, pattern checks, and production summaries.
- Add evaluation cases, cost limits, rate limits, and human approval.

### Phase 5 — Visualization and operations
- Define a real garment geometry representation and CAD interchange requirements.
- Evaluate a 3D engine only after pattern geometry is validated.
- Add production event tracking, operational metrics, and observability.

## Acceptance gates

A feature is called **active** only when its code is present, configured, and tested in the target environment. A connected service also needs a successful integration test. UI mockups, static rules, and conceptual previews must remain labeled as prototypes. Never promote changes to `main` until the pull request review and required checks are complete.
