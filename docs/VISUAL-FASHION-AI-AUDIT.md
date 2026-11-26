# FEBRIA Visual Fashion AI — Technical Audit and Integration Plan

Audit date: 2026-11-26
Reference: [nuwandda/ai-clothing-fashion-design-generator](https://github.com/nuwandda/ai-clothing-fashion-design-generator)
Reference revision: `cb0803fd87bd0a9ac7e2f5a3739ec624437a1d4c`
License: MIT

## 1. Scope and status

This document audits the public reference repository as an AI visualization reference. It does not copy or execute its scripts inside FEBRIA and does not claim that its output is technically fitted clothing.

The target branch preserves the existing FEBRIA source and homepage. No production pattern, DXF, PDF, grading, 3D fitting, or garment-size logic should be inferred from generated images.

## 2. Verified pipeline

| Stage | Reference implementation | FEBRIA interpretation |
|---|---|---|
| Text-to-image model | `generate_model.py`, RealVisXL, `auto1111sdk` | Generate visual concepts/models behind an isolated worker service |
| Clothing segmentation | `segment.py`, Segment Anything ViT-H | Help edit garment regions; never replace pattern geometry |
| Virtual try-on | `try_on.py`, IDM-VTON, DensePose, human parsing | Produce a visual preview after explicit asset validation |

The repository also includes pre-generated reference images, masks, garment samples, and result images. Those are examples and test fixtures, not a pattern library or production fit dataset.

## 3. Technical findings

### 3.1 Generation script

- Loads `weights/realvisxlV40_v40LightningBakedvae.safetensors` only when the weight exists.
- Hard-codes a GPU-oriented `StableDiffusionPipeline` and a 768×1024 output.
- Uses random seeds and 5 sampling steps.
- Produces a model image, not a pattern or garment construction specification.

### 3.2 Segmentation script

- Loads SAM ViT-H at import time and sends it to CUDA.
- Requires an interactive Matplotlib window and exactly three positive point coordinates.
- Writes a JPEG mask beside the source image.
- Has no batch API, device fallback, input validation, ownership metadata, or deterministic mask format contract.

### 3.3 Try-on script

- Loads IDM-VTON model components at module import time.
- Uses FP16 CUDA tensors and defaults to CPU only when CUDA is unavailable.
- Requires cloned IDM-VTON source, DensePose assets, human parsing assets, OpenPose assets, and model weights.
- Resizes all inputs to 768×1024 and applies a fixed 30-step path from the CLI.
- Its mask and pose logic contains incomplete branches and does not expose a typed job contract.

### 3.4 Dependencies

The reference pins a large historical Python stack, including PyTorch 2.1.0, Diffusers 0.25.0, Transformers 4.30.2, NumPy 1.23.5, and Gradio 3.41.2. Version compatibility must be proven in an isolated environment. It is not recommended to merge these dependencies into the existing Next.js project directly.

## 4. Integration risks

1. **Not fit evidence:** a visually plausible garment is not a measurement-validated fit.
2. **Heavy GPU runtime:** model loading and FP16 CUDA requirements must not block the web application.
3. **Large assets:** model checkpoints and generated images must use object storage, not browser localStorage or application bundles.
4. **Licensing:** the reference is MIT, but its external model weights, DensePose, SAM, IDM-VTON, and other assets have independent terms that require separate review.
5. **Privacy:** uploaded photos and body measurements are sensitive data and require consent, ownership, retention, deletion, access control, and audit rules.
6. **Prompt and asset safety:** generation needs content restrictions and abuse controls.
7. **Dependency instability:** the scripts rely on older packages and external repositories/checkpoints.
8. **Non-determinism:** random seeds and sampling defaults make visual comparison unreliable unless jobs record every input and configuration value.

## 5. Recommended architecture

```text
FEBRIA Next.js
├── Visual Design Studio UI
├── approved server API routes
└── project/asset metadata

AI visualization worker (separate GPU service)
├── generate-text-to-model
├── segment-garment-region
├── try-on-preview
├── content validation
└── provider/model adapters

FEBRIA data plane
├── object storage for inputs/results
├── job records and audit events
├── retention and deletion
└── project ownership / RLS

Pattern engineering (independent)
├── measurements
├── rule-based drafting
├── grading
├── marker planning
└── validated SVG/PDF/DXF export
```

The pattern engine must remain independent. It may receive user intent or a reference garment ID, but it must never accept an image as proof of pattern dimensions.

## 6. Typed job contract

```typescript
export type VisualFashionJob = {
  id: string;
  projectId: string;
  operation: "generate_model" | "segment_region" | "try_on_preview";
  status: "queued" | "running" | "completed" | "failed";
  inputs: {
    prompt?: string;
    modelImageAssetId?: string;
    garmentImageAssetId?: string;
    maskAssetId?: string;
  };
  configuration: {
    provider: string;
    modelRevision: string;
    seed: number;
    width: number;
    height: number;
  };
  outputAssetIds: string[];
  warning: "visual_preview_only";
  createdAt: string;
  completedAt?: string;
};
```

Every job must record the provider/model revision, checkpoint hashes, seed, dimensions, sampler steps, software revision, user, project, content checks, and error details.

## 7. Server controls

- Store provider keys only on the server.
- Proxy signed upload/download operations.
- Validate MIME type, dimensions, size, and malicious file properties.
- Use allow-listed operations and a strict request schema.
- Apply authentication, project ownership, row-level security, rate limits, cost limits, and queue timeouts.
- Reject or quarantine unsafe inputs and outputs.
- Return only asset IDs and job status to the Next.js client.
- Preserve source assets until the user-defined retention policy expires.
- Remove generated assets on project deletion where policy requires.

## 8. Delivery phases

### Phase A — Documentation and contract

- Add a Visual Fashion module definition without adding a misleading production-fit status.
- Define asset and job entities.
- Record reference model/license/checkpoint requirements.
- Add acceptance fixtures and safety rules.

### Phase B — Read-only proof of concept

- Run the reference pipeline in a disposable GPU environment.
- Test CPU fallback, GPU requirements, checkpoint loading, output dimensions, and failure behavior.
- Produce a reproducible fixture report.
- Do not expose the worker directly to browser users.

### Phase C — Controlled preview service

- Implement one provider adapter and one async job queue.
- Add signed asset upload, persisted job state, audit events, cost limits, and deletion.
- Integrate a `Preview only / not fit evidence` banner in the UI.

### Phase D — Engineering separation

- Link successful concepts to projects as optional visual references.
- Keep measurements and pattern geometry in FEBRIA domain services.
- Require human and geometry review before manufacturing exports.

## 9. Acceptance criteria

The visual module may be considered implemented only after:

1. A complete environment and manifest are available.
2. A GPU and CPU-fallback result are reproducible from the same committed fixture.
3. A generated asset can be uploaded, queued, downloaded, and deleted.
4. All provider/model/checkpoint details are retained with the job.
5. Project ownership and retention rules are tested.
6. The UI clearly labels all output as a visual preview only.
7. No garment size or fit claim is inferred from pixels.
8. Pattern export continues to require independent engineering validation.

## 10. Explicitly excluded

- Copying the reference scripts into the Next.js browser bundle.
- Claiming IDM-VTON results prove physical fit.
- Connecting image results directly to grading or marker planning.
- Adding model checkpoints to source control.
- Replacing the existing homepage or deleting existing modules.
- Marketing the feature as production-ready until the acceptance criteria and external legal review pass.
