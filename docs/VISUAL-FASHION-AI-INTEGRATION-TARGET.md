# FEBRIA server-to-worker integration — implementation target

Status date: 2026-11-26
Target branch: `main`

## Decision: keep real uploads and inference disabled until prerequisites exist

The current repository snapshot does not contain a root `package.json`/lockfile, complete Next.js shell, Supabase integration, or a confirmed authentication provider. The visual worker is metadata-only dry-run code without persistent queue or object storage. Do not add a route that pretends to authenticate users, trusts a browser-supplied project ID, or forwards image bytes without verified ownership and retention controls.

This document is the implementation target and release checklist, not a claim that authentication, upload, storage, or queueing is implemented. Keep the existing browser-local preview and dry-run worker until the gates below can be met.

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

Every result remains `visual_preview_only`; visual AI must not alter measurements, pattern geometry, grading, marker plans, or production exports.

## Preconditions

1. Restore or verify the complete Next.js application shell and lockfile, then run typecheck/build in that full checkout.
2. Confirm the actual authentication provider and server-side session verification API. Do not invent a localStorage-based identity.
3. Confirm project ownership semantics and database. Do not trust a project ID from the request without a database authorization check.
4. Select private object storage with lifecycle expiration and deletion support.
5. Select a durable queue and define worker networking, callback authentication, retry, and dead-letter behavior.
6. Review provider/checkpoint/model license terms and data processing/retention obligations before real inference.

## API contract

### `POST /api/visual-fashion/uploads`

- Require a verified server session.
- Accept project ID, declared file name, MIME type, byte size, dimensions, and asset kind.
- Verify project access; enforce allow-listed image MIME, maximum size/dimensions, and per-project quotas.
- Create a pending asset row owned by the authenticated user and project.
- Return a short-lived signed upload URL scoped to one random object key, method, content type, and expiry.
- Browser uploads to private storage; server finalization decodes/verifies the object and marks the asset ready.

### `POST /api/visual-fashion/jobs`

- Require verified session; derive user ID server-side.
- Accept only allow-listed operations (`generate_model`, `segment_region`, `try_on_preview`) and strict, size-limited JSON.
- Verify project access and readiness/ownership of every referenced asset; do not accept arbitrary storage paths or URLs.
- Validate required fields for each operation and reject client-selected provider, model revision, checkpoint, or worker URL.
- Enforce rate, concurrency, and cost quotas; create a durable queued job and audit event transactionally with an idempotency key.
- Enqueue only job ID and validated metadata. Worker receives server-generated, short-lived, narrowly scoped asset access where needed.
- Return `202 Accepted` with job ID and status URL; never wait for GPU inference inside the request.

### `GET /api/visual-fashion/jobs/{jobId}`

Require verified session and authorize job/project access on every request. Return only status, timestamps, safe error code, warning, and result asset IDs. Generate fresh signed download URLs only after authorization.

### Deletion

Authorize ownership; cancel queued work where possible, mark deletion requested, remove source/result objects and metadata according to retention rules, and record a minimal audit event. If a running job cannot be cancelled, late results must be discarded and deleted.

## Minimum data model

- `visual_assets`: id, project_id, owner_user_id, storage_key, kind, mime_type, byte_size, width, height, checksum, state (`pending_upload|ready|deleting|deleted|rejected`), expires_at, created_at.
- `visual_jobs`: id, project_id, owner_user_id, operation, status (`queued|running|completed|failed|cancelled`), safe inputs/asset IDs, provider/model revision, seed/dimensions, idempotency key, attempt count, safe error code, output asset IDs, created_at, updated_at, completed_at.
- `visual_audit_events`: actor, project, asset/job, event, timestamp, minimal metadata. Do not log prompts or sensitive image data by default.

Apply row-level security or equivalent database authorization to project-owned records. Storage buckets stay private; object keys are random and do not reveal user/project names. Temporary inputs/results need a documented TTL and lifecycle cleanup job.

## Worker and queue security

- Expose the worker only on a private network; deny public ingress.
- Authenticate server-to-worker calls with a server-only secret or short-lived signed token. Keep it out of `NEXT_PUBLIC_*`, logs, browser responses, and source control; rotate it.
- Validate every queue message independently and accept only known job IDs/operations. Never trust user identity fields from browser payloads.
- Use durable queue semantics with bounded concurrency, request timeouts, bounded retries, dead-letter handling, and idempotent result persistence.
- Authenticate callbacks or have the backend consume results from a trusted queue. Reject duplicate/stale status transitions.
- The current `visual-worker/app.py` is not a queue: `/jobs/dry-run` validates metadata and returns immediately without persistence or inference.

## Safety and privacy controls

- Decode uploaded images to validate real content; do not trust extension/client MIME. Limit bytes and total pixels to mitigate decompression bombs.
- Avoid public asset URLs. Use short-lived signed URLs and least-privilege storage credentials.
- Define consent and deletion flow for model photographs. Do not collect body measurements for visual generation unless separately justified.
- Add content policy checks, abuse reporting, rate limits, per-user cost ceilings, and operational alerts before inference.
- Do not persist raw image data in job rows, localStorage, application logs, or analytics.
- Keep the UI notice: “Preview visual saja — bukan bukti ukuran atau kecocokan fisik.”

## Implementation sequence

1. **Restore and verify app prerequisites:** recover the complete application manifest and shell from the owner’s source, confirm auth and project DB, then run install/typecheck/build. Do not fabricate missing files from the partial snapshot.
2. **Auth and server contracts:** add server-only session/project authorization utilities and typed request/response schemas. Test unauthenticated, unauthorized project, invalid asset, and malformed operation cases.
3. **Private temporary storage:** implement signed upload/finalize/download/delete routes, private bucket policies, image decoding limits, TTL cleanup, and deletion tests.
4. **Durable jobs and queue:** persist job and audit state transactionally, enqueue idempotently, add authenticated status/cancel routes, retry/dead-letter behavior, and owner-isolation tests.
5. **Private worker adapter:** use server-only worker URL/credential, strict timeout and payload limits, private ingress, trusted callbacks/queue consumption, and secret rotation. Keep the worker dry-run until integration tests pass.
6. **GPU proof of concept:** only after legal/security gates, add one provider in an isolated worker image with pinned dependencies/checkpoints, reproducible fixtures, resource/cost limits, and documented fallback behavior.

## Release acceptance checklist

- [ ] Full app shell and lockfile present; clean install, typecheck, lint, and build pass.
- [ ] No browser-to-worker network path and no worker secret in client bundle.
- [ ] Unauthenticated requests receive 401; cross-project/cross-user access receives 403 or non-disclosing 404.
- [ ] Uploads enforce real image decoding, MIME, byte/pixel limits, private storage, and signed URL expiry.
- [ ] Job creation is idempotent, durable, quota-limited, and asynchronous.
- [ ] Queue retries are bounded; terminal failures do not leak stack traces or secrets.
- [ ] Owner-isolation, expiry, cancellation, deletion, and late-result tests pass.
- [ ] Audit logs are minimal and contain no raw images or sensitive prompts by default.
- [ ] UI consistently labels output as a visual preview only.
- [ ] Pattern-engineering and production-export outputs remain independent of visual jobs.
- [ ] Model, checkpoint, and third-party data licenses are reviewed before inference is enabled.

Until every applicable gate passes, keep the current local-only preview UI and dry-run worker; do not enable real uploads or AI inference.
