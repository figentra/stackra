/**
 * Stackra file contract:
 * Purpose: `ApprovalCardProps`, props of the native ApprovalCard.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (`<name>.props.ts`); ADR 0360 (decisions 6 to 9); ADR 0100 (decision 5); ADR 0310
 *                     (decision 3); WCAG 2.2 SC 1.4.1.
 */
import type { ApprovalCardContractProps } from "#contracts/types/approval-card-contract-props.type";

/** Props of the native ApprovalCard. */
export type ApprovalCardProps = ApprovalCardContractProps;
