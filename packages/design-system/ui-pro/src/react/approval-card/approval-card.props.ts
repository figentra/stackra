/**
 * Stackra file contract:
 * Purpose: `ApprovalCardProps`, props of the web ApprovalCard.
 * Boundary: a type only.
 * Runtime: browser
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0360 (decisions 6 to 9); ADR 0100 (decision 5); ADR 0310
 *                     (decision 3).
 */
import type { ApprovalCardContractProps } from "#contracts/types/approval-card-contract-props.type";

/** Props of the web ApprovalCard. */
export type ApprovalCardProps = ApprovalCardContractProps;
