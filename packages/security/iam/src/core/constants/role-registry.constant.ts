/**
 * Stackra file contract:
 * Purpose: `ROLE_REGISTRY`, every registered module role by its locked key, with the permission keys it holds.
 * Boundary: process-wide and internal: written by `registerRoles`, read by the decision point. A module role is code,
 *           so it beats a snapshot role of the same key (shipped roles are read-only).
 * Runtime: isomorphic
 * Governing contract: ADR 0208 (decision 2, as amended by 0294); ADR 0294 (decision 22).
 */

/** Role key to the permission keys it holds. */
export const ROLE_REGISTRY = new Map<string, readonly string[]>();
