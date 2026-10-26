/**
 * Stackra file contract:
 * Purpose: `ApprovalFloor`, the never-bypass floor as data: the effect tags, tag sets, recipient count and agent
 *          deletes that always need a named human, whatever the organisation's policy, the user's mode or the session.
 * Boundary: a type only. The values are Figentra's platform floor (`settings:platform-floor:*` keys, locked at platform
 *           level) and, as a second floor of the same shape, a market pack's legal floor, never constants in code; `resolveApproval` holds only the check
 *           that a floor is never crossed. L3 and L4 need a named human by level (`approvalFor`), apart from this.
 * Runtime: isomorphic
 * Governing contract: ADR 0360 (decisions 8 and 10); config-model section 7 (the check is code, the floor's value is
 *                     data); ADR 0099 (effect tags).
 */

/** The floor no mode passes. */
export interface ApprovalFloor {
  /** Effect tags any one of which needs a named human (`financial`, `irreversible`, `security`). */
  readonly tags: readonly string[];

  /** Tag sets all of whose tags together need a named human (`["external-communication", "bulk"]`). */
  readonly tagSets: readonly (readonly string[])[];

  /** A send to more recipients than this needs a named human; no limit when absent. */
  readonly recipientLimit?: number;

  /** Whether every delete an agent performs, soft deletes included, needs a person first. */
  readonly deletes: boolean;

  /**
   * Action keys an agent may at most do after a named approver approves (a market pack's legal list: conflict
   * decisions, signing, filing, client-money payout); none when absent.
   */
  readonly actions?: readonly string[];
}
