/**
 * Stackra file contract:
 * Purpose: `OpenApprovalGateDriver`, an `ApprovalGate` under which every call needs no approval. An app with no
 *          gate bound already skips the approval step, so this driver is for an app that wants actions declaring
 *          `approval: true` to run without approvals (a demo, a single-operator install) and says so by binding it.
 * Boundary: decides nothing and parks nothing. A product that takes approval rules binds the OS tasks-approvals driver
 *           instead.
 * Runtime: isomorphic
 * Governing contract: ADR 0098 (decision 3: the approval step); ADR 0360 (approval modes); STA-813 (an unbound step does not run).
 */
import { Driver } from "@stackra/container";

import { ApprovalGate } from "#contracts/ports/approval-gate.port";

/**
 * Lets every call through the approval step.
 *
 * @example
 * container.bind(ApprovalGate, OpenApprovalGateDriver); // `approval: true` actions run without approvals here
 */
export class OpenApprovalGateDriver extends Driver(ApprovalGate) {
  /** Resolves: no call needs an approval. */
  async check(): Promise<void> {}
}
