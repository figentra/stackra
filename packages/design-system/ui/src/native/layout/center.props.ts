/**
 * Stackra file contract:
 * Purpose: `CenterProps`, the props of the native `Center`: the shared contract plus every `View` prop.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave C).
 */
import type { ViewProps } from "react-native";

import type { CenterContractProps } from "#contracts/types/center-contract-props.type";

/** Props of the native Center. */
export type CenterProps = CenterContractProps & Omit<ViewProps, keyof CenterContractProps>;
