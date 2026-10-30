/**
 * Stackra file contract:
 * Purpose: `ShimmerProps`, the props of the native `Shimmer`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371 (wave D, owner approval
 *          2026-10-30).
 */
import type { ShimmerContractProps } from "#contracts/types/shimmer-contract-props.type";

/** Props of the native Shimmer. */
export type ShimmerProps = ShimmerContractProps & {
  /** Styles the text or the block of lines. */
  readonly className?: string | undefined;
};
