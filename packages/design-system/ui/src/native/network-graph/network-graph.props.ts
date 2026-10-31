/**
 * Stackra file contract:
 * Purpose: `NetworkGraphProps`, the props of the native `NetworkGraph`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { NetworkGraphContractProps } from "#contracts/types/network-graph-contract-props.type";

/** Props of the native NetworkGraph. */
export type NetworkGraphProps = NetworkGraphContractProps & {
  readonly className?: string | undefined;
};
