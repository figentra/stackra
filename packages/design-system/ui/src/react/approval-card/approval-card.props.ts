/**
 * Stackra file contract:
 * Purpose: `ApprovalCardProps`, the props of the web `ApprovalCard` in `approval-card.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0507.
 */
import type { ApprovalCardContractProps } from "#contracts/types/approval-card-contract-props.type";

/** Props of the web ApprovalCard: the shared contract plus a class for its root. */
export type ApprovalCardProps = ApprovalCardContractProps & {
  /** Classes added to the root. */
  readonly className?: string | undefined;
};
