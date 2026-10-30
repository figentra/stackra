/**
 * Stackra file contract:
 * Purpose: `PermissionGrants`, what a `PermissionsMatrix` edits: the permission ids each role holds, by role id.
 * Boundary: a type only, in its own file; plain data, so it saves as JSON configuration.
 * Runtime: isomorphic
 * Governing contract: design-system gap inventory row 40 (owner choice "P1 + P2 core", 2026-10-28); ADR 0305.
 */

/** The permission ids each role holds, by role id; a missing role holds none. */
export type PermissionGrants = Readonly<Record<string, readonly string[]>>;
