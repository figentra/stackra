/**
 * Stackra file contract:
 * Purpose: `TabBarProps`, the props of the native `TabBar` in `tab-bar.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, adapted forms); ADR
 *          0303 (decisions 1 and 7); ADR 0317 (decisions 1, 3 and 7); ADR 0061 (React Navigation and native tabs); ADR
 *          0060; WCAG 2.2 SC 1.3.1, 2.5.8 and 4.1.2.
 */
import type { ViewProps } from "react-native";
import type { TabBarContractProps } from "#contracts/types/tab-bar-contract-props.type";

/**
 * Props of the native TabBar: the shared contract plus the root `View`'s own props, passed through. The view's
 * `accessibilityLabel` and `accessibilityRole` are the contract's `label` and the bar's fixed role, so the type
 * refuses them.
 */
export type TabBarProps = TabBarContractProps &
  Omit<
    ViewProps,
    keyof TabBarContractProps | "accessibilityLabel" | "accessibilityRole" | "children"
  >;
