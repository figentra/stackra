/**
 * Stackra file contract:
 * Purpose: `PermissionItem`, one row of a `PermissionsMatrix`: a permission such as "Issue refunds".
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: design-system gap inventory row 40 (owner choice "P1 + P2 core", 2026-10-28); ADR 0305.
 */

/** One permission of a permissions matrix. */
export interface PermissionItem {
  /** The permission's id, as the grants hold it. */
  readonly id: string;
  /** The permission's translated name. */
  readonly label: string;
  /** A translated line under the name: what the permission lets a person do. */
  readonly description?: string | undefined;
}
