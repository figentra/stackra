/**
 * Stackra file contract:
 * Purpose: `ClusterProps`, the props of the native `Cluster`: the shared contract plus every `View` prop.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave C).
 */
import type { ViewProps } from "react-native";

import type { ClusterContractProps } from "#contracts/types/cluster-contract-props.type";

/** Props of the native Cluster. */
export type ClusterProps = ClusterContractProps & Omit<ViewProps, keyof ClusterContractProps>;
