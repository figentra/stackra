/**
 * Stackra file contract:
 * Purpose: `WORKER_BASE`, the settings every Worker gets.
 * Boundary: internal; see `workerSettingsOf`.
 * Runtime: isomorphic
 * Governing contract: ADR 0519 (decision 2); STA-1988.
 */
import type { WorkerSettings } from "#core/types/worker-settings.type";

/**
 * The base of every Worker: logs with invocation logs and Issues, source maps, redacted query strings, no cache, and
 * production traffic moved in steps (ADR 0533: a gradual rollout with automatic rollback is not the owner's to approve).
 */
export const WORKER_BASE: WorkerSettings = {
  observability: { logs: true, invocationLogs: true, issues: true, redactQueryString: true },
  uploadSourceMaps: true,
  cache: false,
  workersDev: false,
  keepVars: false,
  rollout: [10, 50, 100],
};
