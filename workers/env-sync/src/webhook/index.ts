/**
 * Stackra file contract:
 * Purpose: explicit barrel of the webhook folder, so the entry imports its request handler from `#src/webhook`; the
 *          signature, value and token checks stay internal to the folder.
 * Boundary: re-exports only.
 * Runtime: worker
 * Governing contract: ADR 0006 (explicit barrels), ADR 0233 (subpath imports).
 */
export { handleEnvSyncRequest } from "./handle-request";
