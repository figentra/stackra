/**
 * Stackra file contract:
 * Purpose: `ActionDraft`, what `ActionPipeline.propose` answers: the action's key, the call id and the input that
 *          passed every check before approval (tenancy, permission, preconditions, entitlement, flag, validation),
 *          as a draft a person may apply later; nothing was written and no effect ran.
 * Boundary: a type only. The caller keeps the draft (an agent's suggestion in its conversation, a review queue); to
 *           apply it, a person runs the same action with the draft's input, through every step again.
 * Runtime: isomorphic
 * Governing contract: R3-SO-02 and J2-6 (suggest = propose: validated input as a draft, no effects, metered); ADR 0360.
 */

/** A proposed call. */
export interface ActionDraft {
  /** The action's locked key, else its written key. */
  readonly key: string;

  /** The call's id, shared by its usage event. */
  readonly callId: string;

  /** The validated input, as the action would receive it. */
  readonly input: unknown;

  /** The pipeline clock's reading when the draft was made. */
  readonly proposedAt: Date;
}
