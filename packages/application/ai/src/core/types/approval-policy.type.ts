/**
 * Stackra file contract:
 * Purpose: `ApprovalPolicy`, the organisation's approval policy within the floor: the action keys that run without a
 *          prompt, the keys that always ask, the keys whose approval escalates to another human, and whether a user
 *          may switch a session to bypass.
 * Boundary: a type only; a managed setting of the tenant, edited in its admin and changed only through a sandbox
 *           (a change to the approval modes is itself on the floor). It may only tighten what the floor allows.
 * Runtime: isomorphic
 * Governing contract: ADR 0360 (decisions 6, 7 and 9).
 */

/** The organisation's layer. */
export interface ApprovalPolicy {
  /** Action keys that run without a prompt (allow by default). */
  readonly allowByDefault: readonly string[];

  /** Action keys that always ask, whatever the user's preferences. */
  readonly ask: readonly string[];

  /** Action keys whose approval goes to another human. */
  readonly escalate: readonly string[];

  /** Whether a user may switch a session to bypass. */
  readonly bypass: boolean;
}
