/**
 * Stackra file contract:
 * Purpose: `VersionExistsError`: thrown when a version already exists.
 * Boundary: SQL over the D1 binding only; no rule is decided here. Writes that belong together go in one D1 batch
 *           (one transaction). The licence tables are stackra-183's.
 * Runtime: Cloudflare Workers
 * Governing contract: ADR 0453 (decision 3); migrations/0001_registry.sql.
 */

/** Thrown when a version already exists. */
export class VersionExistsError extends Error {
  override readonly name = "VersionExistsError";
}
