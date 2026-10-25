/**
 * Stackra file contract:
 * Purpose: the `ApprovalGate` port: the approval step of the action pipeline (durable park and resume). It decides,
 *          from the tenant's approval rules over the call's key, permission, risk and effect tags and its validated
 *          input, whether the call needs an approval; if it does, it parks a request durably and refuses the call
 *          with `approval_required` and the request's id; a resubmission that names a granted request for this same
 *          call runs.
 * Boundary: an abstract class that is its own token, keyed `actions.ApprovalGate`. Which calls need approval, and who
 *           approves, is data (rule sets and settings, ADR 0331), never code: the driver (the OS tasks-approvals
 *           service) evaluates it. A call without a bound gate needs no approval. Actions only; a query is never
 *           parked. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0098 (decision 3: approval, durable park and resume, before idempotency); ADR 0099
 *                     (decision 4: the level and tags are the risk inputs to approval); ADR 0360; ADR 0331.
 */
import { Port } from "@stackra/contracts";

import type { CallDescriptor } from "#contracts/types/call-descriptor.type";

/**
 * Decides and parks approvals.
 *
 * @example
 * export class TaskApprovalGateDriver extends Driver(ApprovalGate) {
 *   async check(call: CallDescriptor, input: unknown, approvalId: string | undefined): Promise<void> {
 *     if (!(await this.rules.needsApproval(call, input))) return;
 *     if (approvalId !== undefined && (await this.requests.isGranted(approvalId, call, input))) return;
 *     throw ApprovalRequiredError.create({ approvalId: await this.requests.park(call, input) });
 *   }
 * }
 */
export abstract class ApprovalGate extends Port {
  /** Type-only port key, so `DriverName<ApprovalGate>` narrows to this port's drivers. */
  declare readonly "~key": "actions.ApprovalGate";

  /**
   * Resolves when `call` with `input` needs no approval, or `approvalId` names a granted approval of it; rejects with
   * `ApprovalRequiredError` (carrying the parked request's id) otherwise.
   */
  abstract check(
    call: CallDescriptor,
    input: unknown,
    approvalId: string | undefined,
  ): Promise<void>;
}
