/**
 * Stackra file contract:
 * Purpose: `SCOPE_OWNER_TRAITS`, the `@stackra/tenancy` traits that give a model its owner column and row-level
 *          security (`BelongsToTenant`, `BelongsToTenantOrPlatform`): a model of a service that runs tenancy carries
 *          one of them or is `Model.global(...)`.
 * Boundary: a frozen list of trait names as the reader records them; the traits themselves are tenancy's.
 * Runtime: isomorphic
 * Governing contract: ADR 0239 (decision 1); ADR 0210 (2026-10-24 amendment: `Model.global`); ADR 0323.
 */

/** The owner traits. */
export const SCOPE_OWNER_TRAITS: readonly string[] = Object.freeze([
  "BelongsToTenant",
  "BelongsToTenantOrPlatform",
]);
