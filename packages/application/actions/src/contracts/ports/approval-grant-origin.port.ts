/**
 * Stackra file contract:
 * Purpose: the `ApprovalGrantOrigin` port: whether a delivered `approval.granted` envelope came from the approval
 *          store's service, so `ApprovalExecutorListener` acts on no other.
 * Boundary: an abstract class that is its own token, keyed `actions.ApprovalGrantOrigin`. The driver decides from what
 *           the transport verified (the producing service of the envelope), never from the event's own fields. The
 *           executor fails closed with none bound: it cannot be built without one. The OS tasks-approvals package
 *           ships the real driver. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0509 (decision 7: envelopes from the store's service only); STA-1724 FR-011.
 */
import { Port } from "@stackra/contracts";
import type { ListenerContext } from "@stackra/events";

/**
 * Tells whether a delivery came from the store's service. Interim: a verified producer on the envelope replaces this
 * port (STA-1792).
 *
 * @example
 * export class BrokerApprovalGrantOriginDriver extends Driver(ApprovalGrantOrigin) {
 *   async trusts(ctx: ListenerContext): Promise<boolean> {
 *     return this.verified.producerOf(ctx.eventId) === this.storeService;
 *   }
 * }
 */
export abstract class ApprovalGrantOrigin extends Port {
  /** Type-only port key, so `DriverName<ApprovalGrantOrigin>` narrows to this port's drivers. */
  declare readonly "~key": "actions.ApprovalGrantOrigin";

  /** Resolves true only when the delivery described by `ctx` was published by the approval store's service. */
  abstract trusts(ctx: ListenerContext): Promise<boolean>;
}
