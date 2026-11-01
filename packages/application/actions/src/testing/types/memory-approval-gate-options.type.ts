/**
 * Stackra file contract:
 * Purpose: `MemoryApprovalGateOptions`: what the memory approval gate is built from: the identity it asks about
 *          people, the clock it measures windows by, the pending cap per requester and action, and the rules it
 *          answers `decide` with.
 * Boundary: a type only, for tests.
 * Runtime: node
 * Governing contract: ADR 0509; STA-1724 FR-005, FR-010, FR-021.
 */
import type { Clock, IdentityResolver } from "@stackra/contracts";

import type { ApprovalRequirement } from "#contracts/types/approval-requirement.type";
import type { CallDescriptor } from "#contracts/types/call-descriptor.type";

/** The construction of a `MemoryApprovalGateDriver`. */
export interface MemoryApprovalGateOptions {
  /** Answers who a person is, for the self-approval and one-vote-per-person checks. */
  readonly identity: IdentityResolver;

  /** The time source of expiry. */
  readonly clock: Clock;

  /** Pending requests allowed per requester and action; `10` when absent. */
  readonly cap?: number;

  /** The tenant rules: what the call needs beyond its declaration; nothing when absent. */
  readonly decide?: (
    call: CallDescriptor,
    input: unknown,
    declared: ApprovalRequirement | undefined,
  ) => ApprovalRequirement | undefined;
}
