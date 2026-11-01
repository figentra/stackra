/**
 * Stackra file contract:
 * Purpose: `specAtLeast(status, stage)`, whether a spec status has reached a stage in the lifecycle order.
 * Boundary: pure.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */
import { SPEC_STATUSES } from "../constants/spec-statuses.constant.ts";

/**
 * True when `status` is `stage` or later.
 *
 * @param status - a lower-cased status.
 * @param stage - a lower-cased stage.
 * @example
 * specAtLeast("done", "tasked"); // true
 */
export function specAtLeast(status: string, stage: string): boolean {
  return SPEC_STATUSES.indexOf(status) >= SPEC_STATUSES.indexOf(stage);
}
