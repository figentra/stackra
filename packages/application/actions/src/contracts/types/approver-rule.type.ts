/**
 * Stackra file contract:
 * Purpose: `ApproverRule`, who may grant a parked approval: the seat kind the approver must hold (a lawyer seat), that
 *          the approver is not the requester (nor the human an agent acts for), and that the approver stepped up
 *          (fresh strong authentication) before granting.
 * Boundary: a type only. The values are a row of the rule set (`rule-set:os:ai-action-permissions`), never code; seat
 *           kinds come from entitlements and step-up from identity. The `ApprovalGate` driver reads the row and checks
 *           a grant with `approverRefusal`.
 * Runtime: isomorphic
 * Governing contract: R3-SO-02 (`{ seatKind, notRequester, stepUp }` from the rule set); J2-6 (a named lawyer is a
 *                     member on a lawyer seat); ADR 0360 (an agent never approves its own call).
 */

/** The rule an approver must meet. */
export interface ApproverRule {
  /** The seat kind the approver holds (`lawyer`); any seat when absent. */
  readonly seatKind?: string;

  /** Whether the requester, and the human an agent acts for, are refused as approvers. */
  readonly notRequester: boolean;

  /** Whether the approver must have stepped up before granting. */
  readonly stepUp: boolean;
}
