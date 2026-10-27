/**
 * Stackra file contract:
 * Purpose: the `ConsentVerifier` port: checks that a consent given for another person passed the verification method
 *          the market pack names (card check, signed form, guardian login).
 * Boundary: an abstract class that is its own token. The services that run the methods implement it (payments for a
 *           card check, documents for a signed form, identity for a guardian login) and a host binds its class with
 *           `@Replaces(ConsentVerifier)`; the kit ships only the fail-closed `none` driver. A verifier never decides
 *           which method applies (that is pack data the caller reads) and answers `verified: false` for a method it
 *           does not run.
 * Runtime: isomorphic
 * Governing contract: ADR 0454 (Consequences: the verification method port); review round 2 A2-2; OS-284; ADR 0263;
 *                     STA-1323.
 */
import { Port } from "@stackra/contracts";

import type { ConsentVerification } from "#contracts/types/consent-verification.type";
import type { ConsentVerificationRequest } from "#contracts/types/consent-verification-request.type";

/**
 * Verifies consent given on another's behalf.
 *
 * @example
 * export class CardCheckConsentVerifierDriver extends Driver(ConsentVerifier) { … }
 */
export abstract class ConsentVerifier extends Port {
  /**
   * Whether `request` passed its method's check.
   *
   * @throws Error when the check cannot be read; the consent is then not recorded.
   */
  abstract verify(request: ConsentVerificationRequest): Promise<ConsentVerification>;
}
