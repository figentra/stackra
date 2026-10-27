/**
 * Stackra file contract:
 * Purpose: explicit barrel of the cache handler folder, so the entry imports its request handler from `#src/cache`;
 *          the settings and token checks stay internal to the folder.
 * Boundary: re-exports only.
 * Runtime: worker
 * Governing contract: ADR 0006 (explicit barrels), ADR 0233 (subpath imports).
 */
export { handleTurboCacheRequest } from "./handle-request";
