/**
 * Stackra file contract:
 * Purpose: `SpinnerProps`, the props of the native `Spinner` in `spinner.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0304; ADR 0165 (HeroUI Native on native); owner decision 6 of STA-350 (thin wrappers).
 */
import type { SpinnerProps as HeroSpinnerProps } from "heroui-native";
import type { SpinnerContractProps } from "#contracts/types/spinner-contract-props.type";

/**
 * Props of the native Spinner: the shared contract plus HeroUI Native's own spinner props, passed through unchanged.
 * HeroUI's `color` is the contract's `tone`; a spinner is the loading state, so `isLoading` and `children` are
 * refused, and `label` owns the accessible name and `accessibilityState` (HeroUI sets `busy`).
 */
export type SpinnerProps = SpinnerContractProps &
  Omit<
    HeroSpinnerProps,
    | keyof SpinnerContractProps
    | "color"
    | "children"
    | "isLoading"
    | "accessibilityLabel"
    | "aria-label"
    | "accessible"
    | "accessibilityElementsHidden"
    | "importantForAccessibility"
    | "aria-hidden"
    | "accessibilityState"
  >;
