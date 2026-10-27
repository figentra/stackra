/**
 * Stackra file contract:
 * Purpose: the shape the `teamId` or `slug` query value must have before it namespaces an R2 key.
 * Boundary: a constant only; handle-request.ts tests the query value against it.
 * Runtime: worker
 * Governing contract: ADR 0026 (the remote-cache API); the Turborepo remote-cache API (v8).
 */

/** A team id (`team_…`) or slug: letters, digits, `_` and `-`, so it can never climb out of its key prefix. */
export const TEAM_PATTERN = /^[A-Za-z0-9_-]{1,100}$/;
