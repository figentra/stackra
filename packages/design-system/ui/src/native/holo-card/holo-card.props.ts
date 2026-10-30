/**
 * Stackra file contract:
 * Purpose: `HoloCardProps`, the props of the native `HoloCard`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; STA-1371.
 */
import type { HoloCardContractProps } from "#contracts/types/holo-card-contract-props.type";

/** Props of the native HoloCard. */
export type HoloCardProps = HoloCardContractProps & {
  readonly className?: string | undefined;
};
