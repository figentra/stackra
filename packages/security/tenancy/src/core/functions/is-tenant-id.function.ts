/**
 * Stackra file contract:
 * Purpose: `isTenantId(value)`, whether a string is a tenant id: the public id of the tenant's scope node, `scp_` and
 *          26 lowercase base32 characters.
 * Boundary: pure; checks the form only, never that the node exists or is at the tenant level (the tree answers that).
 *           A tenant is the scope node at the tenant level, so its id is that node's id and no mapping table exists
 *           (ADR 0327 d8: tenancy maps each tenant to a scope node).
 * Runtime: isomorphic
 * Governing contract: ADR 0327 (decisions 3 and 8); ADR 0135 (public ids).
 */
import type { PublicId } from "@stackra/contracts";

/** `scp_` and the 26 characters of a public id. */
const TENANT_ID = /^scp_[0-9a-z]{26}$/;

/**
 * Whether `value` is a tenant id.
 *
 * @example
 * isTenantId("scp_01j9z3k4m5n6p7q8r9s0t1v2w3"); // true
 * isTenantId("usr_01j9z3k4m5n6p7q8r9s0t1v2w3"); // false
 */
export function isTenantId(value: string): value is PublicId<"scp"> {
  return TENANT_ID.test(value);
}
