/**
 * Stackra file contract:
 * Purpose: `grantCoverageOf(grants, roleIds, permissionIds)`, how many of the permissions the roles hold: a role's
 *          summary ("12 of 30") and the checked, dashed or empty state of a bulk checkbox.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: design-system gap inventory row 40 (owner choice "P1 + P2 core", 2026-10-28); ADR 0305.
 */
import type { PermissionGrants } from "#contracts/types/permission-grants.type";
import type { GrantCoverage } from "#core/types/grant-coverage.type";

/**
 * The coverage of `permissionIds` across `roleIds`.
 * @param grants - the current grants
 * @param roleIds - the roles counted
 * @param permissionIds - the permissions counted
 * @returns the count, the total and whether all or some are granted
 */
export function grantCoverageOf(
  grants: PermissionGrants,
  roleIds: readonly string[],
  permissionIds: readonly string[],
): GrantCoverage {
  let count = 0;
  for (const roleId of roleIds) {
    const held = grants[roleId] ?? [];
    for (const id of permissionIds) if (held.includes(id)) count += 1;
  }
  const total = roleIds.length * permissionIds.length;
  return { count, total, isAll: total > 0 && count === total, isSome: count > 0 && count < total };
}
