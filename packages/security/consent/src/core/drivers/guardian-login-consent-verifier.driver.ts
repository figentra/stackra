/**
 * Stackra file contract:
 * Purpose: `GuardianLoginConsentVerifierDriver`, the `guardian_login` `ConsentVerifier`: it passes a consent given for
 *          another only when the evidence is a guardian sign-in attestation the server signed
 *          (`GuardianLoginAttestationIssuer`) for that very guardian, person and document, and it is still in date; its
 *          reference is the attestation's id, which `ConsentProofService` keeps on the proof.
 * Boundary: a `ConsentVerifier` driver a host binds in place of the `none` driver when its market pack names
 *           `guardian_login`. It runs that one method: any other method answers `{ verified: false }`, as the port
 *           requires. It trusts the keys of `ConsentSnapshotKeys` (the consent signer's), so a Worker or a second
 *           service verifies with public keys alone. A token that is malformed, foreign (a consent snapshot), signed by
 *           an untrusted key, badly signed, bound to another guardian, person or document, issued in the future past
 *           the clock skew, or expired answers not verified and never throws; only a failure to read the keys throws,
 *           and then nothing is recorded. Stateless.
 * Runtime: isomorphic
 * Governing contract: ADR 0454 (Consequences: the verification method port); ADR 0263 (a driver is named by its class:
 *                     `guardian_login`); ADR 0416 (signer keys); STA-1323; STA-2818.
 */
import { Driver } from "@stackra/container";
import { verifySignature } from "@stackra/contracts";
import type { Clock } from "@stackra/contracts";

import type { ConsentConfig } from "#config/consent.config";
import { ConsentVerificationMethod } from "#contracts/enums/consent-verification-method.enum";
import type { ConsentSnapshotKeys } from "#contracts/ports/consent-snapshot-keys.port";
import { ConsentVerifier } from "#contracts/ports/consent-verifier.port";
import type { ConsentVerification } from "#contracts/types/consent-verification.type";
import type { ConsentVerificationRequest } from "#contracts/types/consent-verification-request.type";
import { decodeGuardianLoginAttestation } from "#core/functions/decode-guardian-login-attestation.function";

/** The answer for anything that did not pass. */
const NOT_VERIFIED: ConsentVerification = Object.freeze({ verified: false });

/**
 * Checks guardian sign-in attestations.
 *
 * @example
 * container.bind(ConsentVerifier, GuardianLoginConsentVerifierDriver);
 */
export class GuardianLoginConsentVerifierDriver extends Driver(ConsentVerifier) {
  /** The allowed clock skew. */
  private readonly config: ConsentConfig;

  /** The public keys an attestation may be signed with. */
  private readonly keys: ConsentSnapshotKeys;

  /** The current time. */
  private readonly clock: Clock;

  /**
   * @param config - the allowed clock skew.
   * @param keys - the public keys an attestation may be signed with (the consent signer's).
   * @param clock - the current time.
   */
  constructor(config: ConsentConfig, keys: ConsentSnapshotKeys, clock: Clock) {
    super();
    this.config = config;
    this.keys = keys;
    this.clock = clock;
  }

  /**
   * Whether `request` carries a valid guardian sign-in attestation for its guardian, person and document.
   *
   * @throws Error when the trusted keys cannot be read; the consent is then not recorded.
   */
  async verify(request: ConsentVerificationRequest): Promise<ConsentVerification> {
    if (request.method !== ConsentVerificationMethod.GuardianLogin) return NOT_VERIFIED;
    const decoded = decodeGuardianLoginAttestation(request.evidence);
    if (decoded === null) return NOT_VERIFIED;
    const { attestation, message, signature } = decoded;
    const key = (await this.keys.trusted()).find((item) => item.keyId === signature.keyId);
    if (key === undefined || !(await verifySignature(key, message, signature))) return NOT_VERIFIED;
    if (
      attestation.givenBy !== request.givenBy ||
      attestation.subject !== request.subject ||
      attestation.document !== request.document
    )
      return NOT_VERIFIED;
    const now = this.clock.now().getTime();
    if (Date.parse(attestation.issuedAt) > now + this.config.snapshotClockSkewSeconds * 1000)
      return NOT_VERIFIED;
    if (Date.parse(attestation.expiresAt) <= now) return NOT_VERIFIED;
    return Object.freeze({ verified: true, reference: attestation.id });
  }
}
