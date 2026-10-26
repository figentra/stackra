/**
 * Stackra file contract:
 * Purpose: `OpenApprovalGateDriver`, the `ApprovalGate` of an app that has no approvals: every call needs none. The
 *          approval step fails closed (an action with no gate bound is an error), so an app opts out of approvals by
 *          binding this driver on purpose, never by leaving the step unbound.
 * Boundary: decides nothing and parks nothing. A product that takes approval rules binds the OS tasks-approvals driver
 *           instead; the testing pipeline uses this one when a test binds no gate.
 * Runtime: isomorphic
 * Governing contract: ADR 0098 (decision 3: the approval step); ADR 0360 (approval modes); STA-765 (fail closed).
 */
import { Driver } from "@stackra/container";

import { ApprovalGate } from "#contracts/ports/approval-gate.port";

/**
 * Lets every call through the approval step.
 *
 * @example
 * container.bind(ApprovalGate, OpenApprovalGateDriver); // this app has no approvals
 */
export class OpenApprovalGateDriver extends Driver(ApprovalGate) {
  /** Resolves: no call needs an approval. */
  async check(): Promise<void> {}
}
