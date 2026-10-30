/**
 * Stackra file contract:
 * Purpose: `ClusterProps`, the props of the web `Cluster`: the shared contract plus every `div` prop.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave C).
 */
import type { ComponentPropsWithRef } from "react";

import type { ClusterContractProps } from "#contracts/types/cluster-contract-props.type";

/** Props of the web Cluster. */
export type ClusterProps = ClusterContractProps &
  Omit<ComponentPropsWithRef<"div">, keyof ClusterContractProps>;
