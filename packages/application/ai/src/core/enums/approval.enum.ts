/**
 * Stackra file contract:
 * Purpose: `Approval`, the human gate an agent's tool call waits for before it runs: the confirmation of the person
 *          the agent acts for, or a named human approver.
 * Boundary: an enum (`Enum.of`) written by gen into a tool row whose permission is L2 or above, from `approvalFor`, and
 *           enforced by the MCP gateway in the ai service; a row without one runs at once. The level lives on the
 *           permission, never on the action (ADR 0099 as amended by ADR 0294).
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decision 5); ADR 0155 (decision 1); ADR 0099 (decision 4); ADR 0021 (decision 5, as
 *                     amended by ADR 0100).
 */
import { Enum } from "@stackra/contracts";

/**
 * The approval a tool call needs.
 *
 * @example
 * { key: "orders.order.cancel@1", from: ToolSource.Action, risk: Risk.L2, approval: Approval.Confirm }
 */
export const Approval = Enum.of({
  /** L2, a reversible write: the person the agent acts for confirms the call; settings may turn it off per action. */
  Confirm: "confirm",
  /** L3 and L4, financial, privileged or destructive: a named human approves each call; it can never be turned off. */
  NamedApprover: "named_approver",
});

/** One of the values above. */
export type Approval = Enum.Value<typeof Approval>;
