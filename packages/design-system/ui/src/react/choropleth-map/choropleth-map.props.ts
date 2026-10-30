/**
 * Stackra file contract:
 * Purpose: `ChoroplethMapProps`, the props of the web `ChoroplethMap`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); STA-1371.
 */
import type { ChoroplethMapContractProps } from "#contracts/types/choropleth-map-contract-props.type";

/** Props of the web ChoroplethMap. */
export type ChoroplethMapProps = ChoroplethMapContractProps & {
  readonly className?: string | undefined;
};
