/**
 * Stackra file contract:
 * Purpose: `SpinnerProps`, the props of the native `Spinner` in `spinner.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          6, the loaders' exception of 2026-11-02; decision 7).
 */
import type { ViewProps } from "react-native";
import type { SpinnerContractProps } from "#contracts/types/spinner-contract-props.type";

/** The shared contract plus the view's own props; the name and the hiding are the contract's `label`. */
export type SpinnerProps = SpinnerContractProps &
  Omit<
    ViewProps,
    | keyof SpinnerContractProps
    | "children"
    | "accessibilityLabel"
    | "aria-label"
    | "accessible"
    | "accessibilityElementsHidden"
    | "importantForAccessibility"
    | "aria-hidden"
    | "accessibilityState"
    | "accessibilityRole"
  >;
