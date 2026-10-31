/**
 * Stackra file contract:
 * Purpose: `SPEC_DESIGN_SECTIONS`, the sections a design must have: plan.md's `##` headings for a feature or big spec,
 *          and the `###` headings under a small spec's `## Design`, in this order.
 * Boundary: data only; a section that does not apply says "none".
 * Runtime: node
 * Governing contract: ADR 0502 (spec tiers, EARS criteria and the design); ADR 0120. Loaded by plain Node from source
 *                     by core's `tools/scripts` wrappers, so it imports values by relative `.ts` paths and uses
 *                     erasable TypeScript only (ADR 0421 decision 2).
 */

/** The design's sections, in order. */
export const SPEC_DESIGN_SECTIONS: readonly string[] = [
  "Architecture overview",
  "Components and responsibilities",
  "Files and folders",
  "Data models and migrations",
  "Contracts",
  "Error handling",
  "Security and tenancy",
  "Testing strategy",
  "Rollout",
];
