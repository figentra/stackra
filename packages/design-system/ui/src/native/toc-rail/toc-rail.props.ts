/**
 * Stackra file contract:
 * Purpose: `TocRailProps`, the props of the native `TocRail`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; STA-1371.
 */
import type { TocRailContractProps } from "#contracts/types/toc-rail-contract-props.type";

/** Props of the native TocRail. */
export type TocRailProps = TocRailContractProps & {
  readonly className?: string | undefined;
};
