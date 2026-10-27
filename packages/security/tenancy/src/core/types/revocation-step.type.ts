/**
 * Stackra file contract:
 * Purpose: `RevocationStep`, what revocation does to one received copy: keep it as a severed copy, or delete it.
 * Boundary: a type only, an element of `revocationPlan`'s answer; the receiving service carries it out.
 * Runtime: isomorphic
 * Governing contract: ADR 0343 (decision 5).
 */
import type { RevokedCopy } from "#core/enums/revoked-copy.enum";
import type { ReceivedCopy } from "#core/types/received-copy.type";

/** One copy's fate. */
export interface RevocationStep {
  /** The received copy this step revokes. */
  readonly copy: ReceivedCopy;

  /** Keep (marked severed) or delete. */
  readonly action: RevokedCopy;
}
