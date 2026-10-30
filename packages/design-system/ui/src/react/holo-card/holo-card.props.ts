/**
 * Stackra file contract:
 * Purpose: `HoloCardProps`, the props of the web `HoloCard`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { HoloCardContractProps } from "#contracts/types/holo-card-contract-props.type";

/** Props of the web HoloCard. */
export type HoloCardProps = HoloCardContractProps & {
  readonly className?: string | undefined;
};
