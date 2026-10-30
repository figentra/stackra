/**
 * Stackra file contract:
 * Purpose: `InlineLoadingProps`, the props of the native `InlineLoading` in `inline-loading.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); design-system gap
 *          inventory row 28.
 */
import type { ViewProps } from "react-native";
import type { InlineLoadingContractProps } from "#contracts/types/inline-loading-contract-props.type";

/**
 * Props of the native InlineLoading: the shared contract, the props of a `View` (its children refused, the component
 * draws them) and `playsHaptics`, true by default: a success or error haptic when the state lands there.
 */
export type InlineLoadingProps = InlineLoadingContractProps &
  Omit<ViewProps, keyof InlineLoadingContractProps | "children"> & {
    /** True to play a success or error haptic when the state changes to it. Defaults to true. */
    readonly playsHaptics?: boolean | undefined;
  };
