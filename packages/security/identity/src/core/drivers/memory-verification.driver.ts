/**
 * Stackra file contract:
 * Purpose: `MemoryVerificationDriver`, a `Verification` provider for tests and local runs: it supports the kinds it is
 *          given and answers each check with the status set for its reference (pending by default).
 * Boundary: process-local; never a real check. It records the requests it saw, without their facts.
 * Runtime: isomorphic
 * Governing contract: OS-54; ADR 0263 (a driver is named by its class: `memory`).
 */
import { Driver } from "@stackra/container";
import type { Clock } from "@stackra/contracts";

import { Verification, VerificationStatus } from "#contracts/index";
import type { VerificationKind, VerificationRequest, VerificationResult } from "#contracts/index";

/**
 * A provider held in memory.
 *
 * @example
 * const provider = new MemoryVerificationDriver([VerificationKind.Company], clock);
 * provider.answer("chk_1", VerificationStatus.Verified);
 */
export class MemoryVerificationDriver extends Driver(Verification) {
  /** The references it was asked, in order. */
  readonly seen: string[] = [];

  /** The kinds it answers. */
  private readonly kinds: readonly VerificationKind[];

  /** The time of an answer. */
  private readonly clock: Clock;

  /** Reference to the status set for it. */
  private readonly answers = new Map<string, VerificationStatus>();

  /**
   * @param kinds - the kinds it supports.
   * @param clock - the time an answer carries.
   */
  constructor(kinds: readonly VerificationKind[], clock: Clock) {
    super();
    this.kinds = kinds;
    this.clock = clock;
  }

  /** Sets the status the check `reference` gets. */
  answer(reference: string, status: VerificationStatus): void {
    this.answers.set(reference, status);
  }

  /** Whether it answers `kind`. */
  supports(kind: VerificationKind): boolean {
    return this.kinds.includes(kind);
  }

  /** The status set for the request's reference, pending when none is set. */
  async verify(request: VerificationRequest): Promise<Omit<VerificationResult, "provider">> {
    this.seen.push(request.reference);
    const status = this.answers.get(request.reference) ?? VerificationStatus.Pending;
    return {
      status,
      providerReference: `memory:${request.reference}`,
      checkedAt: this.clock.now(),
      reasons: status === VerificationStatus.Rejected ? ["rejected_by_memory_provider"] : [],
    };
  }
}
