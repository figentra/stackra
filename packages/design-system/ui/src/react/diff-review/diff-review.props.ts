/**
 * Stackra file contract:
 * Purpose: `DiffReviewProps`, the props of the web `DiffReview`: the shared contract and a class name.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); STA-1371.
 */
import type { DiffReviewContractProps } from "#contracts/types/diff-review-contract-props.type";

/** Props of the web DiffReview. */
export type DiffReviewProps = DiffReviewContractProps & {
  readonly className?: string | undefined;
};
