from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="FEBRIA Visual Worker", version="0.1.0-dry-run")


class Operation(str, Enum):
    generate_model = "generate_model"
    segment_region = "segment_region"
    try_on_preview = "try_on_preview"


class DryRunRequest(BaseModel):
    project_id: str = Field(min_length=1, max_length=128)
    operation: Operation
    prompt: Optional[str] = Field(default=None, max_length=1000)
    model_image_asset_id: Optional[str] = Field(default=None, max_length=128)
    garment_image_asset_id: Optional[str] = Field(default=None, max_length=128)
    mask_asset_id: Optional[str] = Field(default=None, max_length=128)
    seed: int = Field(default=42, ge=0, le=4294967295)
    width: int = Field(default=768, ge=64, le=2048)
    height: int = Field(default=1024, ge=64, le=2048)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mode": "dry-run", "warning": "visual_preview_only"}


@app.post("/jobs/dry-run")
def create_dry_run(request: DryRunRequest) -> dict:
    if request.operation == Operation.generate_model and not request.prompt:
        raise HTTPException(status_code=422, detail="prompt is required for generate_model")
    if request.operation == Operation.segment_region and not request.model_image_asset_id:
        raise HTTPException(status_code=422, detail="model_image_asset_id is required for segment_region")
    if request.operation == Operation.try_on_preview and (
        not request.model_image_asset_id or not request.garment_image_asset_id or not request.mask_asset_id
    ):
        raise HTTPException(
            status_code=422,
            detail="model_image_asset_id, garment_image_asset_id, and mask_asset_id are required for try_on_preview",
        )

    now = datetime.now(timezone.utc).isoformat()
    return {
        "id": str(uuid4()),
        "projectId": request.project_id,
        "operation": request.operation.value,
        "status": "queued",
        "inputs": {
            "prompt": request.prompt,
            "modelImageAssetId": request.model_image_asset_id,
            "garmentImageAssetId": request.garment_image_asset_id,
            "maskAssetId": request.mask_asset_id,
        },
        "configuration": {
            "provider": "dry-run",
            "modelRevision": "not-loaded",
            "seed": request.seed,
            "width": request.width,
            "height": request.height,
        },
        "outputAssetIds": [],
        "warning": "visual_preview_only",
        "createdAt": now,
        "message": "Job validated only; no model inference was executed.",
    }
