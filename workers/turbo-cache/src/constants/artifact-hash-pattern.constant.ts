/**
 * Stackra file contract:
 * Purpose: the shape an artifact hash in `/v8/artifacts/:hash` must have before it becomes part of an R2 key.
 * Boundary: a constant only; handle-request.ts tests the path segment against it.
 * Runtime: worker
 * Governing contract: ADR 0026 (the remote-cache API); the Turborepo remote-cache API (v8).
 */

/** Turborepo task hashes are hex; letters and digits only keeps a key free of `/`, `..` and other path tricks. */
export const ARTIFACT_HASH_PATTERN = /^[A-Za-z0-9]{1,128}$/;
