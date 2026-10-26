/**
 * Stackra file contract:
 * Purpose: `PageHeaderProps`, the props of the native `PageHeader` in `page-header.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, adapted forms); ADR
 *          0303 (decision 7); ADR 0317 (decisions 1, 4 and 7); WCAG 2.2 SC 1.3.1, 2.4.6 and 2.5.8.
 */
import type { ViewProps } from "react-native";
import type { PageHeaderContractProps } from "#contracts/types/page-header-contract-props.type";

/**
 * Props of the native PageHeader: the shared contract plus the root `View`'s own props, passed through. The view's
 * `accessibilityLabel` is the contract's `label`, so the type refuses it.
 */
export type PageHeaderProps = PageHeaderContractProps &
  Omit<ViewProps, keyof PageHeaderContractProps | "accessibilityLabel" | "children">;
