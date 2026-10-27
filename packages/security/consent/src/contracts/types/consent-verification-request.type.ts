/**
 * Stackra file contract:
 * Purpose: `ConsentVerificationRequest`, what `ConsentVerifier` is asked: whether `givenBy`'s consent for `subject` to
 *          `document` passed the market's verification `method`, given the evidence that method's flow produced.
 * Boundary: a type in the leaf entry; ids only. `evidence` is opaque here (a card authorisation id, a signed form's
 *           document id, a guardian sign-in session id); only the verifier that runs the method reads it.
 * Runtime: isomorphic
 * Governing contract: ADR 0454 (Consequences); review round 2 A2-2; STA-1323.
 */
import type { PublicId } from "@stackra/contracts";

import type { ConsentVerificationMethod } from "#contracts/enums/consent-verification-method.enum";

/**
 * One verification to check.
 *
 * @example
 * await verifier.verify({ method, subject: child.id, givenBy: parent.id, document: "photos", evidence: authId });
 */
export interface ConsentVerificationRequest {
  /** The method the market pack names. */
  readonly method: ConsentVerificationMethod;

  /** The person the consent is about. */
  readonly subject: PublicId;

  /** The person giving it on the subject's behalf. */
  readonly givenBy: PublicId;

  /** The document or purpose key (`terms`, `photos`). */
  readonly document: string;

  /** What the method's flow produced, for the verifier to check. */
  readonly evidence: string;
}
