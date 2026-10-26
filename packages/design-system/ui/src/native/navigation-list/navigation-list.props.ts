/**
 * Stackra file contract:
 * Purpose: `NavigationListProps`, the props of the native `NavigationList` in `navigation-list.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decisions
 *          1, 5 and 7); ADR 0317 (decisions 1, 3, 5 and 7); ADR 0165 (HeroUI Native on native); WCAG 2.2 SC 1.3.1,
 *          2.5.8 and 4.1.2.
 */
import type { ViewProps } from "react-native";
import type { NavigationListContractProps } from "#contracts/types/navigation-list-contract-props.type";

/**
 * Props of the native NavigationList: the shared contract plus the `View`'s own props, passed through. The view's
 * `accessibilityLabel` is the contract's `label`, so the type refuses it.
 */
export type NavigationListProps = NavigationListContractProps &
  Omit<ViewProps, keyof NavigationListContractProps | "accessibilityLabel" | "children">;
