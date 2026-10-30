/**
 * Stackra file contract:
 * Purpose: `PermissionRole`, one column of a `PermissionsMatrix`: a role such as cashier, store manager or owner.
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: design-system gap inventory row 40 (owner choice "P1 + P2 core", 2026-10-28); ADR 0305.
 */

/** One role of a permissions matrix. */
export interface PermissionRole {
  /** The role's id, the key of its grants. */
  readonly id: string;
  /** The role's translated name. */
  readonly label: string;
}
