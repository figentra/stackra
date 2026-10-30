/**
 * Stackra file contract:
 * Purpose: `SPEC_IMPACT_FIELDS`, the `## Impact` lines every spec past Draft must answer.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */

/** The Impact fields a spec answers before it is planned. */
export const SPEC_IMPACT_FIELDS: readonly string[] = [
  "Apps touched",
  "Services touched",
  "Packages touched",
  "Cross-service events",
  "Tenancy and data",
  "Secrets",
  "ADR needed",
  "New dependencies",
  "Deploy modes",
  "Licence tier",
  "Docs to update",
  "Lane",
  "Change risk",
];
