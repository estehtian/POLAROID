# FEBRIA Visual AI — Next implementation steps

Branch: `febria/visual-fashion-ai-audit`

## Completed in this branch

- Reference pipeline audit and integration boundaries.
- Typed TypeScript job and asset contracts.
- Visual Fashion Studio with local-only image previews.
- Separate Python worker boundary with health and dry-run job validation.

## Next execution order

1. **Run the dry-run worker locally** and verify health, valid jobs, and 422 validation responses.
2. Recover or confirm the complete Next.js manifest before adding client-to-worker networking.
3. Add server-only proxy routes with authentication, project ownership, rate limits, and request timeouts.
4. Add object storage and signed URLs; do not put image bytes or checkpoints in localStorage/source control.
5. Select one model provider and run a disposable GPU proof-of-concept with pinned checkpoints and license review.
6. Add reproducible fixtures, safety checks, cost ceilings, and deletion/retention tests.
7. Integrate completed preview assets into projects as references only; keep pattern geometry and production exports independent.

## Current acceptance status

| Gate | Status |
|---|---|
| Browser UI does not execute models | PASS by design |
| Job contract exists | PASS |
| Worker validates metadata | Implemented; local verification pending |
| Real inference | Not implemented |
| Auth/storage/queue | Not implemented |
| Fit or production claims | Explicitly excluded |
