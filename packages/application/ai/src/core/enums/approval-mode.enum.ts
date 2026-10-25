/**
 * Stackra file contract:
 * Purpose: `ApprovalMode`, the five approval modes of an agent's tool call, as the owner set them after Claude Code's
 *          permission modes: ask, allow by default, always allow, bypass and escalate.
 * Boundary: an enum (`Enum.of`). `resolveApproval` names the mode that decided a call; the organisation's policy and
 *           the user's preferences name the action keys each mode applies to. No mode passes the never-bypass floor
 *           or relaxes a named approver at L3 and L4.
 * Runtime: isomorphic
 * Governing contract: ADR 0360 (decisions 6 to 9); ADR 0100 (decision 5, as amended by ADR 0360).
 */
import { Enum } from "@stackra/contracts";

/**
 * An approval mode.
 *
 * @example
 * resolveApproval(request, rules); // { outcome: "run", step: "user", mode: ApprovalMode.AlwaysAllow }
 */
export const ApprovalMode = Enum.of({
  /** The agent shows the call and waits for a human to approve it. */
  Ask: "ask",
  /** The organisation lets this kind of call run without a prompt, below the floor only. */
  AllowByDefault: "allow_by_default",
  /** The user told the agent to stop asking about this kind of call, below the floor only. */
  AlwaysAllow: "always_allow",
  /** The user switched one session to skip confirmations, where the organisation allows it and below the floor. */
  Bypass: "bypass",
  /** The approval, and the work when the requester lacks the permission, goes to another human. */
  Escalate: "escalate",
});

/** One of the codes above. */
export type ApprovalMode = Enum.Value<typeof ApprovalMode>;
