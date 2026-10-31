/**
 * Stackra file contract:
 * Purpose: `RatingProps`, the props of the native `Rating`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0305 (one declaration per file); STA-1371.
 */
import type { RatingContractProps } from "#contracts/types/rating-contract-props.type";

/** Props of the native Rating. */
export type RatingProps = RatingContractProps & {
  /** Styles the root. */
  readonly className?: string | undefined;
};
