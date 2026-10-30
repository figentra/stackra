/**
 * Stackra file contract:
 * Purpose: `ChoroplethMapProps`, the props of the native `ChoroplethMap`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0303; STA-1371.
 */
import type { ChoroplethMapContractProps } from "#contracts/types/choropleth-map-contract-props.type";

/** Props of the native ChoroplethMap. */
export type ChoroplethMapProps = ChoroplethMapContractProps & {
  readonly className?: string | undefined;
};
