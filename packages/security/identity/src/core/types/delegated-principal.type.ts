/**
 * Stackra file contract:
 * Purpose: `DelegatedPrincipal`, a guardian acting for a minor: the minor the action is for, the guardian doing it, the
 *          relationship that allows it, the purpose and when.
 * Boundary: a type only, `GuardianActingService.actFor`'s answer; the action records it in its audit and the consent
 *           proof (`ConsentProof.givenBy`, `relationship`). It grants nothing by itself: the guardian's own permissions
 *           still decide.
 * Runtime: isomorphic
 * Governing contract: OS-284 (a delegated principal with a relationship check); ADR 0098 (the actor chain).
 */
import type { PublicId } from "@stackra/contracts";

/** A guardian acting for a minor. */
export interface DelegatedPrincipal {
  /** The minor the action is for. */
  readonly principal: PublicId;

  /** The guardian doing it. */
  readonly actingBy: PublicId;

  /** The relationship that allows it (`parent`). */
  readonly relationship: string;

  /** What it is for (`enrolment`, `photos`, `pickup`). */
  readonly purpose: string;

  /** When the check passed. */
  readonly at: Date;
}
