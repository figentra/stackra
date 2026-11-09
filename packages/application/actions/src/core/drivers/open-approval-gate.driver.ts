/**
 * Stackra file contract:
 * Purpose: `OpenApprovalGateDriver`, an `ApprovalGate` under which every call needs no approval. An app with no
 *          gate bound already skips the approval step, so this driver is for an app that wants actions declaring
 *          `approval: true` to run without approvals (a demo, a single-operator install) and says so by binding it.
 * Boundary: decides nothing and parks nothing; an action that declares an approval stage fails closed with it bound (ADR 0509). A product that takes approval rules binds the OS tasks-approvals driver
 *           instead.
 * Runtime: isomorphic
 * Governing contract: ADR 0098 (decision 3: the approval step); ADR 0360 (approval modes); STA-813 (an unbound step does not run).
 */
import { Driver } from "@stackra/container";

import { ApprovalGate } from "#contracts/ports/approval-gate.port";
import type { ApprovalDraft } from "#contracts/types/approval-draft.type";
import type { ApprovalRecord } from "#contracts/types/approval-record.type";
import type { ApprovalRequirement } from "#contracts/types/approval-requirement.type";

/**
 * Lets every call through the approval step.
 *
 * @example
 * container.bind(ApprovalGate, OpenApprovalGateDriver); // `approval: true` actions run without approvals here
 */
export class OpenApprovalGateDriver extends Driver(ApprovalGate) {
  /** Adds nothing: the rules need no approval. A declared stage still applies (the pipeline enforces it). */
  async decide(
    _call: unknown,
    _input: unknown,
    _declared: ApprovalRequirement | undefined,
  ): Promise<ApprovalRequirement | undefined> {
    return undefined;
  }

  /**
   * Cannot park: nothing stores a request here, and a declared stage fails closed with this driver bound.
   *
   * @throws Error always.
   */
  async park(_draft: ApprovalDraft): Promise<void> {
    throw new Error("OpenApprovalGateDriver cannot park a request: bind a real ApprovalGate");
  }

  /** Has no request. */
  async find(_approvalId: string): Promise<ApprovalRecord | undefined> {
    return undefined;
  }

  /** Never begins a request; always resolves false. */
  async begin(_approvalId: string, _executionKey: string): Promise<boolean> {
    return false;
  }

  /** Never settles a request; always resolves false. */
  async settle(): Promise<boolean> {
    return false;
  }
}
