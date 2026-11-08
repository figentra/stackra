/**
 * Stackra file contract:
 * Purpose: `isSystemAccessPolicy`, whether a policy belongs to the system-access checks: it is named
 *          `pol_<table>_system_access_select` or `_update`, or it names `SYSTEM_ACCESS_ROLE`. `assertRowSecurity`
 *          holds such a policy to the `t.systemAccess` shape (`systemAccessGaps`) and leaves it out of the owner checks.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0239 (2026-11-07 amendment, gap A).
 */
import { SYSTEM_ACCESS_ROLE } from "#core/constants/system-access-role.constant";
import type { RolePolicyRow } from "#testing/types/role-policy-row.type";

/**
 * Whether `policy` is a system-access policy, by its name or its roles.
 *
 * @example
 * isSystemAccessPolicy({ ...row, name: "pol_jobs_system_access_select" }); // true
 */
export function isSystemAccessPolicy(policy: Pick<RolePolicyRow, "name" | "roles">): boolean {
  return (
    /_system_access_(?:select|update)$/.test(policy.name) ||
    policy.roles.split(",").includes(SYSTEM_ACCESS_ROLE)
  );
}
