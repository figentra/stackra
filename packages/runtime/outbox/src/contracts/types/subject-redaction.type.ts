/**
 * Stackra file contract:
 * Purpose: `SubjectRedaction`, what `redactSubjectMessages` did to the outbox messages naming an erased subject: how
 *          many it rewrote and how many it found but could not rewrite (a platform message, which a tenant's erasure
 *          may not change), so an incomplete erasure is never reported as complete.
 * Boundary: a type only; counts, never ids or payloads.
 * Runtime: isomorphic
 * Governing contract: ADR 0189 (decision 2: erasure reaches every copy); ADR 0239 (2026-11-07 amendment, gap C);
 *                     STA-2629.
 */

/** The outcome of one erasure's outbox redaction. */
export interface SubjectRedaction {
  /** Held messages whose personal fields were nulled. */
  readonly rewritten: number;

  /** Held messages that name the subject and carry a personal field but could not be rewritten. */
  readonly unrewritable: number;
}
