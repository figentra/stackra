/**
 * Stackra file contract:
 * Purpose: `ScreenProps`, the props of the native `Screen` in `screen.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, adapted forms); ADR
 *          0303 (decision 7); ADR 0317 (decisions 5 and 7); ADR 0061 (React Navigation); ADR 0060; WCAG 2.2 SC 1.3.4
 *          and 1.4.10.
 */
import type { ViewProps } from "react-native";
import type { ScreenContractProps } from "#contracts/types/screen-contract-props.type";

/**
 * Props of the native Screen: the shared contract plus the root `View`'s own props, passed through. The view's
 * `accessibilityLabel` is the contract's `label`, so the type refuses it.
 */
export type ScreenProps = ScreenContractProps &
  Omit<ViewProps, keyof ScreenContractProps | "accessibilityLabel">;
