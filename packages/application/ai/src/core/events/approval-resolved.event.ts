/**
 * Stackra file contract:
 * Purpose: `ApprovalResolved`, recorded when the approval a run waited on is granted or denied; gen locks its wire name
 *          `ai.approval.resolved.v1` (ADR 0100 decision 11).
 * Boundary: an integration event, recorded on the approval row by the durable `RunStore` driver when its status leaves
 *           `pending`, so it leaves through the outbox in that transaction. It registers this package's own schema when
 *           the module loads.
 * Runtime: isomorphic
 * Governing contract: ADR 0100 (decisions 5 and 11); ADR 0141 (2026-10-23 note); STA-781.
 */
import type { PublicId } from "@stackra/contracts";
import { IntegrationEvent } from "@stackra/events";
import { registerSchemas } from "@stackra/validation";

import { APPROVAL_RESOLVED_SCHEMA } from "#core/constants/approval-resolved-schema.constant";

/**
 * An approval decided.
 *
 * @example
 * export class CloseApprovalTaskListener extends Listener {
 *   async handle(event: ApprovalResolved): Promise<void> { ... }
 * }
 */
export class ApprovalResolved extends IntegrationEvent({ name: "approval.resolved" }) {
  /** The run. */
  runId!: PublicId<"airun">;

  /** The approval gate's request id. */
  approvalId!: string;

  /** The action key. */
  tool!: string;

  /** `granted` or `denied`. */
  status!: "granted" | "denied";
}

registerSchemas([[ApprovalResolved, APPROVAL_RESOLVED_SCHEMA]]);
