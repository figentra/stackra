/**
 * Stackra file contract:
 * Purpose: `SPECS_DIR`, the repository-relative folder that holds the spec-kit specs.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */

/** The folder every spec-kit spec lives under. */
export const SPECS_DIR = ".agents/specs";
