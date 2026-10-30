/**
 * Stackra file contract:
 * Purpose: `PermissionGroup`, one titled group of rows of a `PermissionsMatrix`, such as "Sales" or "Inventory".
 * Boundary: a type only, in its own file.
 * Runtime: isomorphic
 * Governing contract: design-system gap inventory row 40 (owner choice "P1 + P2 core", 2026-10-28); ADR 0305.
 */
import type { PermissionItem } from "#contracts/types/permission-item.type";

/** One group of permissions. */
export interface PermissionGroup {
  /** The group's id. */
  readonly id: string;
  /** The group's translated title. */
  readonly label: string;
  /** The group's permissions, in display order. */
  readonly permissions: readonly PermissionItem[];
}
