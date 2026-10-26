/**
 * Stackra file contract:
 * Purpose: `ActionPermission`, the four editable states of one row of the AI action permission matrix, in the words a
 *          tenant admin reads: off, suggest, after approval, on its own.
 * Boundary: an enum (`Enum.of`), snake_case codes (ADR 0231). Each state maps once onto the approval vocabulary: off =
 *           the tool is not registered for that role and record (the MCP filter drops it), suggest = the call runs in
 *           propose mode (a draft, no effects), after approval = a named approver with the rule's step-up, on its own =
 *           allow. A state never passes the never-bypass floor or a market pack's legal floor.
 * Runtime: isomorphic
 * Governing contract: X2-12, J2-6 and A2-24 (one `rule-set:os:ai-action-permissions` record, four states); R3-SO-02;
 *                     ADR 0360 (decisions 6 to 10).
 */
import { Enum } from "@stackra/contracts";

/**
 * A matrix state.
 *
 * @example
 * { action: "legal.claim.file@1", role: "associate", state: ActionPermission.AfterApproval }
 */
export const ActionPermission = Enum.of({
  /** The tool is not registered for the row's role and record. */
  Off: "off",
  /** The agent proposes: validated input becomes a draft, nothing is written, the proposal is metered. */
  Suggest: "suggest",
  /** A named approver who meets the row's approver rule approves each call. */
  AfterApproval: "after_approval",
  /** The call runs without a prompt, below the floor only. */
  OnItsOwn: "on_its_own",
});

/** One of the codes above. */
export type ActionPermission = Enum.Value<typeof ActionPermission>;
