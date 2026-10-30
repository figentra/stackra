/**
 * Stackra file contract:
 * Purpose: `DiffReviewProps`, the props of the native `DiffReview`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0303; STA-1371.
 */
import type { DiffReviewContractProps } from "#contracts/types/diff-review-contract-props.type";

/** Props of the native DiffReview. */
export type DiffReviewProps = DiffReviewContractProps & {
  readonly className?: string | undefined;
};
