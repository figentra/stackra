/**
 * Stackra file contract:
 * Purpose: `ApprovalRequested`, recorded when an agent run parks on a tool call that needs a human approval; gen locks
 *          its wire name `ai.approval.requested.v1` (ADR 0100 decision 11).
 * Boundary: an integration event, recorded on the run row by the durable `RunStore` driver as the run moves to
 *           `waiting_approval`, so it leaves through the outbox in that transaction. It names the action, never its
 *           input. It registers this package's own schema when the module loads.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 5, 9 and 11); ADR 0141 (2026-10-23 note); ADR 0305 (rule 19); STA-781.
 */
import type { PublicId } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { registerSchemas } from "@stackra/validation";

import { APPROVAL_REQUESTED_SCHEMA } from "#core/constants/approval-requested-schema.constant";

/**
 * A run waiting for a human.
 *
 * @example
 * export class NotifyApproverListener extends Listener {
 *   async handle(event: ApprovalRequested): Promise<void> { ... }
 * }
 */
export class ApprovalRequested extends IntegrationEvent({ name: "approval.requested" }) {
  /** The run that waits for the approval. */
  runId!: PublicId<"airun">;

  /** The agent's key. */
  agent!: string;

  /** The approval gate's request id. */
  approvalId!: string;

  /** The action key the parked call dispatches. */
  tool!: string;
}

registerSchemas([[ApprovalRequested, APPROVAL_REQUESTED_SCHEMA]]);
