# FEBRIA server-to-worker integration — implementation target

Status date: 2026-11-26
Branch: `febria/visual-fashion-ai-audit`

## Decision: do not wire the current browser UI directly to the worker yet

The repository snapshot available for this audit does not include a root `package.json`/lockfile, the complete Next.js shell, Supabase integration, or a confirmed authentication provider. The existing worker is a metadata-only dry-run and has no persistent queue or asset store. Implementing a route that pretends to authenticate users, trusts a browser-supplied `projectId`, or forwards image bytes without ownership and retention controls would create a false security boundary.

Therefore this document defines the next implementation target and its release gates. It is not a claim that authentication, upload, storage, or queueing is already implemented. Recover/confirm the complete application and identity/storage environment first; then implement the phases below in order.

## Target request flow

```text
Browser Visual Fashion Studio
  ├─ authenticated session cookie (never a worker token)
  ├─ request short-lived upload authorization for an owned project
  ├─ upload directly to private temporary object storage using a signed URL
  └─ submit asset IDs to Next.js server route
       ├─ validate session and derive user ID from verified session
       ├─ verify the user owns/can access the project and every asset
       ├─ validate operation-specific inputs and quotas
       ├─ write job + audit event with status=queued
       ├─ enqueue job with idempotency key
       └─ call worker through a private network using server-only worker credential
            └─ worker reports status/result to server callback or queue

Browser polls an authenticated Next.js status route; it never calls the worker or receives worker credentials.
```

All generated results remain `visual_preview_only`; they must never change measurements, pattern geometry, grading, marker plans, or production exports.

## Preconditions

1. Restore or verify the complete Next.js application shell and lockfile, then run typecheck/build in that full checkout.
2. Confirm the actual authentication provider and server-side session verification API. Do not invent a localStorage-based identity.
3. Confirm project ownership semantics and database. Do not trust a project ID from the request without a database authorization check.
4. Select private object storage with lifecycle expiration and deletion support.
5. Select a durable queue and define worker networking, callback authentication, retry, and dead-letter behavior.
6. Review provider/checkpoint/model license terms and data processing/retention obligations before real inference.

## API contract to implement

### `POST /api/visual-fashion/uploads`

- Require a verified server session.
- Body: project ID, declared file name, MIME type, byte size, dimensions, and asset kind.
- Verify project access; enforce allow-listed image MIME, maximum size/dimensions, and per-project quotas.
- Create a pending asset row owned by the authenticated user and project.
- Return a short-lived signed upload URL plus asset ID. The URL must be scoped to one object/key, one method, one content type, and a short expiry.
- Browser uploads bytes to private storage; server finalization verifies actual object size/type and marks asset ready.

### `POST /api/visual-fashion/jobs`

- Require verified session; derive `userId` server-side.
- Accept only allow-listed operations (`generate_model`, `segment_region`, `try_on_preview`) and strict, size-limited JSON.
- Verify project access and readiness/ownership of every referenced asset; do not accept arbitrary storage paths or URLs.
- Validate required fields for each operation and reject client-selected provider, model revision, checkpoint, or worker URL.
- Enforce rate, concurrency, and cost quotas; create a durable queued job and audit event transactionally with an idempotency key.
- Enqueue only job ID and validated metadata. Worker gets server-generated, short-lived, narrowly scoped asset access where needed.
- Return `202 Accepted` with job ID and status URL; never wait for GPU inference inside the request.

### `GET /api/visual-fashion/jobs/{jobId}`

- Require verified session and authorize job owner/project access on every request.
- Return only status, timestamps, safe error code, warning, and result asset IDs. Generate fresh signed download URLs only after authorization.

### `DELETE /api/visual-fashion/jobs/{jobId}` and asset deletion

- Authorize ownership; cancel queued work where possible, mark deletion requested, remove source/result objects and metadata according to retention rules, and record an audit event.
- Document behavior when a running external job cannot be cancelled; ensure late results are discarded/deleted.

## Data model (minimum)

- `visual_assets`: id, project_id, owner_user_id, storage_key, kind, mime_type, byte_size, width, height, checksum, state (`pending_upload|ready|deleting|deleted|rejected`), expires_at, created_at.
- `visual_jobs`: id, project_id, owner_user_id, operation, status (`queued|running|completed|failed|cancelled`), safe inputs/asset IDs, provider/model revision, seed/dimensions, idempotency key, attempt count, safe error code, output asset IDs, created_at, updated_at, completed_at.
- `visual_audit_events`: actor, project, asset/job, event, timestamp, minimal metadata; do not log prompts or sensitive image data unless an explicit retention/security review approves it.

Apply row-level security or equivalent database authorization to all project-owned records. Storage buckets must be private; object keys should be random and not disclose user/project names. Temporary inputs and outputs need a documented TTL and lifecycle cleanup job.

## Worker boundary and queue semantics

- Expose the worker only on a private network; deny public ingress.
- Authenticate server-to-worker calls with a server-only secret or short-lived signed token. Keep it out of `NEXT_PUBLIC_*`, logs, browser responses, and source control. Rotate it.
- Worker validates every message independently and accepts only known job IDs/operations; do not trust user identity fields from browser payloads.
- Use durable queue semantics with bounded concurrency, request timeouts, retry policy for transient failures, dead-letter queue, idempotent result persistence, and job status transitions.
- Authenticate callbacks or, preferably, have the Next.js backend consume worker results from a trusted queue. Reject duplicate/stale transitions.
- The current `visual-worker/app.py` is not this queue: `/jobs/dry-run` currently validates metadata and returns immediately without persistence or inference.

## Safety and privacy controls

- Validate file signatures by decoding images; do not rely only on client MIME/extension. Limit total pixels as well as bytes to mitigate decompression bombs.
- Avoid public asset URLs. Use short-lived signed URLs and least-privilege storage credentials.
- Define user consent and deletion flow for model photographs; collect no body measurements for visual generation unless separately justified.
- Add content policy checks for prompts and outputs, abuse reporting, rate limits, per-user cost ceilings, and operational alerts.
- Do not persist raw image data in job rows, localStorage, application logs, or analytics.
- Display explicit notice: “Preview visual saja — bukan bukti ukuran atau kecocokan fisik.”

## Implementation sequence

### Step 1 — Restore and verify app prerequisites

Recover the full application manifest and shell from the owner’s source, confirm auth and project DB, and run install/typecheck/build. Do not fabricate missing files from the partial snapshot.

### Step 2 — Server-side contracts and auth adapter

Add server-only session/project authorization utilities and typed request/response schemas. Add unit tests for unauthenticated, unauthorized project, invalid asset, and malformed operation cases.

### Step 3 — Private temporary asset storage

Implement short-lived signed upload/finalize/download/delete routes, private bucket policies, image decoding limits, TTL cleanup, and deletion tests.

### Step 4 — Durable job persistence and queue

Persist job and audit state transactionally, enqueue idempotently, add authenticated job status/cancel routes, retry/dead-letter behavior, and owner isolation tests.

### Step 5 — Private Next.js-to-worker adapter

Use a server-only worker URL/credential, strict timeout and payload limits, private ingress, trusted callbacks/queue consumption, and secret rotation. Keep the existing worker in dry-run until integration tests pass.

### Step 6 — GPU provider proof of concept

Only after legal/security gates: add one model provider in an isolated worker image with pinned dependencies/checkpoints, reproducible fixtures, resource/cost limits, and documented fallback behavior.

## Release acceptance checklist

- [ ] Full app shell and lockfile present; clean install, typecheck, lint, build pass.
- [ ] No browser-to-worker network path and no worker secret in client bundle.
- [ ] Unauthenticated requests receive 401; cross-project/cross-user access receives 403 or non-disclosing 404.
- [ ] Uploads enforce real image decoding, MIME, byte/pixel limits, private storage, and signed URL expiry.
- [ ] Job creation is idempotent, durable, quota-limited, and asynchronous.
- [ ] Queue retries are bounded; terminal failures do not leak stack traces or secrets.
- [ ] Owner-isolation, expiry, cancellation, deletion, and late-result tests pass.
- [ ] Audit logs are minimal and do not contain raw images or sensitive prompts by default.
- [ ] UI consistently labels output as a visual preview only.
- [ ] Pattern-engineering and production-export outputs remain unchanged by visual jobs.
- [ ] Model, checkpoint, and third-party data licenses are reviewed before enabling inference.

Until these gates pass, keep the current local-only preview UI and dry-run worker, and do not enable real uploads or AI inference.
