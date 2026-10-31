/**
 * Stackra file contract:
 * Purpose: `TamoDraftReviewProps`, the props of the native `TamoDraftReview` in `tamo-draft-review.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0507.
 */
import type { TamoDraftReviewContractProps } from "#contracts/types/tamo-draft-review-contract-props.type";

/** Props of the native TamoDraftReview: the shared contract plus a class for its root. */
export type TamoDraftReviewProps = TamoDraftReviewContractProps & {
  /** Classes added to the root. */
  readonly className?: string | undefined;
};
