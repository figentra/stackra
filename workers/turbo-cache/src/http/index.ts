/**
 * Stackra file contract:
 * Purpose: explicit barrel of the HTTP helpers, so the entry imports `withVersion` from `#src/http`.
 * Boundary: re-exports only.
 * Runtime: worker
 * Governing contract: ADR 0006 (explicit barrels), ADR 0233 (subpath imports).
 */
export { withVersion } from "./with-version";
