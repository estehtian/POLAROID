# FEBRIA Visual Worker (dry-run)

Isolated worker boundary for the future GPU visual-fashion pipeline.

This service deliberately does **not** load RealVisXL, SAM, or IDM-VTON yet. It validates the job contract and returns a deterministic dry-run response so the web application can be integrated without downloading checkpoints or exposing model code to the browser.

## Run locally

```bash
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app:app --reload --port 8001
```

Health check:

```bash
curl http://localhost:8001/health
```

Dry-run job:

```bash
curl -X POST http://localhost:8001/jobs/dry-run \\
  -H "content-type: application/json" \\
  -d '{"project_id":"demo","operation":"generate_model","prompt":"white linen shirt"}'
```

## Boundary rules

- This is a server-side process; never expose model or provider credentials to the browser.
- Inputs are metadata only in this phase; image bytes are not accepted or stored.
- Every response is labelled `visual_preview_only`.
- Real inference requires a separate implementation, checkpoint/license review, storage, queue, authentication, rate limiting, and content-safety gates.
