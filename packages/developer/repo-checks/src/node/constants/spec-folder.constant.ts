/**
 * Stackra file contract:
 * Purpose: `SPEC_FOLDER`, the shape of a spec folder name: `<prefix>-<n>-<slug>`, the prefix being the issue tracker's team key in lower case.
 * Boundary: data only.
 * Runtime: node
 * Governing contract: ADR 0120 (SDLC spec location, lanes and change risk); ADR 0198; ADR 0282 (decision 3). Loaded by
 *                     plain Node from source by core's `tools/scripts` wrappers, so it imports values by relative
 *                     `.ts` paths and uses erasable TypeScript only (ADR 0421 decision 2).
 */

/** Group 1 is the prefix (lower-case letters and digits, starting with a letter), group 2 the issue number. */
export const SPEC_FOLDER = /^([a-z][a-z0-9]*)-(\d+)-[a-z0-9]+(?:-[a-z0-9]+)*$/;
