/**
 * Stackra file contract:
 * Purpose: `ApprovalGranted` (`approval.granted`, version 1; on the wire `actions.approval.granted.v1`), the
 *          integration event the approval store publishes in the grant's transaction when a request reaches its last
 *          vote: the approval id, the action key, the owning service and the tenant, and nothing else.
 * Boundary: ids only. It never carries the input, its hash, the requester or the voters: the owning service reads
 *           who, where and what from its own binding (B1), so a forged or replayed envelope can start no more than
 *           the execution of a request the store already holds as granted. Only `ApprovalExecutorListener` consumes it, and
 *           only from the store's service. It registers its schema when the module loads (STA-339 replaces the
 *           registration).
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (decision 7); ADR 0141; ADR 0294 (decisions 5 and 16); STA-1724 FR-011.
 */
import { IntegrationEvent } from "@stackra/events";
import { registerSchemas } from "@stackra/validation";
import { z } from "zod";

/**
 * One request reached its last vote.
 *
 * @example
 * ApprovalGranted.create({ approvalId: "apr_01j9z3k4m5n6p7q8r9s0t1v2w3", key: "coupon.update@1", service: "billing", scopeId: "ten_1" });
 */
export class ApprovalGranted extends IntegrationEvent({ name: "approval.granted" }) {
  /** The request's id (`apr_…`). */
  approvalId!: string;

  /** The action's locked key. */
  key!: string;

  /** The service that owns the action and so holds the binding. */
  service!: string;

  /** The tenant the request acts in. */
  scopeId!: string;
}

// shortcut: registered here until gen writes the package's #stackra/schemas registration (STA-339).
registerSchemas([
  [
    ApprovalGranted,
    z.object({
      approvalId: z.string(),
      key: z.string(),
      service: z.string(),
      scopeId: z.string(),
    }),
  ],
]);
