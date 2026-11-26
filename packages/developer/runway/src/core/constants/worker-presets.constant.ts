/**
 * Stackra file contract:
 * Purpose: `WORKER_PRESETS`, what each preset adds to the base.
 * Boundary: internal; see `workerSettingsOf`.
 * Runtime: isomorphic
 * Governing contract: ADR 0519 (decision 2); STA-1988.
 */
import { WorkerPreset } from "#core/enums/worker-preset.enum";
import type { WorkerSettings } from "#core/types/worker-settings.type";

/** What each preset adds to the base; a site, a tool and a cache keep shipping at once unless the member opts in. */
export const WORKER_PRESETS: Readonly<Record<WorkerPreset, WorkerSettings>> = {
  [WorkerPreset.PublicSite]: { rollout: [100] },
  [WorkerPreset.Api]: { observability: { traces: true, headSamplingRate: 0.1 } },
  [WorkerPreset.InternalTool]: { previewUrls: false, rollout: [100] },
  [WorkerPreset.Cache]: { cache: true, rollout: [100] },
  [WorkerPreset.Edge]: { observability: { traces: true } },
};
