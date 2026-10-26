/**
 * Stackra file contract:
 * Purpose: `BreadcrumbsProps`, the props of the native `Breadcrumbs` in `breadcrumbs.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0313 (decision 7); ADR 0060 (right-to-left).
 */
import type { ViewProps } from "react-native";
import type { BreadcrumbsContractProps } from "#contracts/types/breadcrumbs-contract-props.type";

/**
 * Props of the native Breadcrumbs: the shared contract plus the `View`'s own props, passed through. The view's
 * `accessibilityLabel` is the contract's `label`, so the type refuses it.
 */
export type BreadcrumbsProps = BreadcrumbsContractProps &
  Omit<ViewProps, keyof BreadcrumbsContractProps | "accessibilityLabel" | "children">;
