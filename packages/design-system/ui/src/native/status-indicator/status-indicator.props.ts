/**
 * Stackra file contract:
 * Purpose: `StatusIndicatorProps`, the props of the native `StatusIndicator` in `status-indicator.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); gap inventory row 30; WCAG 2.2 SC 1.4.1.
 */
import type { ViewProps } from "react-native";

import type { StatusIndicatorContractProps } from "#contracts/types/status-indicator-contract-props.type";

/** Props of the native StatusIndicator: the shared contract plus the props of its row `View`. */
export type StatusIndicatorProps = StatusIndicatorContractProps &
  Omit<ViewProps, keyof StatusIndicatorContractProps>;
