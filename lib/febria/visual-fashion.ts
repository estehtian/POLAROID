export type VisualFashionOperation = "generate_model" | "segment_region" | "try_on_preview";
export type VisualFashionJobStatus = "queued" | "running" | "completed" | "failed";

/** Metadata contract for future server-side jobs. This does not execute a model. */
export type VisualFashionJob = {
  id: string;
  projectId: string;
  operation: VisualFashionOperation;
  status: VisualFashionJobStatus;
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

export type VisualFashionAsset = {
  id: string;
  projectId: string;
  kind: "model" | "garment" | "mask" | "preview";
  mimeType: "image/jpeg" | "image/png" | "image/webp";
  byteSize: number;
  width: number;
  height: number;
  createdAt: string;
};

const OPERATIONS: VisualFashionOperation[] = ["generate_model", "segment_region", "try_on_preview"];
const STATUSES: VisualFashionJobStatus[] = ["queued", "running", "completed", "failed"];
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Runtime guard for untrusted job payloads at API/worker boundaries. */
export function isVisualFashionJob(value: unknown): value is VisualFashionJob {
  if (!isRecord(value) || !isRecord(value.inputs) || !isRecord(value.configuration)) return false;
  const configuration = value.configuration;
  return typeof value.id === "string" && value.id.length > 0 &&
    typeof value.projectId === "string" && value.projectId.length > 0 &&
    OPERATIONS.includes(value.operation as VisualFashionOperation) &&
    STATUSES.includes(value.status as VisualFashionJobStatus) &&
    value.warning === "visual_preview_only" &&
    Array.isArray(value.outputAssetIds) && value.outputAssetIds.every(id => typeof id === "string") &&
    typeof value.createdAt === "string" &&
    typeof configuration.provider === "string" && typeof configuration.modelRevision === "string" &&
    typeof configuration.seed === "number" && Number.isSafeInteger(configuration.seed) &&
    typeof configuration.width === "number" && Number.isInteger(configuration.width) && configuration.width > 0 &&
    typeof configuration.height === "number" && Number.isInteger(configuration.height) && configuration.height > 0;
}
