/**
 * Stackra file contract:
 * Purpose: `WORKER_PRESETS`, what each preset adds to the base.
 * Boundary: internal; see `workerSettingsOf`.
 * Runtime: isomorphic
 * Governing contract: ADR 0519 (decision 2); STA-1988.
 */
import { WorkerPreset } from "#core/enums/worker-preset.enum";
import type { WorkerSettings } from "#core/types/worker-settings.type";

/** What each preset adds to the base. */
export const WORKER_PRESETS: Readonly<Record<WorkerPreset, WorkerSettings>> = {
  [WorkerPreset.PublicSite]: {},
  [WorkerPreset.Api]: {
    observability: { traces: true, headSamplingRate: 0.1 },
    rollout: [10, 50, 100],
  },
  [WorkerPreset.InternalTool]: { previewUrls: false },
  [WorkerPreset.Cache]: { cache: true },
  [WorkerPreset.Edge]: { observability: { traces: true }, rollout: [10, 50, 100] },
};
