/**
 * Stackra file contract:
 * Purpose: `ResumeDecision`, how a parked approval resolved, as the tasks-approvals service reports it to `resume`:
 *          the approval id and whether it was granted.
 * Boundary: a type only. A grant is re-checked by the action pipeline's approval gate when the call runs again with the
 *           id; a denial tells the model the call was not executed.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 2 and 5); ADR 0098 (decision 3); STA-781.
 */

/** A resolved approval. */
export interface ResumeDecision {
  /** The parked request's id. */
  readonly approvalId: string;

  /** Whether the approver granted it. */
  readonly granted: boolean;
}
