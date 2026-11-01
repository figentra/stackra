/**
 * Stackra file contract:
 * Purpose: `SPEC_STATUSES`, every value a spec's `**Status**` may declare, in lifecycle order.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */

/** Draft, then the five stages, then the two ends; a status may lag its artifacts, never lead them. */
export const SPEC_STATUSES: readonly string[] = [
  "draft",
  "clarified",
  "planned",
  "tasked",
  "implementing",
  "done",
  "abandoned",
  "superseded",
];
