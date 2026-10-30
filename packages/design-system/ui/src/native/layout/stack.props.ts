/**
 * Stackra file contract:
 * Purpose: `StackProps`, the props of the native `Stack`: the shared contract plus every `View` prop.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave C).
 */
import type { ViewProps } from "react-native";

import type { StackContractProps } from "#contracts/types/stack-contract-props.type";

/** Props of the native Stack. */
export type StackProps = StackContractProps & Omit<ViewProps, keyof StackContractProps>;
