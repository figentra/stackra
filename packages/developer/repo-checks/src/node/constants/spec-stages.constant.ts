/**
 * Stackra file contract:
 * Purpose: `SPEC_STAGES`, the stages a spec reports as it moves (`clarified` to `done`).
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */

/** The stage names a spec passes through after Draft. */
export const SPEC_STAGES: readonly string[] = [
  "clarified",
  "planned",
  "tasked",
  "implementing",
  "done",
];
