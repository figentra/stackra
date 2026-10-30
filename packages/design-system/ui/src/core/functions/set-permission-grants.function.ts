/**
 * Stackra file contract:
 * Purpose: `setPermissionGrants(grants, roleIds, permissionIds, isGranted)`, the grants with some permissions turned
 *          on or off for some roles: one cell, a group for a role, a role's whole column, or a row across roles.
 * Boundary: pure; returns new grants and never changes the ones it is given. Each role keeps its own order and gains
 *           new ids at the end, with no duplicates.
 * Runtime: isomorphic
 * Governing contract: design-system gap inventory row 40 (owner choice "P1 + P2 core", 2026-10-28); ADR 0305.
 */
import type { PermissionGrants } from "#contracts/types/permission-grants.type";

/**
 * The grants with `permissionIds` granted to, or taken from, each of `roleIds`.
 * @param grants - the current grants
 * @param roleIds - the roles to change
 * @param permissionIds - the permissions to grant or take
 * @param isGranted - true to grant, false to take
 * @returns the new grants
 */
export function setPermissionGrants(
  grants: PermissionGrants,
  roleIds: readonly string[],
  permissionIds: readonly string[],
  isGranted: boolean,
): PermissionGrants {
  const next: Record<string, readonly string[]> = { ...grants };
  for (const roleId of roleIds) {
    const held = grants[roleId] ?? [];
    next[roleId] = isGranted
      ? [...held, ...permissionIds.filter((id) => !held.includes(id))]
      : held.filter((id) => !permissionIds.includes(id));
  }
  return next;
}
