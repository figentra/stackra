/**
 * Stackra file contract:
 * Purpose: explicit barrel of the member's interfaces, so other folders import `#src/interfaces`.
 * Boundary: re-exports types only.
 * Runtime: worker
 * Governing contract: ADR 0006 (explicit barrels), ADR 0233 (subpath imports).
 */
export type { EnvSyncEnv } from "./env-sync-env.interface";
