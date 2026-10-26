/**
 * Stackra file contract:
 * Purpose: `ProgressBarProps`, the props of the native `ProgressBar` in `progress-bar.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0312; ADR 0165 (HeroUI Native on native); WCAG 2.2 SC 2.3.3 and 4.1.2.
 */
import type { ViewProps } from "react-native";
import type { ProgressBarContractProps } from "#contracts/types/progress-bar-contract-props.type";

/**
 * Props of the native ProgressBar: the shared contract plus React Native's own view props, passed through to the
 * root. `label`, the value and the busy state own the accessibility props, and the parts are drawn here, so
 * `children` and those props are refused.
 */
export type ProgressBarProps = ProgressBarContractProps &
  Omit<
    ViewProps,
    | keyof ProgressBarContractProps
    | "children"
    | "accessible"
    | "accessibilityRole"
    | "accessibilityLabel"
    | "accessibilityValue"
    | "accessibilityState"
    | "role"
    | "aria-label"
    | "aria-labelledby"
    | "aria-busy"
    | "aria-valuemax"
    | "aria-valuemin"
    | "aria-valuenow"
    | "aria-valuetext"
  >;
