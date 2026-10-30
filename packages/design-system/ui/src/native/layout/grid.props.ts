/**
 * Stackra file contract:
 * Purpose: `GridProps`, the props of the native `Grid`: the shared contract plus every `View` prop.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave C).
 */
import type { ViewProps } from "react-native";

import type { GridContractProps } from "#contracts/types/grid-contract-props.type";

/** Props of the native Grid. */
export type GridProps = GridContractProps & Omit<ViewProps, keyof GridContractProps>;
