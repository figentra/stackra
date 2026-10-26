/**
 * Stackra file contract:
 * Purpose: `CursorPaginationProps`, the props of the native `CursorPagination` in `cursor-pagination.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0313 (decisions 4 and 7); ADR 0060 (right-to-left).
 */
import type { ViewProps } from "react-native";
import type { CursorPaginationContractProps } from "#contracts/types/cursor-pagination-contract-props.type";

/**
 * Props of the native CursorPagination: the shared contract plus the `View`'s own props, passed through. The view's
 * `accessibilityLabel` is the contract's `label`, so the type refuses it.
 */
export type CursorPaginationProps = CursorPaginationContractProps &
  Omit<ViewProps, keyof CursorPaginationContractProps | "accessibilityLabel" | "children">;
