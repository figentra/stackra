/**
 * Stackra file contract:
 * Purpose: `NoneConsentVerifierDriver`, the kit's default `ConsentVerifier`: it runs no method, so every verification
 *          fails closed.
 * Boundary: the only verifier the package ships; a host whose market pack names a method binds a real one with
 *           `@Replaces(ConsentVerifier)`. Until then a consent that needs verification is refused, never recorded
 *           unverified. Stateless.
 * Runtime: isomorphic
 * Governing contract: ADR 0263 (a driver is named by its class: `none`); ADR 0454 (Consequences); STA-1323.
 */
import { Driver } from "@stackra/container";

import { ConsentVerifier } from "#contracts/ports/consent-verifier.port";
import type { ConsentVerification } from "#contracts/types/consent-verification.type";

/**
 * The fail-closed verifier: it runs no method, so every consent that needs verification is refused.
 *
 * @example
 * await new NoneConsentVerifierDriver().verify(request); // { verified: false }
 */
export class NoneConsentVerifierDriver extends Driver(ConsentVerifier) {
  /** Answers not verified, whatever the method. */
  verify(): Promise<ConsentVerification> {
    return Promise.resolve({ verified: false });
  }
}
