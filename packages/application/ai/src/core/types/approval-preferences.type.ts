/**
 * Stackra file contract:
 * Purpose: `ApprovalPreferences`, the user's layer within the organisation's policy: the action keys they told the
 *          agent to stop asking about, and whether the current session is switched to bypass.
 * Boundary: a type only; a user setting plus the session's switch. Bypass counts only where the organisation's policy
 *           allows it, and neither preference passes the floor or a named approver.
 * Runtime: isomorphic
 * Governing contract: ADR 0360 (decisions 6 and 7).
 */

/** The user's layer. */
export interface ApprovalPreferences {
  /** Action keys remembered as "always allow". */
  readonly alwaysAllow: readonly string[];

  /** Whether this session is switched to bypass. */
  readonly bypass: boolean;
}
