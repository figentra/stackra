/**
 * Stackra file contract:
 * Purpose: `PermissionsMatrixProps`, the props of the native, read-only `PermissionsMatrix` in
 *          `permissions-matrix.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: design-system gap inventory row 40 (owner choice "P1 + P2 core", 2026-10-28); ADR 0305 (rules
 *          10 and 12: one declaration per file).
 */
import type { ScrollViewProps } from "react-native";

import type { PermissionsMatrixContractProps } from "#contracts/types/permissions-matrix-contract-props.type";

/** Props of the native PermissionsMatrix: the shared contract plus the horizontal `ScrollView`'s own props. */
export type PermissionsMatrixProps = PermissionsMatrixContractProps &
  Omit<ScrollViewProps, keyof PermissionsMatrixContractProps | "children" | "horizontal">;
