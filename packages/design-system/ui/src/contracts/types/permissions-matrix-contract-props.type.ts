/**
 * Stackra file contract:
 * Purpose: `PermissionsMatrixContractProps`, the props shared by the web and native `PermissionsMatrix`.
 * Boundary: a type only, in its own file. The native matrix is read-only, so it reads `value` alone.
 * Runtime: isomorphic
 * Governing contract: design-system gap inventory row 40 (owner choice "P1 + P2 core", 2026-10-28); ADR 0305.
 */
import type { PermissionGrants } from "#contracts/types/permission-grants.type";
import type { PermissionGroup } from "#contracts/types/permission-group.type";
import type { PermissionRole } from "#contracts/types/permission-role.type";

/** Props shared by the web and native `PermissionsMatrix`. */
export interface PermissionsMatrixContractProps {
  /** The matrix's accessible name, such as "Store roles". */
  readonly label: string;
  /** The columns: one per role. */
  readonly roles: readonly PermissionRole[];
  /** The rows, in titled groups. */
  readonly groups: readonly PermissionGroup[];
  /** The grants shown (controlled). */
  readonly value?: PermissionGrants | undefined;
}
