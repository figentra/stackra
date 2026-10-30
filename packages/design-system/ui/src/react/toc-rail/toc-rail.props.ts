/**
 * Stackra file contract:
 * Purpose: `TocRailProps`, the props of the web `TocRail`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { TocRailContractProps } from "#contracts/types/toc-rail-contract-props.type";

/** Props of the web TocRail. */
export type TocRailProps = TocRailContractProps & {
  readonly className?: string | undefined;
};
