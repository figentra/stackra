/**
 * Stackra file contract:
 * Purpose: `PermissionsMatrixProps`, the props of the web `PermissionsMatrix` in `permissions-matrix.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: design-system gap inventory row 40 (owner choice "P1 + P2 core", 2026-10-28); ADR 0305 (rules
 *          10 and 12: one declaration per file).
 */
import type { HTMLAttributes } from "react";

import type { PermissionGrants } from "#contracts/types/permission-grants.type";
import type { PermissionsMatrixContractProps } from "#contracts/types/permissions-matrix-contract-props.type";

/** Props of the web PermissionsMatrix: the shared contract, editing, and the wrapper `div`'s own attributes. */
export type PermissionsMatrixProps = PermissionsMatrixContractProps & {
  /** The grants at first (uncontrolled). */
  readonly defaultValue?: PermissionGrants | undefined;
  /** Called with the new grants after a cell or a bulk toggle. */
  readonly onChange?: ((grants: PermissionGrants) => void) | undefined;
  /** True to show the grants as allowed or not, with no checkboxes. */
  readonly isReadOnly?: boolean | undefined;
  /** False to skip the ripple a bulk toggle sends down its column or group. */
  readonly isAnimated?: boolean | undefined;
} & Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue" | "children">;
