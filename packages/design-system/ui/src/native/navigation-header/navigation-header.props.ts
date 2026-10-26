/**
 * Stackra file contract:
 * Purpose: `NavigationHeaderProps`, the props of the native `NavigationHeader` in `navigation-header.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, adapted forms); ADR
 *          0303 (decision 7); ADR 0317 (decisions 1, 4 and 7); ADR 0061 (React Navigation); ADR 0060; WCAG 2.2 SC
 *          1.3.1, 2.4.6 and 2.5.8.
 */
import type { ViewProps } from "react-native";
import type { NavigationHeaderContractProps } from "#contracts/types/navigation-header-contract-props.type";

/**
 * Props of the native NavigationHeader: the shared contract, the top inset switch and the root `View`'s own props,
 * passed through. The view's `accessibilityLabel` is the contract's `label`, so the type refuses it.
 */
export type NavigationHeaderProps = NavigationHeaderContractProps & {
  /** True to pad the top by the status bar's safe-area inset. Defaults to true. */
  readonly hasTopInset?: boolean | undefined;
} & Omit<
    ViewProps,
    keyof NavigationHeaderContractProps | "hasTopInset" | "accessibilityLabel" | "children"
  >;
